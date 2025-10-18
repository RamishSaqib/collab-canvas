import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { CanvasObject } from '../lib/types';
import { useFirestore } from './useFirestore';
import { useRealtimeSync, type ActiveShape } from './useRealtimeSync';
import { useHistory } from './useHistory';
import type { User } from '../lib/types';
import { collection, query, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  CreateShapeCommand,
  DeleteShapeCommand,
  UpdateShapeCommand,
  MultiShapeCommand,
  // MoveShapeCommand, // TODO: Add when implementing drag command
  // TransformShapeCommand, // TODO: Add when implementing transform command
} from '../utils/commands';

interface UseCanvasReturn {
  shapes: CanvasObject[];
  selectedShapeIds: string[];
  activeShapes: Map<string, ActiveShape>;
  createShape: (x: number, y: number, createdBy: string, type?: 'rectangle' | 'circle' | 'triangle' | 'text', color?: string) => CanvasObject;
  batchCreateShapes: (shapes: Omit<CanvasObject, 'id' | 'lastModifiedAt'>[]) => Promise<CanvasObject[]>;
  updateShape: (id: string, updates: Partial<CanvasObject>) => void;
  updateShapes: (ids: string[], updates: Partial<CanvasObject>) => void;
  deleteShape: (id: string) => void;
  deleteShapes: (ids: string[]) => void;
  batchDeleteShapes: (ids: string[]) => Promise<void>;
  duplicateShapes: (ids: string[], createdBy: string) => CanvasObject[];
  selectShapes: (ids: string[]) => void;
  toggleShapeSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  getShape: (id: string) => CanvasObject | undefined;
  // RTDB operations
  updateActivePosition: (shapeId: string, x: number, y: number) => void;
  updateActiveText: (shapeId: string, text: string) => void;
  markShapeActive: (shapeId: string, x: number, y: number, type?: 'drag' | 'edit') => void;
  markShapeInactive: (shapeId: string) => void;
  // History operations
  undo: () => string | null;
  redo: () => string | null;
  canUndo: boolean;
  canRedo: boolean;
  // Command-based operations for undo/redo support
  createShapeWithHistory: (x: number, y: number, createdBy: string, type?: 'rectangle' | 'circle' | 'triangle' | 'text', color?: string) => CanvasObject;
  batchCreateShapesWithHistory: (specs: Array<{ x: number; y: number; createdBy: string; type?: 'rectangle' | 'circle' | 'triangle' | 'text'; color?: string }>, description?: string) => CanvasObject[];
  deleteShapesWithHistory: (ids: string[]) => void;
  updateShapesWithHistory: (ids: string[], oldStates: Map<string, Partial<CanvasObject>>, newStates: Map<string, Partial<CanvasObject>>) => void;
  // Manual save support
  saveAllShapesToFirestore: () => Promise<void>;
}

interface UseCanvasProps {
  user: User;
  projectId: string;
  onShapesChange?: () => void;
}

export function useCanvas({ user, projectId }: UseCanvasProps): UseCanvasReturn {
  const [firestoreShapes, setFirestoreShapes] = useState<CanvasObject[]>([]);
  const [activeShapes, setActiveShapes] = useState<Map<string, ActiveShape>>(new Map());
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  
  const { batchSaveObjects, deleteObject, batchDeleteObjects, subscribeToObjects } = useFirestore({ projectId });
  const {
    updateActivePosition,
    updateActiveText,
    markShapeActive,
    markShapeInactive,
    subscribeToActiveShapes,
    isAvailable: isRTDBAvailable,
  } = useRealtimeSync({
    projectId,
    userId: user.id,
    userName: user.name,
    userColor: user.color,
  });

  // History system for undo/redo
  const history = useHistory();
  
  // Track if we're in the initial load to avoid saving remote changes back to Firestore
  const isInitialLoadRef = useRef(true);
  // Track locally created shapes to avoid duplicate saves
  const locallyCreatedRef = useRef<Set<string>>(new Set());

  // Subscribe to Firestore updates on mount (only once)
  useEffect(() => {
    console.log('Setting up Firestore subscription...');
    
    const unsubscribe = subscribeToObjects(
      (firestoreObjects) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`🔥 Firestore update received (${timestamp}):`, firestoreObjects.length, 'shapes');
        console.log('   Shape IDs:', firestoreObjects.map(s => s.id.substring(0, 8)).join(', ') || 'none');
        console.log('   Shape types:', firestoreObjects.map(s => s.type).join(', ') || 'none');
        
        // Update Firestore shapes state
        setFirestoreShapes(firestoreObjects);
        
        // After initial load, allow saves
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          console.log(`✅ Initial load complete, loaded ${firestoreObjects.length} shapes`);
        } else {
          console.log('🔄 Real-time sync update - shapes changed!');
        }
      },
      (error) => {
        console.error('❌ Firestore subscription error:', error);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up Firestore subscription');
      unsubscribe();
      
      // Manual save mode - don't flush updates on unmount
      console.log('⚠️ Manual save mode - not flushing updates');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Subscribe to Realtime Database active shapes
  useEffect(() => {
    if (!isRTDBAvailable()) {
      console.warn('⚠️ RTDB not available, falling back to Firestore-only mode');
      return;
    }

    console.log('Setting up RTDB active shapes subscription...');
    
    const unsubscribe = subscribeToActiveShapes(
      (activeShapesMap) => {
        console.log('⚡ RTDB active shapes update:', activeShapesMap.size, 'active');
        setActiveShapes(activeShapesMap);
      },
      (error) => {
        console.error('❌ RTDB subscription error:', error);
      }
    );

    return () => {
      console.log('🧹 Cleaning up RTDB subscription');
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribeToActiveShapes, isRTDBAvailable]);

  // Manual save mode - don't auto-flush on page unload
  // User must explicitly click "Save Project" to persist changes
  // useBeforeUnload(flushAllUpdates); // Disabled for manual save mode

  // Merge Firestore shapes with RTDB active shapes and sort by zIndex
  const shapes = React.useMemo(() => {
    const mergedShapes = firestoreShapes.map(shape => {
      const activeShape = activeShapes.get(shape.id);
      
      // If shape is actively being edited by someone
      if (activeShape) {
        // Prioritize RTDB data for position and text
        return {
          ...shape,
          x: activeShape.type === 'drag' ? activeShape.x : shape.x,
          y: activeShape.type === 'drag' ? activeShape.y : shape.y,
          text: activeShape.type === 'edit' && activeShape.text ? activeShape.text : shape.text,
        };
      }
      
      return shape;
    });

    // Sort by zIndex (lower zIndex renders first/behind)
    return mergedShapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [firestoreShapes, activeShapes]);

  // Create a new shape
  const createShape = useCallback((x: number, y: number, createdBy: string, type: 'rectangle' | 'circle' | 'triangle' | 'text' = 'rectangle', color?: string): CanvasObject => {
    console.log('🆕 createShape called - type:', type, 'at:', x, y);
    
    const baseShape = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      fill: color || generateRandomColor(),
      rotation: 0,
      zIndex: 0,
      createdBy,
      lastModifiedBy: createdBy,
      lastModifiedAt: Date.now(),
    };

    let newShape: CanvasObject;

    // Set type-specific properties
    switch (type) {
      case 'circle':
        newShape = {
          ...baseShape,
          radius: 50,
        } as CanvasObject;
        break;
      
      case 'triangle':
        newShape = {
          ...baseShape,
          width: 100,
          height: 100,
        } as CanvasObject;
        break;
      
      case 'text':
        newShape = {
          ...baseShape,
          text: 'Text',
          fontSize: 24,
          fontStyle: 'normal',
          textAlign: 'left',
        } as CanvasObject;
        break;
      
      case 'rectangle':
      default:
        newShape = {
          ...baseShape,
          width: 150,
          height: 100,
        } as CanvasObject;
        break;
    }

    console.log('Creating new shape:', newShape.id, 'type:', type);

    // Mark as locally created to avoid duplicate processing
    locallyCreatedRef.current.add(newShape.id);

    // Optimistic update - add to Firestore shapes immediately for instant feedback
    setFirestoreShapes(prev => {
      console.log('Adding shape to Firestore state, current count:', prev.length);
      return [...prev, newShape];
    });

    // Manual save mode - user must click "Save Project" to persist
    console.log('📝 Shape created locally (requires manual save)');

    return newShape;
  }, []);

  // Batch create multiple shapes (optimized for performance testing)
  const batchCreateShapes = useCallback(async (shapesData: Omit<CanvasObject, 'id' | 'lastModifiedAt'>[]) => {
    const newShapes: CanvasObject[] = shapesData.map(data => ({
      ...data,
      id: crypto.randomUUID(),
      lastModifiedAt: Date.now(),
    }));

    console.log(`Creating ${newShapes.length} shapes in batch...`);

    // Mark all as locally created
    newShapes.forEach(shape => {
      locallyCreatedRef.current.add(shape.id);
    });

    // Optimistic update - add all to state immediately
    setFirestoreShapes(prev => [...prev, ...newShapes]);

    // Manual save mode - user must click "Save Project" to persist
    console.log(`📝 Batch created ${newShapes.length} shapes locally (requires manual save)`);

    return newShapes;
  }, []);

  // Batch delete multiple shapes (optimized for bulk delete)
  const batchDeleteShapes = useCallback(async (ids: string[]) => {
    console.log(`Deleting ${ids.length} shapes in batch...`);

    // Optimistic update - remove from state immediately
    setFirestoreShapes(prev => prev.filter(shape => !ids.includes(shape.id)));

    // Manual save mode - don't auto-persist to Firestore
    console.log(`✅ Deleted ${ids.length} shapes locally (manual save mode)`);
  }, []);

  // Update an existing shape
  const updateShape = useCallback((id: string, updates: Partial<CanvasObject>) => {
    // Optimistic update - update Firestore shapes immediately
    setFirestoreShapes(prev => prev.map(shape => 
      shape.id === id 
        ? { ...shape, ...updates, lastModifiedAt: Date.now() }
        : shape
    ));

    // Manual save mode - don't auto-persist to Firestore
  }, []);

  // Update multiple shapes at once
  const updateShapes = useCallback((ids: string[], updates: Partial<CanvasObject>) => {
    // Optimistic update
    setFirestoreShapes(prev => prev.map(shape => 
      ids.includes(shape.id)
        ? { ...shape, ...updates, lastModifiedAt: Date.now() }
        : shape
    ));

    // Manual save mode - don't auto-persist to Firestore
  }, []);

  // Delete a shape
  const deleteShape = useCallback((id: string) => {
    console.log('🗑️ deleteShape called for:', id);
    
    // Optimistic update - remove from Firestore shapes immediately
    setFirestoreShapes(prev => prev.filter(shape => shape.id !== id));
    
    // Deselect if it was selected
    setSelectedShapeIds(prev => prev.filter(selectedId => selectedId !== id));
    
    // Remove from locally created tracking
    locallyCreatedRef.current.delete(id);
    
    // Also mark as inactive in RTDB if it was active
    markShapeInactive(id);
    
    // Manual save mode - user must click "Save Project" to persist
    console.log('📝 Shape deleted locally (requires manual save)');
  }, [markShapeInactive]);

  // Delete multiple shapes
  const deleteShapes = useCallback((ids: string[]) => {
    // Optimistic update - remove all from Firestore shapes
    setFirestoreShapes(prev => prev.filter(shape => !ids.includes(shape.id)));
    
    // Deselect all deleted shapes
    setSelectedShapeIds(prev => prev.filter(selectedId => !ids.includes(selectedId)));
    
    // Remove from locally created tracking and mark inactive
    ids.forEach(id => {
      locallyCreatedRef.current.delete(id);
      markShapeInactive(id);
    });
    
    // Manual save mode - user must click "Save Project" to persist
    console.log(`📝 Batch deleted ${ids.length} shapes locally (requires manual save)`);
  }, [markShapeInactive]);

  // Duplicate shapes
  const duplicateShapes = useCallback((ids: string[], createdBy: string): CanvasObject[] => {
    const shapesToDuplicate = firestoreShapes.filter(shape => ids.includes(shape.id));
    const duplicated: CanvasObject[] = [];

    shapesToDuplicate.forEach(original => {
      const newShape: CanvasObject = {
        ...original,
        id: crypto.randomUUID(),
        x: original.x + 20,
        y: original.y + 20,
        createdBy,
        lastModifiedBy: createdBy,
        lastModifiedAt: Date.now(),
      };

      // Mark as locally created
      locallyCreatedRef.current.add(newShape.id);
      duplicated.push(newShape);

      // Manual save mode - don't auto-persist to Firestore
    });

    // Optimistic update
    setFirestoreShapes(prev => [...prev, ...duplicated]);
    
    // Select the duplicated shapes
    setSelectedShapeIds(duplicated.map(s => s.id));

    return duplicated;
  }, [firestoreShapes]);

  // Select specific shapes
  const selectShapes = useCallback((ids: string[]) => {
    setSelectedShapeIds(ids);
  }, []);

  // Toggle shape selection (for Shift+Click)
  const toggleShapeSelection = useCallback((id: string) => {
    setSelectedShapeIds(prev => {
      if (prev.includes(id)) {
        // Deselect
        return prev.filter(selectedId => selectedId !== id);
      } else {
        // Add to selection
        return [...prev, id];
      }
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedShapeIds([]);
  }, []);

  // Select all shapes
  const selectAll = useCallback(() => {
    setSelectedShapeIds(firestoreShapes.map(shape => shape.id));
  }, [firestoreShapes]);

  // Get a specific shape
  const getShape = useCallback((id: string): CanvasObject | undefined => {
    return shapes.find(shape => shape.id === id);
  }, [shapes]);

  // ============ Command-wrapped functions for undo/redo ============

  /**
   * Helper to add shape to state (for commands)
   */
  const addShapeToState = useCallback((shape: CanvasObject) => {
    console.log('🆕 addShapeToState called:', shape.id, shape.type);
    locallyCreatedRef.current.add(shape.id);
    setFirestoreShapes(prev => [...prev, shape]);
    
    // AUTO-SAVE creates for real-time collaboration
    const saveToFirestore = async () => {
      try {
        console.log('💾 Auto-saving shape:', shape.id, shape.type);
        await batchSaveObjects([shape]);
        console.log('✅ Shape saved to Firestore');
      } catch (error) {
        console.error('❌ Failed to save shape:', error);
      }
    };
    saveToFirestore();
  }, [batchSaveObjects]);

  /**
   * Helper to add multiple shapes to state (for commands)
   */
  const addShapesToState = useCallback((shapes: CanvasObject[]) => {
    console.log('🆕 addShapesToState called:', shapes.length, 'shapes');
    shapes.forEach(shape => locallyCreatedRef.current.add(shape.id));
    setFirestoreShapes(prev => [...prev, ...shapes]);
    
    // AUTO-SAVE batch creates for real-time collaboration
    const saveToFirestore = async () => {
      try {
        console.log('💾 Auto-saving batch:', shapes.length, 'shapes');
        await batchSaveObjects(shapes);
        console.log('✅ Batch saved to Firestore');
      } catch (error) {
        console.error('❌ Failed to batch save:', error);
      }
    };
    saveToFirestore();
  }, [batchSaveObjects]);

  /**
   * Helper to remove shape from state (for commands)
   */
  const removeShapeFromState = useCallback((id: string) => {
    console.log('🗑️ removeShapeFromState called:', id);
    setFirestoreShapes(prev => prev.filter(shape => shape.id !== id));
    setSelectedShapeIds(prev => prev.filter(selectedId => selectedId !== id));
    locallyCreatedRef.current.delete(id);
    markShapeInactive(id);
    
    // AUTO-SAVE deletes for real-time collaboration
    const deleteFromFirestore = async () => {
      try {
        console.log('🗑️ Auto-deleting shape:', id);
        await deleteObject(id);
        console.log('✅ Shape deleted from Firestore');
      } catch (error) {
        console.error('❌ Failed to delete shape:', error);
      }
    };
    deleteFromFirestore();
  }, [markShapeInactive, deleteObject]);

  /**
   * Helper to remove multiple shapes from state (for commands)
   */
  const removeShapesFromState = useCallback((ids: string[]) => {
    console.log('🗑️ removeShapesFromState called:', ids.length, 'shapes');
    setFirestoreShapes(prev => prev.filter(shape => !ids.includes(shape.id)));
    setSelectedShapeIds(prev => prev.filter(selectedId => !ids.includes(selectedId)));
    ids.forEach(id => {
      locallyCreatedRef.current.delete(id);
      markShapeInactive(id);
    });
    
    // AUTO-SAVE batch deletes for real-time collaboration
    const deleteFromFirestore = async () => {
      try {
        console.log('🗑️ Auto-deleting batch:', ids.length, 'shapes');
        await batchDeleteObjects(ids);
        console.log('✅ Batch deleted from Firestore');
      } catch (error) {
        console.error('❌ Failed to batch delete:', error);
      }
    };
    deleteFromFirestore();
  }, [markShapeInactive, batchDeleteObjects]);

  /**
   * Helper to update shapes in state (for commands)
   */
  const updateShapesInState = useCallback((updates: Map<string, Partial<CanvasObject>>) => {
    setFirestoreShapes(prev => prev.map(shape => {
      const update = updates.get(shape.id);
      if (update) {
        return { ...shape, ...update, lastModifiedAt: Date.now() };
      }
      return shape;
    }));

    // Manual save mode - don't auto-persist
  }, []);

  /**
   * Create shape with undo/redo support
   */
  const createShapeWithHistory = useCallback((
    x: number,
    y: number,
    createdBy: string,
    type: 'rectangle' | 'circle' | 'triangle' | 'text' = 'rectangle',
    color?: string
  ): CanvasObject => {
    // Generate the shape without saving it yet
    const baseShape = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      fill: color || generateRandomColor(),
      rotation: 0,
      zIndex: 0,
      createdBy,
      lastModifiedBy: createdBy,
      lastModifiedAt: Date.now(),
    };

    let newShape: CanvasObject;

    // Set type-specific properties
    switch (type) {
      case 'circle':
        newShape = { ...baseShape, radius: 50 } as CanvasObject;
        break;
      case 'triangle':
        newShape = { ...baseShape, width: 100, height: 100 } as CanvasObject;
        break;
      case 'text':
        newShape = { ...baseShape, text: 'Text', fontSize: 24, fontStyle: 'normal', textAlign: 'left' } as CanvasObject;
        break;
      case 'rectangle':
      default:
        // Center the rectangle at the click position (like circles and triangles)
        newShape = { ...baseShape, x: x - 75, y: y - 50, width: 150, height: 100 } as CanvasObject;
        break;
    }

    // Execute command through history
    const command = new CreateShapeCommand(
      newShape,
      addShapeToState,
      removeShapeFromState
    );
    history.executeCommand(command);

    return newShape;
  }, [addShapeToState, removeShapeFromState, history]);

  /**
   * Batch create multiple shapes with undo/redo support
   * All shapes are created as a single undoable operation
   */
  const batchCreateShapesWithHistory = useCallback((
    specs: Array<{ x: number; y: number; createdBy: string; type?: 'rectangle' | 'circle' | 'triangle' | 'text'; color?: string }>,
    description?: string
  ): CanvasObject[] => {
    if (specs.length === 0) return [];

    const commands: CreateShapeCommand[] = [];
    const createdShapes: CanvasObject[] = [];

    // Create commands for all shapes
    for (const spec of specs) {
      const { x, y, createdBy, type = 'rectangle', color } = spec;

      const baseShape: Partial<CanvasObject> = {
        id: crypto.randomUUID(),
        type,
        x,
        y,
        fill: color || generateRandomColor(),
        rotation: 0,
        zIndex: 0,
        createdBy,
        lastModifiedBy: createdBy,
        lastModifiedAt: Date.now(),
      };

      let newShape: CanvasObject;

      // Set type-specific properties
      switch (type) {
        case 'circle':
          newShape = { ...baseShape, radius: 50 } as CanvasObject;
          break;
        case 'triangle':
          newShape = { ...baseShape, width: 100, height: 100 } as CanvasObject;
          break;
        case 'text':
          newShape = { ...baseShape, text: 'Text', fontSize: 24, fontStyle: 'normal', textAlign: 'left' } as CanvasObject;
          break;
        case 'rectangle':
        default:
          // Center the rectangle at the click position (like circles and triangles)
          newShape = { ...baseShape, x: x - 75, y: y - 50, width: 150, height: 100 } as CanvasObject;
          break;
      }

      createdShapes.push(newShape);
      
      const command = new CreateShapeCommand(
        newShape,
        addShapeToState,
        removeShapeFromState
      );
      commands.push(command);
    }

    // Execute all commands as a single batch
    if (commands.length === 1) {
      // Single shape, execute normally
      history.executeCommand(commands[0]);
    } else {
      // Multiple shapes, wrap in MultiShapeCommand
      const batchCommand = new MultiShapeCommand(commands);
      // Override description if provided
      if (description) {
        batchCommand.getDescription = () => description;
      }
      history.executeCommand(batchCommand);
    }

    return createdShapes;
  }, [addShapeToState, removeShapeFromState, history]);

  /**
   * Delete shapes with undo/redo support
   */
  const deleteShapesWithHistory = useCallback((ids: string[]) => {
    const shapesToDelete = firestoreShapes.filter(shape => ids.includes(shape.id));
    
    if (shapesToDelete.length === 0) return;

    const command = new DeleteShapeCommand(
      shapesToDelete,
      addShapesToState,
      removeShapesFromState
    );
    history.executeCommand(command);
  }, [firestoreShapes, addShapesToState, removeShapesFromState, history]);

  /**
   * Update shapes with undo/redo support
   */
  const updateShapesWithHistory = useCallback((
    ids: string[],
    oldStates: Map<string, Partial<CanvasObject>>,
    newStates: Map<string, Partial<CanvasObject>>
  ) => {
    const command = new UpdateShapeCommand(
      ids,
      oldStates,
      newStates,
      updateShapesInState
    );
    history.executeCommand(command);
  }, [updateShapesInState, history]);

  /**
   * Manual save: persist all current shapes to Firestore
   * This is called when the user clicks "Save Project"
   * This does a full sync: adds new shapes, updates existing ones, and deletes removed ones
   */
  const saveAllShapesToFirestore = useCallback(async (): Promise<void> => {
    console.log('💾 Manual save: persisting', firestoreShapes.length, 'shapes to Firestore...');
    
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Get all current shape IDs from Firestore
      const shapesQuery = query(collection(db!, 'projects', projectId, 'shapes'));
      const snapshot = await getDocs(shapesQuery);
      const firestoreShapeIds = new Set(snapshot.docs.map(doc => doc.id));
      const localShapeIds = new Set(firestoreShapes.map(s => s.id));

      // Find shapes to delete (in Firestore but not in local state)
      const shapesToDelete = Array.from(firestoreShapeIds).filter(id => !localShapeIds.has(id));
      
      console.log(`📊 Sync stats: ${firestoreShapes.length} local, ${firestoreShapeIds.size} in Firestore, ${shapesToDelete.length} to delete`);

      // Delete removed shapes first
      if (shapesToDelete.length > 0) {
        const batch = writeBatch(db!);
        shapesToDelete.forEach(id => {
          const docRef = doc(db!, 'projects', projectId, 'shapes', id);
          batch.delete(docRef);
        });
        await batch.commit();
        console.log(`🗑️ Deleted ${shapesToDelete.length} shapes from Firestore`);
      }

      // Then save/update all current shapes
      if (firestoreShapes.length > 0) {
        await batchSaveObjects(firestoreShapes);
        console.log(`💾 Saved ${firestoreShapes.length} shapes to Firestore`);
      }

      console.log('✅ Successfully synced all shapes to Firestore');
    } catch (error) {
      console.error('❌ Failed to save shapes to Firestore:', error);
      throw error; // Re-throw so caller can handle the error
    }
  }, [firestoreShapes, batchSaveObjects, projectId]);

  return {
    shapes,
    selectedShapeIds,
    activeShapes,
    createShape,
    batchCreateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    deleteShapes,
    batchDeleteShapes,
    duplicateShapes,
    selectShapes,
    toggleShapeSelection,
    clearSelection,
    selectAll,
    getShape,
    // RTDB operations for hybrid sync
    updateActivePosition,
    updateActiveText,
    markShapeActive,
    markShapeInactive,
    // History operations
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    // Command-based operations
    createShapeWithHistory,
    batchCreateShapesWithHistory,
    deleteShapesWithHistory,
    updateShapesWithHistory,
    // Manual save support
    saveAllShapesToFirestore,
  };
}

// Helper function to generate random colors
function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
    '#E67E22', '#16A085', '#27AE60', '#2980B9', '#8E44AD'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

