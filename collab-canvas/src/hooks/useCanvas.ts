import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { CanvasObject } from '../lib/types';
import { useFirestore } from './useFirestore';
import { useRealtimeSync, type ActiveShape } from './useRealtimeSync';
import { useBeforeUnload } from './useBeforeUnload';
import type { User } from '../lib/types';

interface UseCanvasReturn {
  shapes: CanvasObject[];
  selectedShapeId: string | null;
  activeShapes: Map<string, ActiveShape>;
  createShape: (x: number, y: number, createdBy: string, type?: 'rectangle' | 'circle' | 'triangle' | 'text', color?: string) => CanvasObject;
  updateShape: (id: string, updates: Partial<CanvasObject>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
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
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  const { saveObject, updateObject, deleteObject, subscribeToObjects, flushAllUpdates } = useFirestore();
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

  // Merge Firestore shapes with RTDB active shapes
  const shapes = React.useMemo(() => {
    return firestoreShapes.map(shape => {
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

  // Delete a shape
  const deleteShape = useCallback((id: string) => {
    // Optimistic update - remove from Firestore shapes immediately
    setFirestoreShapes(prev => prev.filter(shape => shape.id !== id));
    
    // Deselect if it was selected
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
    
    // Remove from locally created tracking
    locallyCreatedRef.current.delete(id);
    
    // Also mark as inactive in RTDB if it was active
    markShapeInactive(id);
    
    // Delete from Firestore in background
    deleteObject(id).catch((error) => {
      console.error('Failed to delete shape from Firestore:', error);
      // Note: Could restore shape here if needed
    });
  }, [selectedShapeId, deleteObject, markShapeInactive]);

  // Select a shape
  const selectShape = useCallback((id: string | null) => {
    setSelectedShapeId(id);
  }, []);

  // Get a specific shape
  const getShape = useCallback((id: string): CanvasObject | undefined => {
    return shapes.find(shape => shape.id === id);
  }, [shapes]);

  return {
    shapes,
    selectedShapeId,
    activeShapes,
    createShape,
    updateShape,
    deleteShape,
    selectShape,
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

