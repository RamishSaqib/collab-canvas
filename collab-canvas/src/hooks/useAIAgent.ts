import { useState, useCallback } from 'react';
import { parseCommand } from '../lib/ai-provider';
import { gridToKonva, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/coordinates';
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
  batchCreateShapesWithHistory: (specs: Array<{ x: number; y: number; createdBy: string; type?: 'rectangle' | 'circle' | 'triangle' | 'text'; color?: string }>, description?: string) => CanvasObject[],
  updateShapesWithHistory: (ids: string[], oldStates: Map<string, Partial<CanvasObject>>, newStates: Map<string, Partial<CanvasObject>>) => void,
  deleteShapesWithHistory: (ids: string[]) => void,
  stagePos?: { x: number; y: number },
  stageScale?: number
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

      // Check if all commands are "create" commands - if so, batch them
      const allCreateCommands = aiResponse.commands.every(cmd => cmd.intent === 'create');
      
      if (allCreateCommands && aiResponse.commands.length > 1) {
        // Batch create all shapes at once for better undo/redo
        const success = await executeBatchCreate(aiResponse.commands, userInput);
        
        setLastCommand(userInput);
        setCommandHistory(prev => [userInput, ...prev].slice(0, 10));
        
        const message = `Created ${aiResponse.commands.length} shapes`;
        console.log('✅', message);
        
        setIsProcessing(false);
        return { success, message };
      }
      
      // Execute commands individually (mixed commands or single command)
      let executedCount = 0;
      for (const command of aiResponse.commands) {
        const success = await executeCommand(command);
        if (success) executedCount++;
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
  }, [shapes, selectedShapeIds, updateShapesWithHistory, batchCreateShapesWithHistory]);

  /**
   * Find shapes matching a query
   */
  const findShapesByQuery = useCallback((allShapes: CanvasObject[], query?: ShapeQuery): CanvasObject[] => {
    if (!query) return [];

    let matchingShapes = [...allShapes];
    
    console.log('🔍 Query:', query, 'Total shapes:', allShapes.length);

    // Filter by selection first
    if (query.selected === true) {
      matchingShapes = matchingShapes.filter(s => selectedShapeIds.includes(s.id));
      console.log('  After selection filter:', matchingShapes.length);
    }

    // Filter by type
    if (query.type && query.type !== 'all') {
      matchingShapes = matchingShapes.filter(s => s.type === query.type);
      console.log('  After type filter (' + query.type + '):', matchingShapes.length);
    }

    // Filter by color (case-insensitive hex comparison, handle both formats)
    if (query.color) {
      const queryColor = query.color.toLowerCase();
      matchingShapes = matchingShapes.filter(s => {
        const shapeColor = s.fill.toLowerCase();
        // Handle both #rgb and #rrggbb formats
        return shapeColor === queryColor || 
               shapeColor.replace('#', '') === queryColor.replace('#', '');
      });
      console.log('  After color filter (' + query.color + '):', matchingShapes.length);
    }

    // Filter by position area (if implemented later)
    if (query.position) {
      // Could implement: center, top-left, etc.
      // For now, skip this filter
    }

    console.log('✅ Final matches:', matchingShapes.length);
    
    // Sort by creation time (most recent last) and apply limit
    if (query.limit) {
      matchingShapes.sort((a, b) => (a.lastModifiedAt || 0) - (b.lastModifiedAt || 0));
      matchingShapes = matchingShapes.slice(-query.limit); // Take last N (most recent)
      console.log('  After limit (' + query.limit + '):', matchingShapes.length);
    }
    
    return matchingShapes;
  }, [selectedShapeIds]);

  /**
   * Execute batch create for multiple shapes (for better undo/redo)
   */
  const executeBatchCreate = useCallback(async (commands: AICommand[], description: string): Promise<boolean> => {
    try {
      // Step 1: Collect all shape specs
      const shapeSpecs: Array<{ x: number; y: number; createdBy: string; type?: 'rectangle' | 'circle' | 'triangle' | 'text'; color?: string }> = [];
      const customizations: Map<number, Partial<CanvasObject>> = new Map(); // index -> customizations

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        const { entities } = command;

        // Calculate position
        let x: number;
        let y: number;

        if (entities.position && typeof entities.position.x === 'number' && typeof entities.position.y === 'number') {
          // AI provided grid coordinates - convert to Konva coordinates
          const konvaPos = gridToKonva(entities.position.x, entities.position.y);
          x = konvaPos.x;
          y = konvaPos.y;
        } else {
          // No position provided - use viewport center with offset for multiple shapes
          const scale = stageScale || 1;
          const posX = stagePos?.x || 0;
          const posY = stagePos?.y || 0;
          const baseX = (CANVAS_WIDTH / 2 - posX) / scale;
          const baseY = (CANVAS_HEIGHT / 2 - posY) / scale;
          
          // Add offset for multiple shapes to prevent stacking
          // Offset diagonally: 30px right and 30px down per shape
          const offset = i * 30;
          x = baseX + offset;
          y = baseY + offset;
        }

        // Add shape spec
        shapeSpecs.push({
          x,
          y,
          createdBy: userId,
          type: entities.shapeType || 'rectangle',
          color: entities.color || undefined,
        });

        // Collect customizations for this shape
        const customs: Partial<CanvasObject> = {};
        
        // Text content
        if (entities.text) {
          customs.text = entities.text;
        }
        
        // Font size
        if (entities.fontSize) {
          customs.fontSize = entities.fontSize;
        }
        
        // Size
        if (entities.size) {
          if ('radius' in entities.size) {
            customs.radius = entities.size.radius;
          } else {
            customs.width = entities.size.width;
            customs.height = entities.size.height;
          }
        }

        // Align rectangle coordinates: treat AI positions as TOP-LEFT for rectangles
        if ((entities.shapeType || 'rectangle') === 'rectangle') {
          if (entities.position && typeof entities.position.x === 'number' && typeof entities.position.y === 'number') {
            const kpos = gridToKonva(entities.position.x, entities.position.y);
            customs.x = kpos.x;
            customs.y = kpos.y;
          }
        }

        // zIndex based on shape type (text on top)
        const baseZIndex = entities.shapeType === 'text' ? 1000 : 0;
        customs.zIndex = baseZIndex + Date.now() % 1000;

        if (Object.keys(customs).length > 0) {
          customizations.set(i, customs);
        }
      }

      // Step 2: Batch create all shapes
      const createdShapes = batchCreateShapesWithHistory(shapeSpecs, description);

      // Step 3: Apply customizations if any
      if (customizations.size > 0) {
        const shapeIds: string[] = [];
        const oldStates = new Map<string, Partial<CanvasObject>>();
        const newStates = new Map<string, Partial<CanvasObject>>();

        console.log('🎨 Applying customizations to', customizations.size, 'shapes');
        // Also apply customizations to the createdShapes array for Step 4
        createdShapes.forEach((shape, index) => {
          const customs = customizations.get(index);
          if (customs) {
            shapeIds.push(shape.id);
            oldStates.set(shape.id, {}); // Empty old state (defaults)
            newStates.set(shape.id, customs);
            // Update the shape in the array too
            Object.assign(shape, customs);
            
            if (shape.type === 'text' && customs.text) {
              console.log(`  📝 Text ${index}: "${customs.text}" at (${customs.x}, ${customs.y}), zIndex: ${customs.zIndex}`);
            }
          }
        });

        if (shapeIds.length > 0) {
          console.log('💾 Saving customizations to Firestore...');
          updateShapesWithHistory(shapeIds, oldStates, newStates);
        }
      }

      // Step 4: DISABLED - AI already positions navbar texts correctly
      // The AI system prompt has detailed instructions for text positioning,
      // and the heuristic was interfering with correct AI placements
      console.log('✅ Batch create complete - AI positioning used (heuristic disabled)');

      return true;
    } catch (error) {
      console.error('❌ Batch create error:', error);
      return false;
    }
  }, [batchCreateShapesWithHistory, updateShapesWithHistory, userId, stagePos, stageScale]);

  /**
   * Execute CREATE command
   * For AI-created shapes, we use createShapeWithHistory for defaults,
   * then immediately apply customizations to preserve rendering order
   */
  const executeCreateCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    if (!entities.shapeType) {
      console.error('Missing shapeType for create command');
      return false;
    }

    // Calculate position
    let x: number;
    let y: number;

    if (entities.position && typeof entities.position.x === 'number' && typeof entities.position.y === 'number') {
      // AI provided grid coordinates - convert to Konva coordinates
      const konvaPos = gridToKonva(entities.position.x, entities.position.y);
      x = konvaPos.x;
      y = konvaPos.y;
    } else {
      // No position provided - use viewport center (at 100% zoom)
      // Calculate the center of the current viewport
      const scale = stageScale || 1;
      const posX = stagePos?.x || 0;
      const posY = stagePos?.y || 0;
      
      // Viewport center in stage coordinates
      x = (CANVAS_WIDTH / 2 - posX) / scale;
      y = (CANVAS_HEIGHT / 2 - posY) / scale;
    }

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
      // For AI positions, treat rectangle coordinates as TOP-LEFT and override centering
      if (entities.position && typeof entities.position.x === 'number' && typeof entities.position.y === 'number') {
        const konvaTopLeft = gridToKonva(entities.position.x, entities.position.y);
        customizations.x = konvaTopLeft.x;
        customizations.y = konvaTopLeft.y;
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

    // Set zIndex based on shape type to ensure proper layering
    // Rectangles/circles/triangles: zIndex 0-999 (background)
    // Text: zIndex 1000+ (foreground)
    const baseZIndex = entities.shapeType === 'text' ? 1000 : 0;
    customizations.zIndex = baseZIndex + Date.now() % 1000; // Add timestamp for uniqueness

    // Apply customizations with zIndex to ensure proper layering
    const oldState = new Map([[newShape.id, {}]]);
    const newState = new Map([[newShape.id, customizations]]);
    updateShapesWithHistory([newShape.id], oldState, newState);

    return true;
  }, [createShapeWithHistory, updateShapesWithHistory, userId]);

  /**
   * Execute DELETE command
   */
  const executeDeleteCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    console.log('🗑️ Delete command entities:', entities);
    console.log('🗑️ Query:', entities.query);
    console.log('🗑️ All shapes:', shapes.map(s => ({id: s.id, type: s.type, color: s.fill})));
    
    // Find shapes matching query
    const matchingShapes = findShapesByQuery(shapes, entities.query);
    
    if (matchingShapes.length === 0) {
      console.warn('No shapes found matching query');
      console.warn('Query was:', entities.query);
      console.warn('Available shapes:', shapes.length);
      return false;
    }

    // Delete shapes
    const idsToDelete = matchingShapes.map(s => s.id);
    deleteShapesWithHistory(idsToDelete);
    return true;
  }, [shapes, findShapesByQuery, deleteShapesWithHistory]);

  /**
   * Execute MOVE command
   */
  const executeMoveCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    console.log('📍 Move command entities:', entities);
    console.log('📍 Query:', entities.query);
    console.log('📍 All shapes:', shapes.map(s => ({id: s.id, type: s.type, color: s.fill})));
    
    if (!entities.position) {
      console.error('Missing position for move command');
      return false;
    }

    // Find shapes to move
    const shapesToMove = findShapesByQuery(shapes, entities.query);

    if (shapesToMove.length === 0) {
      console.warn('No shapes found to move');
      console.warn('Query was:', entities.query);
      console.warn('Available shapes:', shapes.length);
      return false;
    }

    // Convert grid coordinates to Konva coordinates
    const konvaPos = gridToKonva(entities.position.x, entities.position.y);

    // Update positions
    const ids = shapesToMove.map(s => s.id);
    const oldStates = new Map(shapesToMove.map(s => [s.id, { x: s.x, y: s.y }]));
    const newStates = new Map(ids.map(id => [id, {
      x: konvaPos.x,
      y: konvaPos.y,
    }]));

    updateShapesWithHistory(ids, oldStates, newStates);
    return true;
  }, [shapes, findShapesByQuery, updateShapesWithHistory]);

  /**
   * Execute RESIZE command
   */
  const executeResizeCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    if (!entities.size || typeof entities.size !== 'object') {
      console.error('Missing size for resize command');
      return false;
    }

    // Find shapes to resize
    const shapesToResize = findShapesByQuery(shapes, entities.query);

    if (shapesToResize.length === 0) {
      console.warn('No shapes found to resize');
      return false;
    }

    // Prepare updates for each shape
    const ids = shapesToResize.map(s => s.id);
    const oldStates = new Map(shapesToResize.map(s => [s.id, { width: s.width, height: s.height, radius: s.radius }]));
    const newStates = new Map<string, Partial<CanvasObject>>();

    shapesToResize.forEach(shape => {
      const updates: Partial<CanvasObject> = {};
      const size = entities.size!; // Already validated above
      
      // Handle absolute sizes
      if (size.width !== undefined && size.height !== undefined) {
        updates.width = size.width;
        updates.height = size.height;
      } else if (size.radius !== undefined) {
        updates.radius = size.radius;
      } else if (size.scale !== undefined) {
        // Handle relative sizing with scale factor
        const scaleFactor = size.scale;
        if (shape.type === 'circle') {
          const currentRadius = shape.radius || 50;
          updates.radius = Math.round(currentRadius * scaleFactor);
        } else if (shape.type === 'rectangle' || shape.type === 'triangle') {
          const currentWidth = shape.width || 150;
          const currentHeight = shape.height || 100;
          updates.width = Math.round(currentWidth * scaleFactor);
          updates.height = Math.round(currentHeight * scaleFactor);
        }
      }
      
      newStates.set(shape.id, updates);
    });

    updateShapesWithHistory(ids, oldStates, newStates);
    return true;
  }, [shapes, findShapesByQuery, updateShapesWithHistory]);

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
    const shapesToRotate = findShapesByQuery(shapes, entities.query);

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
  }, [shapes, findShapesByQuery, updateShapesWithHistory]);

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
    const shapesToRecolor = findShapesByQuery(shapes, entities.query);

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
  }, [shapes, findShapesByQuery, updateShapesWithHistory]);

  /**
   * Execute ARRANGE command (horizontal or vertical row)
   */
  const executeArrangeCommand = useCallback((command: AICommand): boolean => {
    const { entities } = command;
    
    const shapesToArrange = findShapesByQuery(shapes, entities.query);

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
  }, [shapes, findShapesByQuery, updateShapesWithHistory]);

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
        
        executeCreateCommand(gridCommand);
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
   * Execute a single AI command
   * Defined after all execute functions to avoid circular dependency
   */
  const executeCommand = useCallback(async (command: AICommand): Promise<boolean> => {
    try {
      console.log('⚡ Executing command:', command.intent, command.entities);

      switch (command.intent) {
        case 'create':
          return executeCreateCommand(command);
        
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
          return executeCreateCommand(command);
        
        default:
          console.warn('Unknown command intent:', command.intent);
          return false;
      }
    } catch (error) {
      console.error('Error executing command:', error);
      return false;
    }
  }, [
    executeCreateCommand,
    executeDeleteCommand,
    executeMoveCommand,
    executeResizeCommand,
    executeRotateCommand,
    executeChangeColorCommand,
    executeArrangeCommand,
    executeGridCommand,
    executeStackCommand,
  ]);

  return {
    processCommand,
    isProcessing,
    lastCommand,
    lastError,
    commandHistory,
  };
}

