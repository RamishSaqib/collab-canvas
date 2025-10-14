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

export default function Shape({ shape, isSelected, onSelect, onDragStart, onDragEnd }: ShapeProps) {
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

