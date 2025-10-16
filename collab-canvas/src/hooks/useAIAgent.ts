import { useState, useCallback } from 'react';
import { parseCommand } from '../lib/ai-provider';
import type { AICommand, AIResponse, CanvasObject, ShapeQuery } from '../lib/types';

/**
 * Hook for AI canvas agent
 * Handles command parsing, execution, and state management
 */
export function useAIAgent(
  shapes: CanvasObject[],
  selectedShapeIds: string[],
  userId: string,
  createShapeWithHistory: (x: number, y: number, createdBy: string, type?: 'rectangle' | 'circle' | 'triangle' | 'text', color?: string) => CanvasObject,
  updateShapesWithHistory: (ids: string[], oldStates: Map<string, Partial<CanvasObject>>, newStates: Map<string, Partial<CanvasObject>>) => void,
  deleteShapesWithHistory: (ids: string[]) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  /**
   * Process natural language command
   */
  const processCommand = useCallback(async (userInput: string): Promise<{ success: boolean; message: string }> => {
    setIsProcessing(true);
    setLastError(null);

    try {
      console.log('🤖 Processing command:', userInput);

      // Parse command with AI
      const aiResponse: AIResponse = await parseCommand(userInput, shapes, selectedShapeIds);

      if (!aiResponse.success) {
        setLastError(aiResponse.error || 'Failed to process command');
        setIsProcessing(false);
        return {
          success: false,
          message: aiResponse.error || 'Failed to process command'
        };
      }

      // Collect shape customizations to apply after all creates
      const pendingCustomizations = new Map<string, Partial<CanvasObject>>();
      
      // Execute all commands
      let executedCount = 0;
      for (const command of aiResponse.commands) {
        const success = await executeCommand(command, pendingCustomizations);
        if (success) executedCount++;
      }

      // Apply all customizations in one batch (preserves creation order)
      if (pendingCustomizations.size > 0) {
        const ids = Array.from(pendingCustomizations.keys());
        const oldStates = new Map(ids.map(id => [id, {}]));
        const newStates = pendingCustomizations;
        updateShapesWithHistory(ids, oldStates, newStates);
      }

      // Update state
      setLastCommand(userInput);
      setCommandHistory(prev => [userInput, ...prev].slice(0, 10)); // Keep last 10

      const message = `Executed ${executedCount} command(s)`;
      console.log('✅', message);

      setIsProcessing(false);
      return { success: true, message };

    } catch (error) {
      console.error('❌ AI Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      setIsProcessing(false);
      return { success: false, message: errorMessage };
    }
  }, [shapes, selectedShapeIds, updateShapesWithHistory]);

  /**
   * Execute a single AI command
   */
  const executeCommand = useCallback(async (command: AICommand, pendingCustomizations: Map<string, Partial<CanvasObject>>): Promise<boolean> => {
    try {
      console.log('⚡ Executing command:', command.intent, command.entities);

      switch (command.intent) {
        case 'create':
          return executeCreateCommand(command, pendingCustomizations);
        
        case 'delete':
          return executeDeleteCommand(command);
        
        case 'move':
          return executeMoveCommand(command);
        
        case 'resize':
          return executeResizeCommand(command);
        
        case 'rotate':
          return executeRotateCommand(command);
        
        case 'changeColor':
          return executeChangeColorCommand(command);
        
        case 'arrange':
          return executeArrangeCommand(command);
        
        case 'grid':
          return executeGridCommand(command);
        
        case 'stack':
          return executeStackCommand(command);
        
        case 'complex':
          // Complex commands are already broken down into multiple create commands by AI
          return executeCreateCommand(command, pendingCustomizations);
        
        default:
          console.warn('Unknown command intent:', command.intent);
          return false;
      }
    } catch (error) {
      console.error('Error executing command:', error);
      return false;
    }
  }, []);

  /**
   * Execute CREATE command
   * For AI-created shapes, we use createShapeWithHistory for defaults,
   * but collect customizations to apply in batch after all creates
   */
  const executeCreateCommand = useCallback((command: AICommand, pendingCustomizations: Map<string, Partial<CanvasObject>>): boolean => {
    const { entities } = command;
    
    if (!entities.shapeType) {
      console.error('Missing shapeType for create command');
      return false;
    }

    // Ensure we have valid coordinates
    const x = typeof entities.position?.x === 'number' ? entities.position.x : 400;
    const y = typeof entities.position?.y === 'number' ? entities.position.y : 300;

    // Create shape using the standard function (maintains undo/redo support)
    const newShape = createShapeWithHistory(
      x,
      y,
      userId,
      entities.shapeType,
      entities.color ?? '#667eea'
    );

    // Collect customizations to apply AFTER all shapes are created
    const customizations: Partial<CanvasObject> = {};

    // Collect type-specific customizations
    if (entities.shapeType === 'rectangle') {
      const size = entities.size as { width: number; height: number } | undefined;
      if (size?.width && size.width !== 150) {
        customizations.width = size.width;
      }
      if (size?.height && size.height !== 100) {
        customizations.height = size.height;
      }
    } else if (entities.shapeType === 'circle') {
      const size = entities.size as { radius: number } | undefined;
      if (size?.radius && size.radius !== 50) {
        customizations.radius = size.radius;
      }
    } else if (entities.shapeType === 'triangle') {
      const size = entities.size as { width: number; height: number } | undefined;
      if (size?.width && size.width !== 100) {
        customizations.width = size.width;
      }
      if (size?.height && size.height !== 100) {
        customizations.height = size.height;
      }
    } else if (entities.shapeType === 'text') {
      if (entities.text && entities.text !== 'Text') {
        customizations.text = entities.text;
      }
      if (entities.fontSize && entities.fontSize !== 24) {
        customizations.fontSize = entities.fontSize;
      }
    }

    // Add to pending customizations (will be applied in batch)
    if (Object.keys(customizations).length > 0) {
      pendingCustomizations.set(newShape.id, customizations);
    }

    return true;
  }, [createShapeWithHistory, userId]);

  /**
   * Execute DELETE command
   */
  const executeDeleteCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    // Find shapes matching query
    const matchingShapes = findShapesByQuery(shapes, entities.query);
    
    if (matchingShapes.length === 0) {
      console.warn('No shapes found matching query');
      return false;
    }

    // Delete shapes
    const idsToDelete = matchingShapes.map(s => s.id);
    deleteShapesWithHistory(idsToDelete);
    return true;
  }, [shapes, deleteShapesWithHistory]);

  /**
   * Execute MOVE command
   */
  const executeMoveCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    if (!entities.position) {
      console.error('Missing position for move command');
      return false;
    }

    // Find shapes to move
    const shapesToMove = entities.query 
      ? findShapesByQuery(shapes, entities.query)
      : shapes.filter(s => selectedShapeIds.includes(s.id));

    if (shapesToMove.length === 0) {
      console.warn('No shapes found to move');
      return false;
    }

    // Update positions
    const ids = shapesToMove.map(s => s.id);
    const oldStates = new Map(shapesToMove.map(s => [s.id, { x: s.x, y: s.y }]));
    const newStates = new Map(ids.map(id => [id, {
      x: entities.position!.x,
      y: entities.position!.y,
    }]));

    updateShapesWithHistory(ids, oldStates, newStates);
    return true;
  }, [shapes, selectedShapeIds, updateShapesWithHistory]);

  /**
   * Execute RESIZE command
   */
  const executeResizeCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    if (!entities.size) {
      console.error('Missing size for resize command');
      return false;
    }

    // Find shapes to resize
    const shapesToResize = entities.query 
      ? findShapesByQuery(shapes, entities.query)
      : shapes.filter(s => selectedShapeIds.includes(s.id));

    if (shapesToResize.length === 0) {
      console.warn('No shapes found to resize');
      return false;
    }

    // Update size based on shape type
    const updates: Partial<CanvasObject> = {};
    
    if ('width' in entities.size && 'height' in entities.size) {
      updates.width = entities.size.width;
      updates.height = entities.size.height;
    } else if ('radius' in entities.size) {
      updates.radius = entities.size.radius;
    }

    const ids = shapesToResize.map(s => s.id);
    const oldStates = new Map(shapesToResize.map(s => [s.id, { width: s.width, height: s.height, radius: s.radius }]));
    const newStates = new Map(ids.map(id => [id, updates]));

    updateShapesWithHistory(ids, oldStates, newStates);
    return true;
  }, [shapes, selectedShapeIds, updateShapesWithHistory]);

  /**
   * Execute ROTATE command
   */
  const executeRotateCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    if (entities.rotation === undefined) {
      console.error('Missing rotation for rotate command');
      return false;
    }

    // Find shapes to rotate
    const shapesToRotate = entities.query 
      ? findShapesByQuery(shapes, entities.query)
      : shapes.filter(s => selectedShapeIds.includes(s.id));

    if (shapesToRotate.length === 0) {
      console.warn('No shapes found to rotate');
      return false;
    }

    // Update rotation
    const ids = shapesToRotate.map(s => s.id);
    const oldStates = new Map(shapesToRotate.map(s => [s.id, { rotation: s.rotation }]));
    const newStates = new Map(ids.map(id => [id, { rotation: entities.rotation }]));

    updateShapesWithHistory(ids, oldStates, newStates);
    return true;
  }, [shapes, selectedShapeIds, updateShapesWithHistory]);

  /**
   * Execute CHANGE COLOR command
   */
  const executeChangeColorCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    if (!entities.color) {
      console.error('Missing color for changeColor command');
      return false;
    }

    // Find shapes to recolor
    const shapesToRecolor = entities.query 
      ? findShapesByQuery(shapes, entities.query)
      : shapes.filter(s => selectedShapeIds.includes(s.id));

    if (shapesToRecolor.length === 0) {
      console.warn('No shapes found to recolor');
      return false;
    }

    // Update color
    const ids = shapesToRecolor.map(s => s.id);
    const oldStates = new Map(shapesToRecolor.map(s => [s.id, { fill: s.fill }]));
    const newStates = new Map(ids.map(id => [id, { fill: entities.color }]));

    updateShapesWithHistory(ids, oldStates, newStates);
    return true;
  }, [shapes, selectedShapeIds, updateShapesWithHistory]);

  /**
   * Execute ARRANGE command (horizontal or vertical row)
   */
  const executeArrangeCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    const shapesToArrange = entities.query 
      ? findShapesByQuery(shapes, entities.query)
      : shapes.filter(s => selectedShapeIds.includes(s.id));

    if (shapesToArrange.length < 2) {
      console.warn('Need at least 2 shapes to arrange');
      return false;
    }

    const spacing = entities.spacing ?? 20;
    const direction = entities.direction ?? 'horizontal';

    // Calculate positions
    const ids: string[] = [];
    const oldStates = new Map<string, Partial<CanvasObject>>();
    const newStates = new Map<string, Partial<CanvasObject>>();

    if (direction === 'horizontal') {
      let currentX = shapesToArrange[0].x;
      shapesToArrange.forEach((shape) => {
        ids.push(shape.id);
        oldStates.set(shape.id, { x: shape.x });
        newStates.set(shape.id, { x: currentX });
        currentX += (shape.width ?? shape.radius ?? 50) * 2 + spacing;
      });
    } else {
      let currentY = shapesToArrange[0].y;
      shapesToArrange.forEach((shape) => {
        ids.push(shape.id);
        oldStates.set(shape.id, { y: shape.y });
        newStates.set(shape.id, { y: currentY });
        currentY += (shape.height ?? shape.radius ?? 50) * 2 + spacing;
      });
    }

    updateShapesWithHistory(ids, oldStates, newStates);
    return true;
  }, [shapes, selectedShapeIds, updateShapesWithHistory]);

  /**
   * Execute GRID command (create NxN grid of shapes)
   */
  const executeGridCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    if (!entities.shapeType || !entities.count) {
      console.error('Missing shapeType or count for grid command');
      return false;
    }

    const gridSize = Math.sqrt(entities.count);
    
    // Use ACTUAL default sizes from createShapeWithHistory function
    // These are the sizes that will actually be created
    let shapeWidth = 150;  // rectangle default
    let shapeHeight = 100; // rectangle default
    
    if (entities.shapeType === 'circle') {
      const diameter = 50 * 2; // radius 50 = 100px diameter
      shapeWidth = diameter;
      shapeHeight = diameter;
    } else if (entities.shapeType === 'triangle') {
      shapeWidth = 100;  // triangle default
      shapeHeight = 100; // triangle default
    } else if (entities.shapeType === 'text') {
      shapeWidth = 100;  // approximate text width
      shapeHeight = 30;  // approximate text height
    }
    // else rectangle: 150x100 (already set)
    
    // Add gap between shapes (30px for better visibility)
    const gap = 30;
    const spacingX = shapeWidth + gap;
    const spacingY = shapeHeight + gap;
    
    const startX = 150;
    const startY = 150;

    // Collect customizations for grid shapes
    const gridCustomizations = new Map<string, Partial<CanvasObject>>();

    // Create grid with proper spacing based on actual shape sizes
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        
        const gridCommand: AICommand = {
          intent: 'create',
          entities: {
            ...entities,
            position: { x, y },
          }
        };
        
        executeCreateCommand(gridCommand, gridCustomizations);
      }
    }

    return true;
  }, [executeCreateCommand]);

  /**
   * Execute STACK command (vertical or horizontal stacking)
   */
  const executeStackCommand = useCallback((command: AICommand): boolean => {
    // Stack is similar to arrange but with tighter spacing
    return executeArrangeCommand({
      ...command,
      entities: {
        ...command.entities,
        spacing: command.entities.spacing ?? 10,
      }
    });
  }, [executeArrangeCommand]);

  /**
   * Find shapes matching a query
   */
  const findShapesByQuery = useCallback((allShapes: CanvasObject[], query?: ShapeQuery): CanvasObject[] => {
    if (!query) return allShapes;

    return allShapes.filter(shape => {
      // Filter by type
      if (query.type && query.type !== 'all' && shape.type !== query.type) {
        return false;
      }

      // Filter by color
      if (query.color && shape.fill !== query.color) {
        return false;
      }

      // Filter by selected
      if (query.selected && !selectedShapeIds.includes(shape.id)) {
        return false;
      }

      // Filter by position (approximate)
      if (query.position) {
        const threshold = 100; // pixels
        switch (query.position) {
          case 'center':
            return Math.abs(shape.x - 400) < threshold && Math.abs(shape.y - 300) < threshold;
          case 'top-left':
            return shape.x < 200 && shape.y < 200;
          case 'top-right':
            return shape.x > 600 && shape.y < 200;
          case 'bottom-left':
            return shape.x < 200 && shape.y > 400;
          case 'bottom-right':
            return shape.x > 600 && shape.y > 400;
        }
      }

      return true;
    });
  }, [selectedShapeIds]);

  return {
    processCommand,
    isProcessing,
    lastCommand,
    lastError,
    commandHistory,
  };
}

