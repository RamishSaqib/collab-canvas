import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { CanvasObject } from '../lib/types';
import { useFirestore } from './useFirestore';
import { useRealtimeSync, type ActiveShape } from './useRealtimeSync';
import { useBeforeUnload } from './useBeforeUnload';
import type { User } from '../lib/types';

interface UseCanvasReturn {
  shapes: CanvasObject[];
  selectedShapeIds: string[];
  activeShapes: Map<string, ActiveShape>;
  createShape: (x: number, y: number, createdBy: string, type?: 'rectangle' | 'circle' | 'triangle' | 'text', color?: string) => CanvasObject;
  batchCreateShapes: (shapes: Omit<CanvasObject, 'id' | 'lastModifiedAt'>[]) => Promise<void>;
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
}

interface UseCanvasProps {
  user: User;
}

export function useCanvas({ user }: UseCanvasProps): UseCanvasReturn {
  const [firestoreShapes, setFirestoreShapes] = useState<CanvasObject[]>([]);
  const [activeShapes, setActiveShapes] = useState<Map<string, ActiveShape>>(new Map());
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  
  const { saveObject, updateObject, deleteObject, batchSaveObjects, batchDeleteObjects, subscribeToObjects, flushAllUpdates } = useFirestore();
  const {
    updateActivePosition,
    updateActiveText,
    markShapeActive,
    markShapeInactive,
    subscribeToActiveShapes,
    isAvailable: isRTDBAvailable,
  } = useRealtimeSync({
    userId: user.id,
    userName: user.name,
    userColor: user.color,
  });
  
  // Track if we're in the initial load to avoid saving remote changes back to Firestore
  const isInitialLoadRef = useRef(true);
  // Track locally created shapes to avoid duplicate saves
  const locallyCreatedRef = useRef<Set<string>>(new Set());

  // Subscribe to Firestore updates on mount (only once)
  useEffect(() => {
    console.log('Setting up Firestore subscription...');
    
    const unsubscribe = subscribeToObjects(
      (firestoreObjects) => {
        console.log('🔥 Firestore update received:', firestoreObjects.length, 'shapes', new Date().toISOString());
        
        // Update Firestore shapes state
        setFirestoreShapes(firestoreObjects);
        
        // After initial load, allow saves
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          console.log('✅ Initial load complete, loaded', firestoreObjects.length, 'shapes');
        } else {
          console.log('🔄 Real-time sync update received!');
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
      
      // Flush any pending updates before unmounting
      console.log('⚡ Flushing pending Firestore updates...');
      flushAllUpdates().catch(error => {
        console.error('Failed to flush pending updates:', error);
      });
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

  // Flush pending updates before page unload/refresh
  // This ensures no data is lost if user refreshes within the 100ms debounce window
  useBeforeUnload(flushAllUpdates);

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

    // Save to Firestore in background
    console.log('Saving shape to Firestore...');
    saveObject(newShape)
      .then(() => {
        console.log('Shape saved to Firestore successfully:', newShape.id);
      })
      .catch((error) => {
        console.error('Failed to save shape to Firestore:', error);
        // Remove from local state if save failed
        setFirestoreShapes(prev => prev.filter(s => s.id !== newShape.id));
        locallyCreatedRef.current.delete(newShape.id);
      });

    return newShape;
  }, [saveObject]);

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

    // Save all to Firestore in a single batch operation
    try {
      await batchSaveObjects(newShapes);
      console.log(`✅ Successfully created ${newShapes.length} shapes`);
    } catch (error) {
      console.error('Failed to batch save shapes:', error);
      // Rollback on error
      const newShapeIds = new Set(newShapes.map(s => s.id));
      setFirestoreShapes(prev => prev.filter(s => !newShapeIds.has(s.id)));
      newShapes.forEach(shape => locallyCreatedRef.current.delete(shape.id));
    }
  }, [batchSaveObjects]);

  // Batch delete multiple shapes (optimized for bulk delete)
  const batchDeleteShapes = useCallback(async (ids: string[]) => {
    console.log(`Deleting ${ids.length} shapes in batch...`);

    // Optimistic update - remove from state immediately
    setFirestoreShapes(prev => prev.filter(shape => !ids.includes(shape.id)));

    // Delete from Firestore in batch
    try {
      await batchDeleteObjects(ids);
      console.log(`✅ Successfully deleted ${ids.length} shapes`);
    } catch (error) {
      console.error('Failed to batch delete shapes:', error);
      // Note: Rollback would require fetching the deleted shapes again
      // For performance testing, we'll accept this edge case
    }
  }, [batchDeleteObjects]);

  // Update an existing shape
  const updateShape = useCallback((id: string, updates: Partial<CanvasObject>) => {
    // Optimistic update - update Firestore shapes immediately
    setFirestoreShapes(prev => prev.map(shape => 
      shape.id === id 
        ? { ...shape, ...updates, lastModifiedAt: Date.now() }
        : shape
    ));

    // Save to Firestore in background (debounced 100ms)
    updateObject(id, updates).catch((error) => {
      console.error('Failed to update shape in Firestore:', error);
      // Note: Could revert optimistic update here if needed
    });
  }, [updateObject]);

  // Update multiple shapes at once
  const updateShapes = useCallback((ids: string[], updates: Partial<CanvasObject>) => {
    // Optimistic update
    setFirestoreShapes(prev => prev.map(shape => 
      ids.includes(shape.id)
        ? { ...shape, ...updates, lastModifiedAt: Date.now() }
        : shape
    ));

    // Save all to Firestore
    Promise.all(
      ids.map(id => updateObject(id, updates))
    ).catch((error) => {
      console.error('Failed to update shapes in Firestore:', error);
    });
  }, [updateObject]);

  // Delete a shape
  const deleteShape = useCallback((id: string) => {
    // Optimistic update - remove from Firestore shapes immediately
    setFirestoreShapes(prev => prev.filter(shape => shape.id !== id));
    
    // Deselect if it was selected
    setSelectedShapeIds(prev => prev.filter(selectedId => selectedId !== id));
    
    // Remove from locally created tracking
    locallyCreatedRef.current.delete(id);
    
    // Also mark as inactive in RTDB if it was active
    markShapeInactive(id);
    
    // Delete from Firestore in background
    deleteObject(id).catch((error) => {
      console.error('Failed to delete shape from Firestore:', error);
      // Note: Could restore shape here if needed
    });
  }, [deleteObject, markShapeInactive]);

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
    
    // Delete from Firestore in background
    Promise.all(
      ids.map(id => deleteObject(id))
    ).catch((error) => {
      console.error('Failed to delete shapes from Firestore:', error);
    });
  }, [deleteObject, markShapeInactive]);

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

      // Save to Firestore
      saveObject(newShape).catch((error) => {
        console.error('Failed to save duplicated shape:', error);
        setFirestoreShapes(prev => prev.filter(s => s.id !== newShape.id));
        locallyCreatedRef.current.delete(newShape.id);
      });
    });

    // Optimistic update
    setFirestoreShapes(prev => [...prev, ...duplicated]);
    
    // Select the duplicated shapes
    setSelectedShapeIds(duplicated.map(s => s.id));

    return duplicated;
  }, [firestoreShapes, saveObject]);

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

