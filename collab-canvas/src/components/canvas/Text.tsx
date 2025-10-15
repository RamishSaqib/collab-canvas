import { memo } from 'react';
import { Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { CanvasObject } from '../../lib/types';

interface TextProps {
  shape: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDoubleClick?: () => void;
}

/**
 * Memoized Text component for optimal rendering performance
 * Supports double-click to trigger editing (handled at Canvas level)
 * Only re-renders when shape data, selection state, or callbacks change
 */
function Text({ shape, isSelected, onSelect, onDragStart, onDragEnd, onDoubleClick }: TextProps) {
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

  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent stage double-click event
    e.cancelBubble = true;
    if (onDoubleClick) {
      onDoubleClick();
    }
  };

  return (
    <KonvaText
      name={`shape-${shape.id}`}
      x={shape.x}
      y={shape.y}
      text={shape.text || 'Text'}
      fontSize={shape.fontSize || 24}
      fontFamily="Arial"
      fill={shape.fill}
      draggable
      listening={true}
      perfectDrawEnabled={false}
      hitStrokeWidth={0}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      // Selection styling
      stroke={isSelected ? '#667eea' : undefined}
      strokeWidth={isSelected ? 2 : 0}
      shadowColor={isSelected ? '#667eea' : 'black'}
      shadowBlur={isSelected ? 10 : 5}
      shadowOpacity={isSelected ? 0.6 : 0.3}
      shadowOffset={{ x: 0, y: 2 }}
      shadowForStrokeEnabled={false}
      // Interaction feedback
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'text';
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
function arePropsEqual(prevProps: TextProps, nextProps: TextProps) {
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.text === nextProps.shape.text &&
    prevProps.shape.fontSize === nextProps.shape.fontSize &&
    prevProps.shape.fill === nextProps.shape.fill &&
    prevProps.isSelected === nextProps.isSelected
  );
}

export default memo(Text, arePropsEqual);

