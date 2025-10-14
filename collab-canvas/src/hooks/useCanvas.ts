import { useState, useCallback } from 'react';
import type { CanvasObject } from '../lib/types';

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

    setShapes(prev => [...prev, newShape]);
    return newShape;
  }, []);

  // Update an existing shape
  const updateShape = useCallback((id: string, updates: Partial<CanvasObject>) => {
    setShapes(prev => prev.map(shape => 
      shape.id === id 
        ? { ...shape, ...updates, lastModifiedAt: Date.now() }
        : shape
    ));
  }, []);

  // Delete a shape
  const deleteShape = useCallback((id: string) => {
    setShapes(prev => prev.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  }, [selectedShapeId]);

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

