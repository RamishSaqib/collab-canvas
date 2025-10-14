import { useState, useCallback, useEffect, useRef } from 'react';
import type { CanvasObject } from '../lib/types';
import { useFirestore } from './useFirestore';

interface UseCanvasReturn {
  shapes: CanvasObject[];
  selectedShapeId: string | null;
  createShape: (x: number, y: number, createdBy: string) => CanvasObject;
  updateShape: (id: string, updates: Partial<CanvasObject>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  getShape: (id: string) => CanvasObject | undefined;
}

export function useCanvas(): UseCanvasReturn {
  const [shapes, setShapes] = useState<CanvasObject[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const { saveObject, updateObject, deleteObject, subscribeToObjects } = useFirestore();
  
  // Track if we're in the initial load to avoid saving remote changes back to Firestore
  const isInitialLoadRef = useRef(true);
  // Track locally created shapes to avoid duplicate saves
  const locallyCreatedRef = useRef<Set<string>>(new Set());

  // Subscribe to Firestore updates on mount
  useEffect(() => {
    console.log('Setting up Firestore subscription...');
    
    const unsubscribe = subscribeToObjects(
      (firestoreObjects) => {
        // Update local state with Firestore data
        setShapes(firestoreObjects);
        
        // After initial load, allow saves
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          console.log('Initial load complete, loaded', firestoreObjects.length, 'shapes');
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up Firestore subscription');
      unsubscribe();
    };
  }, [subscribeToObjects]);

  // Create a new shape
  const createShape = useCallback((x: number, y: number, createdBy: string): CanvasObject => {
    const newShape: CanvasObject = {
      id: crypto.randomUUID(),
      type: 'rectangle',
      x,
      y,
      width: 150,
      height: 100,
      fill: generateRandomColor(),
      rotation: 0,
      createdBy,
      lastModifiedBy: createdBy,
      lastModifiedAt: Date.now(),
    };

    // Mark as locally created to avoid duplicate processing
    locallyCreatedRef.current.add(newShape.id);

    // Save to Firestore (optimistic update - local state will be updated via subscription)
    saveObject(newShape).catch((error) => {
      console.error('Failed to save shape to Firestore:', error);
      // Remove from locally created if save failed
      locallyCreatedRef.current.delete(newShape.id);
    });

    return newShape;
  }, [saveObject]);

  // Update an existing shape
  const updateShape = useCallback((id: string, updates: Partial<CanvasObject>) => {
    // Save to Firestore (local state will be updated via subscription)
    updateObject(id, updates).catch((error) => {
      console.error('Failed to update shape in Firestore:', error);
    });
  }, [updateObject]);

  // Delete a shape
  const deleteShape = useCallback((id: string) => {
    // Remove from locally created tracking
    locallyCreatedRef.current.delete(id);
    
    // Delete from Firestore (local state will be updated via subscription)
    deleteObject(id).catch((error) => {
      console.error('Failed to delete shape from Firestore:', error);
    });
    
    // Deselect if it was selected
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  }, [selectedShapeId, deleteObject]);

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
    createShape,
    updateShape,
    deleteShape,
    selectShape,
    getShape,
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

