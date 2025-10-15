import { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { clampZoom, calculateZoomPosition, getZoomPoint, fitStageToWindow, getRelativePointerPosition } from '../../utils/canvas';
import { useCanvas } from '../../hooks/useCanvas';
import { useCursors } from '../../hooks/useCursors';
import { checkMemoryLeaks } from '../../utils/performance';
import Shape from './Shape';
import Cursor from './Cursor';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import ColorPicker from './ColorPicker';
import './Canvas.css';

export type CanvasMode = 'select' | 'rectangle' | 'circle' | 'triangle' | 'text';

interface CanvasProps {
  user: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  showColorPicker: boolean;
  onCloseColorPicker: () => void;
}

export default function Canvas({ user, mode, onModeChange, selectedColor, onColorChange, showColorPicker, onCloseColorPicker }: CanvasProps) {
  const [stageSize, setStageSize] = useState(fitStageToWindow());
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [deleteToast, setDeleteToast] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const stageRef = useRef<Konva.Stage>(null);
  const isPanningRef = useRef(false);
  const lastPanPositionRef = useRef({ x: 0, y: 0 });
  const textInputRef = useRef<HTMLInputElement>(null);
  
  const {
    shapes,
    selectedShapeId,
    activeShapes,
    createShape,
    updateShape,
    deleteShape,
    selectShape,
    updateActivePosition,
    markShapeActive,
    markShapeInactive,
  } = useCanvas({ user });

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
      // Don't handle shortcuts if we're editing text
      if (editingTextId) {
        return;
      }

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
      } else if (e.key === 'c' || e.key === 'C') {
        onModeChange('circle');
        // Remove focus from any focused button to clear outline
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 't' || e.key === 'T') {
        onModeChange('triangle');
        // Remove focus from any focused button to clear outline
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'a' || e.key === 'A') {
        onModeChange('text');
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
        // Delete selected shape (only if not editing text)
        if (selectedShapeId) {
          e.preventDefault(); // Prevent browser back navigation on Backspace
          deleteShape(selectedShapeId);
          console.log('🗑️ Shape deleted:', selectedShapeId);
          
          // Show deletion feedback
          setDeleteToast(true);
          setTimeout(() => setDeleteToast(false), 2000);
        }
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        // Show keyboard shortcuts help modal
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange, selectShape, deleteShape, selectedShapeId, editingTextId]);

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
      if (mode === 'rectangle' || mode === 'circle' || mode === 'triangle' || mode === 'text') {
        // Create shape at click position based on current mode with selected color
        const stage = stageRef.current;
        if (stage) {
          const pos = getRelativePointerPosition(stage);
          createShape(pos.x, pos.y, user.id, mode, selectedColor);
        }
      } else {
        // Deselect when clicking empty canvas in select mode
        selectShape(null);
      }
    }
  }, [mode, createShape, selectShape, user.id, selectedColor]);

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
  const handleShapeDragStart = useCallback((shapeId: string) => () => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape) {
      // Mark shape as active in RTDB for ultra-low latency updates
      markShapeActive(shapeId, shape.x, shape.y, 'drag');
      console.log('⚡ Shape drag started, marked active in RTDB:', shapeId);
    }
  }, [shapes, markShapeActive]);

  // Handle shape drag move - memoized  
  const handleShapeDragMove = useCallback((shapeId: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    // Update position in RTDB immediately (no debounce, ~20ms latency)
    updateActivePosition(shapeId, e.target.x(), e.target.y());
    // Skip Firestore update during drag (will update on drag end)
  }, [updateActivePosition]);

  // Handle shape drag end - memoized
  const handleShapeDragEnd = useCallback((shapeId: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    const finalX = e.target.x();
    const finalY = e.target.y();
    
    console.log('⚡ Shape drag ended, saving final position to Firestore:', shapeId);
    
    // Update final position in Firestore (debounced 100ms)
    updateShape(shapeId, {
      x: finalX,
      y: finalY,
      lastModifiedBy: user.id,
    });
    
    // Mark shape as inactive in RTDB (will clean up after 1 second)
    markShapeInactive(shapeId);
  }, [updateShape, user.id, markShapeInactive]);

  // Handle text double-click to start editing - memoized
  const handleTextDoubleClick = useCallback((shapeId: string) => () => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && shape.type === 'text') {
      setEditingTextId(shapeId);
      setEditingTextValue(shape.text || 'Text');
    }
  }, [shapes]);

  // Focus text input when editing starts
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [editingTextId]);

  // Handle text edit submit
  const handleTextEditSubmit = useCallback(() => {
    if (editingTextId && editingTextValue.trim()) {
      updateShape(editingTextId, {
        text: editingTextValue.trim(),
        lastModifiedBy: user.id,
      });
    }
    setEditingTextId(null);
    setEditingTextValue('');
  }, [editingTextId, editingTextValue, updateShape, user.id]);

  // Handle text edit key events
  const handleTextEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextEditSubmit();
    } else if (e.key === 'Escape') {
      setEditingTextId(null);
      setEditingTextValue('');
    }
  }, [handleTextEditSubmit]);

  // Calculate position for text input overlay
  const getTextInputPosition = useCallback(() => {
    if (!editingTextId || !stageRef.current) return { left: 0, top: 0 };
    
    const shape = shapes.find(s => s.id === editingTextId);
    if (!shape) return { left: 0, top: 0 };

    const transform = stageRef.current.getAbsoluteTransform().copy();
    const pos = transform.point({ x: shape.x, y: shape.y });

    return {
      left: pos.x,
      top: pos.y,
    };
  }, [editingTextId, shapes]);

  // Apply selected color to currently selected shape
  const handleApplyColorToSelected = useCallback(() => {
    if (selectedShapeId) {
      updateShape(selectedShapeId, { 
        fill: selectedColor,
        lastModifiedBy: user.id 
      });
      onCloseColorPicker();
    }
  }, [selectedShapeId, selectedColor, updateShape, user.id, onCloseColorPicker]);

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
            // Memoize callbacks per shape to avoid recreating on every render
            const handleSelect = () => selectShape(shape.id);
            const isActive = activeShapes.has(shape.id);
            
            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedShapeId}
                isActive={isActive}
                activeBy={isActive ? activeShapes.get(shape.id) : undefined}
                onSelect={handleSelect}
                onDragStart={handleShapeDragStart(shape.id)}
                onDragMove={handleShapeDragMove(shape.id)}
                onDragEnd={handleShapeDragEnd(shape.id)}
                onTextDoubleClick={shape.type === 'text' ? handleTextDoubleClick(shape.id) : undefined}
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
          <span className="info-value">
            {mode === 'select' && 'Select (V)'}
            {mode === 'rectangle' && 'Rectangle (R)'}
            {mode === 'circle' && 'Circle (C)'}
            {mode === 'triangle' && 'Triangle (T)'}
            {mode === 'text' && 'Text (A)'}
          </span>
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

      {/* Empty state */}
      {shapes.length === 0 && mode === 'select' && (
        <div className="canvas-empty-state">
          <div className="empty-state-icon">🎨</div>
          <h2 className="empty-state-title">Start Creating!</h2>
          <p className="empty-state-message">
            Press <kbd>R</kbd> for rectangles, <kbd>C</kbd> for circles, <kbd>T</kbd> for triangles, <kbd>A</kbd> for text, or <kbd>?</kbd> to see all shortcuts.
          </p>
        </div>
      )}

      {/* Mode instructions */}
      {mode === 'rectangle' && (
        <div className="mode-instruction">
          Click anywhere on canvas to create a rectangle. Press V or ESC to exit.
        </div>
      )}
      {mode === 'circle' && (
        <div className="mode-instruction">
          Click anywhere on canvas to create a circle. Press V or ESC to exit.
        </div>
      )}
      {mode === 'triangle' && (
        <div className="mode-instruction">
          Click anywhere on canvas to create a triangle. Press V or ESC to exit.
        </div>
      )}
      {mode === 'text' && (
        <div className="mode-instruction">
          Click anywhere on canvas to create text. Double-click text to edit. Press V or ESC to exit.
        </div>
      )}

      {/* Keyboard shortcuts help button */}
      <button
        className="shortcuts-help-button"
        onClick={() => setShowShortcuts(true)}
        aria-label="Show keyboard shortcuts"
        title="Show keyboard shortcuts (?)"
      >
        ?
      </button>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Delete toast notification */}
      {deleteToast && (
        <div className="delete-toast">
          <span className="toast-icon">🗑️</span>
          <span className="toast-text">Shape deleted</span>
        </div>
      )}

      {/* Text editing input (rendered outside Konva Stage) */}
      {editingTextId && (
        <input
          ref={textInputRef}
          type="text"
          value={editingTextValue}
          onChange={(e) => setEditingTextValue(e.target.value)}
          onBlur={handleTextEditSubmit}
          onKeyDown={handleTextEditKeyDown}
          style={{
            position: 'absolute',
            left: `${getTextInputPosition().left}px`,
            top: `${getTextInputPosition().top}px`,
            fontSize: `${shapes.find(s => s.id === editingTextId)?.fontSize || 24}px`,
            fontFamily: 'Arial',
            border: '2px solid #667eea',
            padding: '2px 4px',
            outline: 'none',
            backgroundColor: 'white',
            zIndex: 1000,
            minWidth: '100px',
          }}
        />
      )}

      {/* Color picker modal */}
      {showColorPicker && (
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={onColorChange}
          onClose={onCloseColorPicker}
          onApply={selectedShapeId ? handleApplyColorToSelected : undefined}
          showApply={!!selectedShapeId}
        />
      )}
    </div>
  );
}

// No additional exports needed

