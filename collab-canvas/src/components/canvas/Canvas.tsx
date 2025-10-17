import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle as KonvaCircle, RegularPolygon, Text as KonvaText, Transformer } from 'react-konva';
import type Konva from 'konva';
import { clampZoom, calculateZoomPosition, getZoomPoint, fitStageToWindow, getRelativePointerPosition } from '../../utils/canvas';
import { konvaToGrid, getCenterPoint } from '../../utils/coordinates';
import { useCanvas } from '../../hooks/useCanvas';
import { useCursors } from '../../hooks/useCursors';
import { usePresence } from '../../hooks/usePresence';
import { useComments } from '../../hooks/useComments';
import { useAIAgent } from '../../hooks/useAIAgent';
import { checkMemoryLeaks } from '../../utils/performance';
import Shape from './Shape';
import Cursor from './Cursor';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import ColorPicker from './ColorPicker';
import TextFormatBar from './TextFormatBar';
import AlignmentToolbar from './AlignmentToolbar';
import CommentPin from './CommentPin';
import CommentPanel from './CommentPanel';
import CommentInputDialog from './CommentInputDialog';
import {
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
} from '../../utils/alignment';
import './Canvas.css';

export type CanvasMode = 'select' | 'hand' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'comment';

interface CanvasProps {
  user: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
  projectId: string;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  showColorPicker: boolean;
  onCloseColorPicker: () => void;
  onGenerateTestShapes?: (count: number) => void;
  onClearAllShapes?: () => void;
}

export default function Canvas({ user, projectId, mode, onModeChange, selectedColor, onColorChange, showColorPicker, onCloseColorPicker, onGenerateTestShapes, onClearAllShapes }: CanvasProps) {
  const [stageSize, setStageSize] = useState(fitStageToWindow());
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [deleteToast, setDeleteToast] = useState(false);
  const [undoRedoToast, setUndoRedoToast] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [commentInputDialog, setCommentInputDialog] = useState<{ x: number; y: number; shapeId?: string } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [cursorPreviewPos, setCursorPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [activeSelectionIndex, setActiveSelectionIndex] = useState(0);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefsMap = useRef<Map<string, Konva.Node>>(new Map());
  const isPanningRef = useRef(false);
  const didPanRef = useRef(false); // Track if user actually moved during pan
  const isSelectingRef = useRef(false); // Track if user is drawing selection box
  const lastPanPositionRef = useRef({ x: 0, y: 0 });
  const textInputRef = useRef<HTMLInputElement>(null);
  
  const {
    shapes,
    selectedShapeIds,
    activeShapes,
    batchCreateShapes,
    updateShape,
    updateShapes,
    batchDeleteShapes,
    duplicateShapes,
    selectShapes,
    toggleShapeSelection,
    clearSelection,
    selectAll,
    updateActivePosition,
    markShapeActive,
    markShapeInactive,
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    createShapeWithHistory,
    batchCreateShapesWithHistory,
    deleteShapesWithHistory,
    updateShapesWithHistory,
  } = useCanvas({ user, projectId });

  // AI Agent for natural language commands
  const {
    processCommand: processAICommand,
    isProcessing: isAIProcessing,
    lastError: aiError,
  } = useAIAgent(
    shapes,
    selectedShapeIds,
    user.id,
    createShapeWithHistory,
    batchCreateShapesWithHistory,
    updateShapesWithHistory,
    deleteShapesWithHistory,
    stagePosition,
    stageScale
  );

  // Expose AI command handler via window for App to access
  useEffect(() => {
    (window as any).__processAICommand = processAICommand;
    (window as any).__isAIProcessing = isAIProcessing;
    (window as any).__aiError = aiError;
    
    return () => {
      delete (window as any).__processAICommand;
      delete (window as any).__isAIProcessing;
      delete (window as any).__aiError;
    };
  }, [processAICommand, isAIProcessing, aiError]);

  const { otherCursors, broadcastCursor } = useCursors({
    projectId,
    userId: user.id,
    userName: user.name,
    userColor: user.color,
  });

  const { onlineUsers } = usePresence({
    projectId,
    userId: user.id,
    userName: user.name,
    userColor: user.color,
  });

  // Filter cursors to only show online users (prevent ghost cursors)
  const onlineCursors = useMemo(() => {
    const onlineUserIds = new Set(onlineUsers.map(u => u.userId));
    return otherCursors.filter(cursor => onlineUserIds.has(cursor.userId));
  }, [otherCursors, onlineUsers]);

  // Comments system
  const {
    comments,
    createComment,
    updateComment,
    toggleResolveComment,
    deleteComment,
  } = useComments({
    projectId: projectId,
    userId: user.id,
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

  // Reset active selection index when selection changes
  useEffect(() => {
    setActiveSelectionIndex(0);
  }, [selectedShapeIds]);

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

    // Only show transformer for single selection
    // For multi-select, just show individual highlights (no big bounding box)
    if (selectedNodes.length === 1) {
      transformer.nodes(selectedNodes);
    } else {
      // Hide transformer for multi-select (shapes will still show selection highlight)
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [selectedShapeIds]);

  // Handle mouse move and up on document for panning and selection box
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      // Handle panning
      if (isPanningRef.current) {
      const dx = e.clientX - lastPanPositionRef.current.x;
      const dy = e.clientY - lastPanPositionRef.current.y;

        // If mouse moved more than 3 pixels, consider it a pan (not just a click)
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          didPanRef.current = true;
        }

      setStagePosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastPanPositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
      }

      // Handle selection box drawing
      if (isSelectingRef.current) {
        const stage = stageRef.current;
        if (stage && selectionBox) {
          const pos = getRelativePointerPosition(stage);
          setSelectionBox(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null);
        }
      }
    };

    const handleDocumentMouseUp = () => {
      // Handle pan cleanup
      if (isPanningRef.current) {
      isPanningRef.current = false;
        // Reset didPan after a brief delay (after click event fires)
        setTimeout(() => {
          didPanRef.current = false;
        }, 50);
      }

      // Handle selection box cleanup
      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        
        // Select all shapes that intersect with selection box
        if (selectionBox) {
          const { x1, y1, x2, y2 } = selectionBox;
          const minX = Math.min(x1, x2);
          const maxX = Math.max(x1, x2);
          const minY = Math.min(y1, y2);
          const maxY = Math.max(y1, y2);
          
          const selectedIds = shapes
            .filter(shape => {
              // Check if shape's bounding box intersects with selection box
              const shapeX = shape.x;
              const shapeY = shape.y;
              const shapeWidth = shape.width || shape.radius || 100;
              const shapeHeight = shape.height || shape.radius || 100;
              
              return (
                shapeX + shapeWidth >= minX &&
                shapeX <= maxX &&
                shapeY + shapeHeight >= minY &&
                shapeY <= maxY
              );
            })
            .map(shape => shape.id);
          
          if (selectedIds.length > 0) {
            selectShapes(selectedIds);
            console.log('✅ Selected', selectedIds.length, 'shape(s) with selection box');
          }
        }
        
        // Clear selection box
        setSelectionBox(null);
      }
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [selectionBox, shapes, selectShapes]);

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
        if (e.key === 'z' || e.key === 'Z') {
          // Ctrl+Z: Undo or Ctrl+Shift+Z: Redo
          e.preventDefault();
          if (e.shiftKey) {
            // Redo
            if (canRedo) {
              const description = redo();
              console.log('↪️ Redo:', description);
              setUndoRedoToast('Redo');
              setTimeout(() => setUndoRedoToast(null), 1500);
            }
          } else {
            // Undo
            if (canUndo) {
              const description = undo();
              console.log('↩️ Undo:', description);
              setUndoRedoToast('Undo');
              setTimeout(() => setUndoRedoToast(null), 1500);
            }
          }
        } else if (e.key === 'd' || e.key === 'D') {
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
        } else if (e.key === 'b' || e.key === 'B') {
          // Ctrl+B: Toggle bold for selected text shapes
          e.preventDefault();
          handleBoldToggle();
        } else if (e.key === 'i' || e.key === 'I') {
          // Ctrl+I: Toggle italic for selected text shapes
          e.preventDefault();
          handleItalicToggle();
        }
        return; // Don't process other keys when Ctrl/Cmd is held
      }

      // Regular key shortcuts
      if (e.key === 'v' || e.key === 'V') {
        onModeChange('select');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        onModeChange('hand');
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
          // Use history-enabled deletion for undo/redo support
          deleteShapesWithHistory(selectedShapeIds);
          console.log('🗑️ Deleted', selectedShapeIds.length, 'shape(s)');
          
          // Show deletion feedback
          setDeleteToast(true);
          setTimeout(() => setDeleteToast(false), 2000);
        }
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        // Show keyboard shortcuts help modal
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Arrow keys: cycle through selected shapes
        if (selectedShapeIds.length > 1) {
          e.preventDefault();
          const newIndex = e.key === 'ArrowRight' 
            ? (activeSelectionIndex + 1) % selectedShapeIds.length
            : (activeSelectionIndex - 1 + selectedShapeIds.length) % selectedShapeIds.length;
          
          setActiveSelectionIndex(newIndex);
          
          // Pan to the active shape
          const activeShapeId = selectedShapeIds[newIndex];
          const activeShape = shapes.find(s => s.id === activeShapeId);
          if (activeShape && stageRef.current) {
            const stage = stageRef.current;
            const scale = stage.scaleX();
            
            // Calculate position to center the shape in viewport
            const newX = (stage.width() / 2) - (activeShape.x * scale);
            const newY = (stage.height() / 2) - (activeShape.y * scale);
            
            setStagePosition({ x: newX, y: newY });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange, clearSelection, deleteShapesWithHistory, duplicateShapes, selectAll, updateShapes, selectedShapeIds, editingTextId, user.id, shapes, activeSelectionIndex, stageScale, undo, redo, canUndo, canRedo]);

  // Determine if text format bar should be shown and get common formatting
  const selectedTextShapes = useMemo(() => {
    return selectedShapeIds
      .map(id => shapes.find(s => s.id === id))
      .filter(shape => shape && shape.type === 'text');
  }, [selectedShapeIds, shapes]);

  const showTextFormatBar = selectedTextShapes.length > 0;

  // Get common formatting from selected text shapes
  const commonTextFormat = useMemo(() => {
    if (selectedTextShapes.length === 0) {
      return { fontSize: 24, fontStyle: 'normal' as const };
    }

    // Use first shape's values as baseline
    const firstShape = selectedTextShapes[0];
    return {
      fontSize: firstShape?.fontSize || 24,
      fontStyle: firstShape?.fontStyle || ('normal' as const),
    };
  }, [selectedTextShapes]);

  // Handle font size change for selected text shapes
  const handleFontSizeChange = useCallback((newSize: number) => {
    const textShapeIds = selectedTextShapes.map(s => s!.id);
    if (textShapeIds.length > 0) {
      updateShapes(textShapeIds, { fontSize: newSize });
      console.log('📝 Changed font size to', newSize);
    }
  }, [selectedTextShapes, updateShapes]);

  // Handle bold toggle for selected text shapes
  const handleBoldToggle = useCallback(() => {
    const textShapeIds = selectedTextShapes.map(s => s!.id);
    if (textShapeIds.length === 0) return;

    const currentStyle = commonTextFormat.fontStyle;
    let newStyle: 'normal' | 'bold' | 'italic' | 'bold italic';

    if (currentStyle === 'normal') {
      newStyle = 'bold';
    } else if (currentStyle === 'bold') {
      newStyle = 'normal';
    } else if (currentStyle === 'italic') {
      newStyle = 'bold italic';
    } else { // 'bold italic'
      newStyle = 'italic';
    }

    updateShapes(textShapeIds, { fontStyle: newStyle });
    console.log('📝 Toggled bold:', newStyle);
  }, [selectedTextShapes, commonTextFormat, updateShapes]);

  // Handle italic toggle for selected text shapes
  const handleItalicToggle = useCallback(() => {
    const textShapeIds = selectedTextShapes.map(s => s!.id);
    if (textShapeIds.length === 0) return;

    const currentStyle = commonTextFormat.fontStyle;
    let newStyle: 'normal' | 'bold' | 'italic' | 'bold italic';

    if (currentStyle === 'normal') {
      newStyle = 'italic';
    } else if (currentStyle === 'italic') {
      newStyle = 'normal';
    } else if (currentStyle === 'bold') {
      newStyle = 'bold italic';
    } else { // 'bold italic'
      newStyle = 'bold';
    }

    updateShapes(textShapeIds, { fontStyle: newStyle });
    console.log('📝 Toggled italic:', newStyle);
  }, [selectedTextShapes, commonTextFormat, updateShapes]);

  // Alignment handlers
  const handleAlignLeft = useCallback(() => {
    if (selectedShapeIds.length < 2) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignLeft(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↔️ Aligned left');
  }, [selectedShapeIds, shapes, updateShape]);

  const handleAlignCenter = useCallback(() => {
    if (selectedShapeIds.length < 2) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignCenter(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↔️ Aligned center');
  }, [selectedShapeIds, shapes, updateShape]);

  const handleAlignRight = useCallback(() => {
    if (selectedShapeIds.length < 2) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignRight(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↔️ Aligned right');
  }, [selectedShapeIds, shapes, updateShape]);

  const handleAlignTop = useCallback(() => {
    if (selectedShapeIds.length < 2) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignTop(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↕️ Aligned top');
  }, [selectedShapeIds, shapes, updateShape]);

  const handleAlignMiddle = useCallback(() => {
    if (selectedShapeIds.length < 2) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignMiddle(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↕️ Aligned middle');
  }, [selectedShapeIds, shapes, updateShape]);

  const handleAlignBottom = useCallback(() => {
    if (selectedShapeIds.length < 2) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignBottom(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↕️ Aligned bottom');
  }, [selectedShapeIds, shapes, updateShape]);

  const handleDistributeHorizontally = useCallback(() => {
    if (selectedShapeIds.length < 3) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = distributeHorizontally(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↔️ Distributed horizontally');
  }, [selectedShapeIds, shapes, updateShape]);

  const handleDistributeVertically = useCallback(() => {
    if (selectedShapeIds.length < 3) return;
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = distributeVertically(selectedShapes);
    updates.forEach((update, id) => {
      updateShape(id, update);
    });
    console.log('↕️ Distributed vertically');
  }, [selectedShapeIds, shapes, updateShape]);

  // Comment handlers
  const handleCommentSubmit = useCallback(async (text: string) => {
    if (!commentInputDialog) return;
    
    await createComment(
      text,
      { x: commentInputDialog.x, y: commentInputDialog.y },
      { id: user.id, name: user.name, color: user.color },
      commentInputDialog.shapeId
    );
    setCommentInputDialog(null);
    onModeChange('select'); // Return to select mode after commenting
  }, [commentInputDialog, createComment, user, onModeChange]);

  const handleCommentCancel = useCallback(() => {
    setCommentInputDialog(null);
  }, []);

  const handleCommentPinClick = useCallback((commentId: string) => {
    setSelectedCommentId(commentId);
  }, []);

  const handleCommentPanelClose = useCallback(() => {
    setSelectedCommentId(null);
  }, []);

  const handleCommentUpdate = useCallback(async (commentId: string, text: string) => {
    await updateComment(commentId, text);
  }, [updateComment]);

  const handleCommentResolve = useCallback(async (commentId: string, resolved: boolean) => {
    await toggleResolveComment(commentId, !resolved);
  }, [toggleResolveComment]);

  const handleCommentDelete = useCallback(async (commentId: string) => {
    await deleteComment(commentId);
    setSelectedCommentId(null);
  }, [deleteComment]);

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

  // Handle stage click (for creating shapes, comments, or deselecting) - memoized
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on the stage itself (not a shape)
    if (e.target === e.target.getStage()) {
      if (mode === 'comment') {
        // Create comment at click position
        const stage = stageRef.current;
        if (stage) {
          const canvasPos = getRelativePointerPosition(stage);
          const screenPos = stage.getPointerPosition();
          if (screenPos) {
            setCommentInputDialog({ x: screenPos.x, y: screenPos.y });
            // Store the canvas position for later when comment is submitted
            setCommentInputDialog({ x: canvasPos.x, y: canvasPos.y });
          }
        }
      } else if (mode === 'rectangle' || mode === 'circle' || mode === 'triangle' || mode === 'text') {
        // Create shape at click position based on current mode with selected color
        const stage = stageRef.current;
        if (stage) {
          const pos = getRelativePointerPosition(stage);
          // Use history-enabled creation for undo/redo support
          createShapeWithHistory(pos.x, pos.y, user.id, mode, selectedColor);
        }
      } else if (mode === 'select' && !e.evt.shiftKey && !didPanRef.current) {
        // Only deselect if: not holding Shift AND didn't pan the canvas
        clearSelection();
      }
    }
  }, [mode, createShapeWithHistory, clearSelection, user.id, selectedColor]);

  // Manual panning or selection box: Handle mouse down on stage - memoized
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    
    if (mode === 'hand') {
      // Hand tool: ALWAYS pan, even if clicking on shapes (ignore shapes entirely)
      e.cancelBubble = true; // Prevent shape interactions
      isPanningRef.current = true;
      didPanRef.current = false;
      lastPanPositionRef.current = {
        x: e.evt.clientX,
        y: e.evt.clientY,
      };
    } else if (clickedOnEmpty && mode === 'select') {
      // Select mode: middle mouse button = pan, otherwise = selection box
      // (Removed Ctrl/Cmd requirement - hand tool replaces that)
      const shouldPan = e.evt.button === 1;
      
      if (shouldPan) {
        // Start panning
        isPanningRef.current = true;
        didPanRef.current = false;
        lastPanPositionRef.current = {
          x: e.evt.clientX,
          y: e.evt.clientY,
        };
      } else {
        // Start drawing selection box
        isSelectingRef.current = true;
        if (stage) {
          const pos = getRelativePointerPosition(stage);
          setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
        }
      }
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
      // Select only this text shape for formatting
      selectShapes([shapeId]);
    }
  }, [shapes, selectShapes]);

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

  // Performance test: Generate test shapes (optimized with batch operations)
  const generateTestShapes = useCallback(async (count: number) => {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const types = ['rectangle', 'circle', 'triangle', 'text'] as const;
    
    console.log(`🧪 Generating ${count} test shapes...`);
    
    // Create all shapes data at once
    const shapesData = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2000 - 500;
      const y = Math.random() * 2000 - 500;
      const type = types[Math.floor(Math.random() * types.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const baseShape = {
        type,
        x,
        y,
        fill: color,
        rotation: 0,
        zIndex: 0,
        createdBy: user.id,
        lastModifiedBy: user.id,
      };

      // Add type-specific properties
      if (type === 'circle') {
        shapesData.push({ ...baseShape, radius: 50 });
      } else if (type === 'triangle') {
        shapesData.push({ ...baseShape, width: 100, height: 100 });
      } else if (type === 'text') {
        shapesData.push({ ...baseShape, text: 'Text', fontSize: 24, fontStyle: 'normal' as const, textAlign: 'left' as const });
      } else {
        shapesData.push({ ...baseShape, width: 150, height: 100 });
      }
    }
    
    // Batch create all shapes at once
    await batchCreateShapes(shapesData as any);
    console.log(`✅ Generated ${count} shapes for performance testing`);
  }, [batchCreateShapes, user.id]);

  // Clear all shapes and comments
  const clearAllShapes = useCallback(async () => {
    if (window.confirm(`Delete all ${shapes.length} shapes and ${comments.length} comments?`)) {
      const allIds = shapes.map(s => s.id);
      // Delete all shapes
      await batchDeleteShapes(allIds);
      // Delete all comments
      await Promise.all(comments.map(c => deleteComment(c.id)));
    }
  }, [shapes, comments, batchDeleteShapes, deleteComment]);

  // Call the prop callbacks when functions are invoked
  useEffect(() => {
    if (onGenerateTestShapes) {
      // Store ref so Toolbar can call it
      (window as any).__generateTestShapes = generateTestShapes;
    }
  }, [generateTestShapes, onGenerateTestShapes]);

  useEffect(() => {
    if (onClearAllShapes) {
      // Store ref so Toolbar can call it
      (window as any).__clearAllShapes = clearAllShapes;
    }
  }, [clearAllShapes, onClearAllShapes]);


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

  // Calculate grid coordinates for selected shapes
  const gridCoordinates = useMemo(() => {
    if (selectedShapeIds.length === 0) {
      return { x: 0, y: 0, visible: false };
    }

    // Get positions of all selected shapes
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const positions = selectedShapes.map(s => ({ x: s.x, y: s.y }));

    // Get center point if multiple shapes selected
    const centerPoint = positions.length === 1 
      ? positions[0] 
      : getCenterPoint(positions);

    // Convert to grid coordinates
    const gridCoords = konvaToGrid(centerPoint.x, centerPoint.y);

    return {
      x: gridCoords.x,
      y: gridCoords.y,
      visible: true,
    };
  }, [selectedShapeIds, shapes]);

  return (
    <div className={`canvas-container ${mode === 'hand' ? 'hand-mode' : ''}`}>
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
            const isBeingEdited = editingTextId === shape.id;
            
            return (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={!isBeingEdited && selectedShapeIds.includes(shape.id)}
                isActive={!isBeingEdited && isActive}
                activeBy={!isBeingEdited && isActive ? activeShapes.get(shape.id) : undefined}
                onSelect={handleSelect}
                onDragStart={handleShapeDragStart(shape.id)}
                onDragMove={handleShapeDragMove(shape.id)}
                onDragEnd={handleShapeDragEnd(shape.id)}
                onTextDoubleClick={shape.type === 'text' ? handleTextDoubleClick(shape.id) : undefined}
                userName={lastModifiedUserName}
                userColor={user.color}
                isDraggable={mode !== 'hand'} // Disable dragging in hand mode
                isListening={mode !== 'hand'} // Disable all interactions in hand mode
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
            rotateAnchorOffset={35}
            rotateAnchorCursor="grab"
            anchorSize={10}
            anchorFill="#667eea"
            anchorStroke="#ffffff"
            anchorStrokeWidth={2}
            anchorCornerRadius={5}
            rotateEnabled={true}
            anchorStyleFunc={(anchor) => {
              // Make rotation anchor circular and more prominent
              if (anchor.hasName('rotater')) {
                anchor.fill('#4F46E5');
                anchor.stroke('#ffffff');
                anchor.strokeWidth(3);
                anchor.width(16);
                anchor.height(16);
                anchor.offsetX(8);
                anchor.offsetY(8);
                anchor.cornerRadius(8); // Make it circular
              }
            }}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum 5x5 pixels
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
          
          {/* Render other users' cursors (only online users) */}
          {onlineCursors.map(cursor => (
            <Cursor
              key={cursor.userId}
              cursor={cursor}
              stageScale={stageScale}
            />
          ))}

          {/* Render comment pins */}
          {comments.map(comment => (
            <CommentPin
              key={comment.id}
              comment={comment}
              onClick={() => handleCommentPinClick(comment.id)}
              isSelected={selectedCommentId === comment.id}
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

          {/* Selection box for drag-to-select */}
          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.x1, selectionBox.x2)}
              y={Math.min(selectionBox.y1, selectionBox.y2)}
              width={Math.abs(selectionBox.x2 - selectionBox.x1)}
              height={Math.abs(selectionBox.y2 - selectionBox.y1)}
              fill="rgba(102, 126, 234, 0.1)"
              stroke="#667eea"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
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
        {gridCoordinates.visible && (
          <div className="info-item">
            <span className="info-label">Position:</span>
            <span className="info-value">({gridCoordinates.x}, {gridCoordinates.y})</span>
          </div>
        )}
      </div>

      {/* Multi-select counter */}
      {selectedShapeIds.length > 1 && (
        <div className="selection-counter">
          <div className="selection-count">
            <span className="selection-icon">✓</span>
            <span className="selection-number">{selectedShapeIds.length} selected</span>
          </div>
          <div className="selection-navigation">
            <span className="selection-hint">← → to navigate</span>
            {selectedShapeIds.length > 1 && (
              <span className="selection-position">
                {activeSelectionIndex + 1} / {selectedShapeIds.length}
              </span>
            )}
          </div>
        </div>
      )}

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
      {mode === 'hand' && (
        <div className="mode-instruction">
          Click and drag to pan the canvas. Press V or ESC to switch to select tool.
        </div>
      )}
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

      {/* Undo/Redo toast notification */}
      {undoRedoToast && (
        <div className="delete-toast">
          <span className="toast-icon">{undoRedoToast === 'Undo' ? '↩️' : '↪️'}</span>
          <span className="toast-text">{undoRedoToast}</span>
        </div>
      )}

      {/* Text editing input (rendered outside Konva Stage) */}
      {editingTextId && (() => {
        const editingShape = shapes.find(s => s.id === editingTextId);
        const fontStyle = editingShape?.fontStyle || 'normal';
        const isBold = fontStyle === 'bold' || fontStyle === 'bold italic';
        const isItalic = fontStyle === 'italic' || fontStyle === 'bold italic';
        
        return (
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
              fontSize: `${editingShape?.fontSize || 24}px`,
            fontFamily: 'Arial',
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
            border: '2px solid #667eea',
            padding: '2px 4px',
            outline: 'none',
            backgroundColor: 'white',
            zIndex: 1000,
            minWidth: '100px',
          }}
        />
        );
      })()}

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

      {/* Text formatting toolbar */}
      {showTextFormatBar && (
        <TextFormatBar
          fontSize={commonTextFormat.fontSize}
          fontStyle={commonTextFormat.fontStyle}
          onFontSizeChange={handleFontSizeChange}
          onBoldToggle={handleBoldToggle}
          onItalicToggle={handleItalicToggle}
        />
      )}

      {/* Alignment toolbar - shows when 2+ shapes selected */}
      {selectedShapeIds.length >= 2 && (
        <AlignmentToolbar
          onAlignLeft={handleAlignLeft}
          onAlignCenter={handleAlignCenter}
          onAlignRight={handleAlignRight}
          onAlignTop={handleAlignTop}
          onAlignMiddle={handleAlignMiddle}
          onAlignBottom={handleAlignBottom}
          onDistributeHorizontally={handleDistributeHorizontally}
          onDistributeVertically={handleDistributeVertically}
          canDistribute={selectedShapeIds.length >= 3}
        />
      )}

      {/* Comment input dialog */}
      {commentInputDialog && (
        <CommentInputDialog
          position={commentInputDialog}
          onSubmit={handleCommentSubmit}
          onCancel={handleCommentCancel}
        />
      )}

      {/* Comment panel */}
      {selectedCommentId && (() => {
        const comment = comments.find(c => c.id === selectedCommentId);
        if (!comment) return null;
        
        return (
          <CommentPanel
            comment={comment}
            onClose={handleCommentPanelClose}
            onResolve={() => handleCommentResolve(comment.id, comment.resolved)}
            onDelete={() => handleCommentDelete(comment.id)}
            onUpdate={(text) => handleCommentUpdate(comment.id, text)}
            canDelete={comment.author.id === user.id}
          />
        );
      })()}
    </div>
  );
}

// No additional exports needed

