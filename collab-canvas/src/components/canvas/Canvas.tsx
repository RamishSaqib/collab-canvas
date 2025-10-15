import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle as KonvaCircle, RegularPolygon, Text as KonvaText, Transformer } from 'react-konva';
import type Konva from 'konva';
import { clampZoom, calculateZoomPosition, getZoomPoint, fitStageToWindow, getRelativePointerPosition } from '../../utils/canvas';
import { useCanvas } from '../../hooks/useCanvas';
import { useCursors } from '../../hooks/useCursors';
import { usePresence } from '../../hooks/usePresence';
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
  const [cursorPreviewPos, setCursorPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefsMap = useRef<Map<string, Konva.Node>>(new Map());
  const isPanningRef = useRef(false);
  const lastPanPositionRef = useRef({ x: 0, y: 0 });
  const textInputRef = useRef<HTMLInputElement>(null);
  
  const {
    shapes,
    selectedShapeIds,
    activeShapes,
    createShape,
    updateShape,
    updateShapes,
    deleteShape,
    deleteShapes,
    duplicateShapes,
    selectShapes,
    toggleShapeSelection,
    clearSelection,
    selectAll,
    updateActivePosition,
    markShapeActive,
    markShapeInactive,
  } = useCanvas({ user });

  const { otherCursors, broadcastCursor } = useCursors({
    userId: user.id,
    userName: user.name,
    userColor: user.color,
  });

  const { onlineUsers } = usePresence({
    userId: user.id,
    userName: user.name,
    userColor: user.color,
  });
  
  // Create a map of userId -> userName for tooltips
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    onlineUsers.forEach(u => map.set(u.userId, u.userName));
    map.set(user.id, user.name); // Include current user
    return map;
  }, [onlineUsers, user.id, user.name]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize(fitStageToWindow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear cursor preview when switching to select mode
  useEffect(() => {
    if (mode === 'select') {
      setCursorPreviewPos(null);
    }
  }, [mode]);

  // Performance monitoring: Check for potential memory leaks
  useEffect(() => {
    const interval = setInterval(() => {
      checkMemoryLeaks(shapes.length, 500); // Warn if > 500 shapes
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [shapes.length]);

  // Attach Transformer to selected shapes
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    // Get all selected shape nodes
    const selectedNodes: Konva.Node[] = [];
    selectedShapeIds.forEach(id => {
      const node = shapeRefsMap.current.get(id);
      if (node) {
        selectedNodes.push(node);
      }
    });

    // Attach transformer to selected nodes
    transformer.nodes(selectedNodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedShapeIds]);

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
      // Check if user is typing in an input/textarea (don't interfere with text editing)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || editingTextId) {
        return;
      }

      // Ctrl/Cmd key shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'd' || e.key === 'D') {
          // Ctrl+D: Duplicate selected shapes
          e.preventDefault();
          if (selectedShapeIds.length > 0) {
            duplicateShapes(selectedShapeIds, user.id);
            console.log('📋 Duplicated', selectedShapeIds.length, 'shape(s)');
          }
        } else if (e.key === 'a' || e.key === 'A') {
          // Ctrl+A: Select all shapes
          e.preventDefault();
          selectAll();
          console.log('✅ Selected all shapes');
        } else if (e.key === ']') {
          // Ctrl+]: Bring to front
          e.preventDefault();
          if (selectedShapeIds.length > 0) {
            const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0));
            updateShapes(selectedShapeIds, { zIndex: maxZIndex + 1 });
            console.log('⬆️ Brought to front');
          }
        } else if (e.key === '[') {
          // Ctrl+[: Send to back
          e.preventDefault();
          if (selectedShapeIds.length > 0) {
            const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0));
            updateShapes(selectedShapeIds, { zIndex: minZIndex - 1 });
            console.log('⬇️ Sent to back');
          }
        }
        return; // Don't process other keys when Ctrl/Cmd is held
      }

      // Regular key shortcuts
      if (e.key === 'v' || e.key === 'V') {
        onModeChange('select');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        onModeChange('rectangle');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        onModeChange('circle');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 't' || e.key === 'T') {
        onModeChange('triangle');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'a' || e.key === 'A') {
        onModeChange('text');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'Escape') {
        onModeChange('select');
        clearSelection();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected shapes
        if (selectedShapeIds.length > 0) {
          e.preventDefault(); // Prevent browser back navigation on Backspace
          deleteShapes(selectedShapeIds);
          console.log('🗑️ Deleted', selectedShapeIds.length, 'shape(s)');
          
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
  }, [onModeChange, clearSelection, deleteShapes, duplicateShapes, selectAll, updateShapes, selectedShapeIds, editingTextId, user.id, shapes]);

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
        clearSelection();
      }
    }
  }, [mode, createShape, clearSelection, user.id, selectedColor]);

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
    
    // Update cursor preview position for shape creation modes
    if (mode !== 'select') {
      setCursorPreviewPos(pos);
    }
  }, [broadcastCursor, mode]);

  // Handle mouse enter to show cursor preview
  const handleStageMouseEnter = useCallback(() => {
    if (mode !== 'select') {
      const stage = stageRef.current;
      if (stage) {
        const pos = getRelativePointerPosition(stage);
        setCursorPreviewPos(pos);
      }
    }
  }, [mode]);

  // Handle mouse leave to hide cursor preview
  const handleStageMouseLeave = useCallback(() => {
    setCursorPreviewPos(null);
  }, []);

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

  // Handle applying color to selected shapes
  const handleApplyColorToSelected = useCallback(() => {
    if (selectedShapeIds.length > 0) {
      updateShapes(selectedShapeIds, { fill: selectedColor, lastModifiedBy: user.id });
      console.log('🎨 Applied color to', selectedShapeIds.length, 'shape(s)');
      onCloseColorPicker();
    }
  }, [selectedShapeIds, selectedColor, updateShapes, user.id, onCloseColorPicker]);

  // Handle transform end (resize/rotate)
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const shapeId = node.id();
    
    // Get the transformed properties
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    
    // Calculate new width and height based on scale
    const newWidth = Math.max(5, node.width() * scaleX);
    const newHeight = Math.max(5, node.height() * scaleY);
    
    // Reset scale to 1 (we store the actual width/height instead)
    node.scaleX(1);
    node.scaleY(1);
    
    // Update shape in state with new dimensions and rotation
    const shape = shapes.find(s => s.id === shapeId);
    if (shape) {
      const updates: Partial<typeof shape> = {
        rotation: rotation,
        lastModifiedBy: user.id,
      };
      
      // Handle different shape types
      if (shape.type === 'rectangle' || shape.type === 'triangle') {
        updates.width = newWidth;
        updates.height = newHeight;
      } else if (shape.type === 'circle') {
        // For circles, use average of width/height as radius
        updates.radius = (newWidth + newHeight) / 4;
      } else if (shape.type === 'text') {
        // For text, scale the font size
        const currentFontSize = shape.fontSize || 24;
        const scaleFactor = (scaleX + scaleY) / 2;
        updates.fontSize = Math.max(8, Math.round(currentFontSize * scaleFactor));
      }
      
      updateShape(shapeId, updates);
      console.log('🔧 Transformed shape:', shapeId, updates);
    }
  }, [shapes, updateShape, user.id]);

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
        onMouseEnter={handleStageMouseEnter}
        onMouseLeave={handleStageMouseLeave}
      >
        <Layer listening={true}>
          {/* Render all shapes */}
          {shapes.map(shape => {
            // Memoize callbacks per shape to avoid recreating on every render
            const handleSelect = (e: any) => {
              const isShiftHeld = e.evt?.shiftKey || false;
              if (isShiftHeld) {
                // Shift+Click: toggle selection
                toggleShapeSelection(shape.id);
              } else {
                // Regular click: select only this shape
                selectShapes([shape.id]);
              }
            };
            const isActive = activeShapes.has(shape.id);
            const lastModifiedUserName = userNameMap.get(shape.lastModifiedBy);
            
            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeIds.includes(shape.id)}
                isActive={isActive}
                activeBy={isActive ? activeShapes.get(shape.id) : undefined}
                onSelect={handleSelect}
                onDragStart={handleShapeDragStart(shape.id)}
                onDragMove={handleShapeDragMove(shape.id)}
                onDragEnd={handleShapeDragEnd(shape.id)}
                onTextDoubleClick={shape.type === 'text' ? handleTextDoubleClick(shape.id) : undefined}
                userName={lastModifiedUserName}
                shapeRef={(node: Konva.Node | null) => {
                  if (node) {
                    shapeRefsMap.current.set(shape.id, node);
                  } else {
                    shapeRefsMap.current.delete(shape.id);
                  }
                }}
              />
            );
          })}
          
          {/* Transformer for resize and rotate */}
          <Transformer
            ref={transformerRef}
            onTransformEnd={handleTransformEnd}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum 5x5 pixels
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
          
          {/* Render other users' cursors */}
          {otherCursors.map(cursor => (
            <Cursor
              key={cursor.userId}
              cursor={cursor}
              stageScale={stageScale}
            />
          ))}
          
          {/* Cursor preview - show what shape will be created */}
          {cursorPreviewPos && mode !== 'select' && (
            <>
              {mode === 'rectangle' && (
                <Rect
                  x={cursorPreviewPos.x - 75}
                  y={cursorPreviewPos.y - 50}
                  width={150}
                  height={100}
                  fill={selectedColor}
                  opacity={0.3}
                  stroke={selectedColor}
                  strokeWidth={2}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              {mode === 'circle' && (
                <KonvaCircle
                  x={cursorPreviewPos.x}
                  y={cursorPreviewPos.y}
                  radius={50}
                  fill={selectedColor}
                  opacity={0.3}
                  stroke={selectedColor}
                  strokeWidth={2}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              {mode === 'triangle' && (
                <RegularPolygon
                  x={cursorPreviewPos.x}
                  y={cursorPreviewPos.y}
                  sides={3}
                  radius={50}
                  fill={selectedColor}
                  opacity={0.3}
                  stroke={selectedColor}
                  strokeWidth={2}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              {mode === 'text' && (
                <KonvaText
                  x={cursorPreviewPos.x - 30}
                  y={cursorPreviewPos.y - 14}
                  text="Text"
                  fontSize={28}
                  fill={selectedColor}
                  opacity={0.5}
                  fontFamily="Arial"
                  listening={false}
                />
              )}
            </>
          )}
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
          onApply={selectedShapeIds.length > 0 ? handleApplyColorToSelected : undefined}
          showApply={selectedShapeIds.length > 0}
        />
      )}
    </div>
  );
}

// No additional exports needed

