import { memo } from 'react';
import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { CanvasObject } from '../../lib/types';
import type { ActiveShape } from '../../hooks/useRealtimeSync';
import Circle from './Circle';
import Triangle from './Triangle';
import Text from './Text';

export interface ShapeProps {
  shape: CanvasObject;
  isSelected: boolean;
  isActive?: boolean;
  activeBy?: ActiveShape;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTextChange?: (newText: string) => void;
  onTextDoubleClick?: () => void;
}

/**
 * Memoized Shape component for optimal rendering performance
 * Only re-renders when shape data, selection state, or callbacks change
 * Renders different components based on shape type
 * 
 * isActive indicates the shape is being edited by someone in real-time
 * activeBy contains info about who is editing (userId, userName, userColor)
 */
function Shape({ shape, isSelected, isActive: _isActive, activeBy: _activeBy, onSelect, onDragStart, onDragMove, onDragEnd, onTextDoubleClick }: ShapeProps) {
  // Render different components based on shape type
  if (shape.type === 'circle') {
    return (
      <Circle
        shape={shape}
        isSelected={isSelected}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (shape.type === 'triangle') {
    return (
      <Triangle
        shape={shape}
        isSelected={isSelected}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (shape.type === 'text') {
    return (
      <Text
        shape={shape}
        isSelected={isSelected}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDoubleClick={onTextDoubleClick}
      />
    );
  }

  // Default to rectangle
  if (shape.type !== 'rectangle') return null;

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage from being dragged
    e.cancelBubble = true;
    onDragStart();
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage from being dragged
    e.cancelBubble = true;
    // Call parent handler for RTDB updates
    if (onDragMove) {
      onDragMove(e);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage from being dragged
    e.cancelBubble = true;
    onDragEnd(e);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent stage from receiving mouse down event (stops panning)
    e.cancelBubble = true;
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent stage click event
    e.cancelBubble = true;
    onSelect();
  };

  return (
    <Rect
      name={`shape-${shape.id}`}
      x={shape.x}
      y={shape.y}
      width={shape.width || 150}
      height={shape.height || 100}
      fill={shape.fill}
      rotation={shape.rotation || 0}
      draggable
      listening={true}
      perfectDrawEnabled={false}
      hitStrokeWidth={0}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      // Selection styling
      stroke={isSelected ? '#667eea' : undefined}
      strokeWidth={isSelected ? 3 : 0}
      shadowColor={isSelected ? '#667eea' : 'black'}
      shadowBlur={isSelected ? 10 : 5}
      shadowOpacity={isSelected ? 0.6 : 0.3}
      shadowOffset={{ x: 0, y: 2 }}
      shadowForStrokeEnabled={false}
      // Interaction feedback
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'move';
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'default';
        }
      }}
    />
  );
}

/**
 * Custom comparison function for memo
 * Prevents re-renders when shape properties haven't changed
 * 
 * Note: We intentionally check isActive to re-render when someone starts/stops editing
 */
function arePropsEqual(prevProps: ShapeProps, nextProps: ShapeProps) {
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.type === nextProps.shape.type &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.height === nextProps.shape.height &&
    prevProps.shape.radius === nextProps.shape.radius &&
    prevProps.shape.text === nextProps.shape.text &&
    prevProps.shape.fontSize === nextProps.shape.fontSize &&
    prevProps.shape.fill === nextProps.shape.fill &&
    prevProps.shape.rotation === nextProps.shape.rotation &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActive === nextProps.isActive
  );
}

const MemoizedShape = memo(Shape, arePropsEqual);
export default MemoizedShape;

