import { memo } from 'react';
import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { CanvasObject } from '../../lib/types';

interface ShapeProps {
  shape: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

/**
 * Memoized Shape component for optimal rendering performance
 * Only re-renders when shape data, selection state, or callbacks change
 */
function Shape({ shape, isSelected, onSelect, onDragStart, onDragEnd }: ShapeProps) {
  // Only render rectangle for now (other shapes in future)
  if (shape.type !== 'rectangle') return null;

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage from being dragged
    e.cancelBubble = true;
    onDragStart();
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage from being dragged
    e.cancelBubble = true;
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
 */
function arePropsEqual(prevProps: ShapeProps, nextProps: ShapeProps) {
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.height === nextProps.shape.height &&
    prevProps.shape.fill === nextProps.shape.fill &&
    prevProps.shape.rotation === nextProps.shape.rotation &&
    prevProps.isSelected === nextProps.isSelected
  );
}

export default memo(Shape, arePropsEqual);

