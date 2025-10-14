import { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { clampZoom, calculateZoomPosition, getZoomPoint, fitStageToWindow, getRelativePointerPosition } from '../../utils/canvas';
import { useCanvas } from '../../hooks/useCanvas';
import { useCursors } from '../../hooks/useCursors';
import { checkMemoryLeaks } from '../../utils/performance';
import Shape from './Shape';
import Cursor from './Cursor';
import './Canvas.css';

export type CanvasMode = 'select' | 'rectangle';

interface CanvasProps {
  user: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
}

export default function Canvas({ user, mode, onModeChange }: CanvasProps) {
  const [stageSize, setStageSize] = useState(fitStageToWindow());
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);
  const isPanningRef = useRef(false);
  const lastPanPositionRef = useRef({ x: 0, y: 0 });
  
  const {
    shapes,
    selectedShapeId,
    createShape,
    updateShape,
    selectShape,
  } = useCanvas();

  const { otherCursors, broadcastCursor } = useCursors({
    userId: user.id,
    userName: user.name,
    userColor: user.color,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize(fitStageToWindow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Performance monitoring: Check for potential memory leaks
  useEffect(() => {
    const interval = setInterval(() => {
      checkMemoryLeaks(shapes.length, 500); // Warn if > 500 shapes
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [shapes.length]);

  // Handle mouse move and up on document for panning
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;

      const dx = e.clientX - lastPanPositionRef.current.x;
      const dy = e.clientY - lastPanPositionRef.current.y;

      setStagePosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastPanPositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleDocumentMouseUp = () => {
      isPanningRef.current = false;
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        onModeChange('select');
        // Remove focus from any focused button to clear outline
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        onModeChange('rectangle');
        // Remove focus from any focused button to clear outline
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'Escape') {
        onModeChange('select');
        selectShape(null);
        // Remove focus from any focused button to clear outline
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected shape (will implement in next iteration)
        if (selectedShapeId) {
          // deleteShape(selectedShapeId); // Uncomment when delete is needed
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange, selectShape, selectedShapeId]);

  // Handle zoom with mouse wheel (memoized)
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = getZoomPoint(stage);

    // Zoom factor
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    
    const newScale = clampZoom(
      direction > 0 ? oldScale * scaleBy : oldScale / scaleBy,
      0.1,
      5
    );

    // Calculate new position to zoom toward cursor
    const newPos = calculateZoomPosition(stage, oldScale, newScale, pointer);

    setStageScale(newScale);
    setStagePosition(newPos);
  }, []);

  // Handle stage click (for creating shapes or deselecting) - memoized
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on the stage itself (not a shape)
    if (e.target === e.target.getStage()) {
      if (mode === 'rectangle') {
        // Create shape at click position
        const stage = stageRef.current;
        if (stage) {
          const pos = getRelativePointerPosition(stage);
          createShape(pos.x, pos.y, user.id);
        }
      } else {
        // Deselect when clicking empty canvas in select mode
        selectShape(null);
      }
    }
  }, [mode, createShape, selectShape, user.id]);

  // Manual panning: Handle mouse down on stage - memoized
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    
    // Only start panning if we clicked on empty canvas in select mode
    if (clickedOnEmpty && mode === 'select') {
      isPanningRef.current = true;
      lastPanPositionRef.current = {
        x: e.evt.clientX,
        y: e.evt.clientY,
      };
    }
  }, [mode]);

  // Handle mouse move to broadcast cursor position - memoized
  const handleMouseMove = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get canvas-relative position (accounting for zoom/pan)
    const pos = getRelativePointerPosition(stage);
    broadcastCursor(pos.x, pos.y);
  }, [broadcastCursor]);

  // Handle shape drag start - memoized
  const handleShapeDragStart = useCallback(() => {
    // Just a placeholder for now
  }, []);

  // Handle shape drag end - memoized
  const handleShapeDragEnd = useCallback((shapeId: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    updateShape(shapeId, {
      x: e.target.x(),
      y: e.target.y(),
      lastModifiedBy: user.id,
    });
  }, [updateShape, user.id]);

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleMouseMove}
      >
        <Layer listening={true}>
          {/* Render all shapes */}
          {shapes.map(shape => {
            // Memoize onSelect callback per shape to avoid recreating on every render
            const handleSelect = () => selectShape(shape.id);
            
            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedShapeId}
                onSelect={handleSelect}
                onDragStart={handleShapeDragStart}
                onDragEnd={handleShapeDragEnd(shape.id)}
              />
            );
          })}
          
          {/* Render other users' cursors */}
          {otherCursors.map(cursor => (
            <Cursor
              key={cursor.userId}
              cursor={cursor}
              stageScale={stageScale}
            />
          ))}
        </Layer>
      </Stage>
      
      {/* Canvas info overlay */}
      <div className="canvas-info">
        <div className="info-item">
          <span className="info-label">Mode:</span>
          <span className="info-value">{mode === 'select' ? 'Select (V)' : 'Rectangle (R)'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Shapes:</span>
          <span className="info-value">{shapes.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Zoom:</span>
          <span className="info-value">{Math.round(stageScale * 100)}%</span>
        </div>
      </div>

      {/* Mode instructions */}
      {mode === 'rectangle' && (
        <div className="mode-instruction">
          Click anywhere on canvas to create a rectangle. Press V or ESC to exit.
        </div>
      )}
    </div>
  );
}

// No additional exports needed

