import { memo, useState } from 'react';
import { RegularPolygon, Group, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { CanvasObject } from '../../lib/types';
import type { ActiveShape } from '../../hooks/useRealtimeSync';
import Tooltip from './Tooltip';

interface TriangleProps {
  shape: CanvasObject;
  isSelected: boolean;
  isActive?: boolean;
  activeBy?: ActiveShape;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  userName?: string; // Name of user who last modified (for tooltip)
}

/**
 * Memoized Triangle component for optimal rendering performance
 * Only re-renders when shape data, selection state, or callbacks change
 */
function Triangle({ shape, isSelected, isActive, activeBy, onSelect, onDragStart, onDragMove, onDragEnd, userName }: TriangleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

  // Determine stroke color and style based on state
  const getStrokeColor = () => {
    if (isActive && activeBy) {
      return activeBy.userColor; // Active editing by another user
    }
    if (isSelected) {
      return '#667eea'; // Selected by current user
    }
    return undefined;
  };

  const getStrokeWidth = () => {
    if (isActive && activeBy) {
      return 4; // Thicker for active editing
    }
    if (isSelected) {
      return 3;
    }
    return 0;
  };

  // Use width as the radius (default 50 creates ~100x100 triangle)
  const radius = (shape.width || 100) / 2;

  return (
    <Group>
      <RegularPolygon
        name={`shape-${shape.id}`}
        x={shape.x}
        y={shape.y}
        sides={3}
        radius={radius}
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
        // Dynamic styling based on state
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        dash={isActive && activeBy ? [10, 5] : undefined} // Dashed border for active
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
        setIsHovered(true);
      }}
      onMouseMove={(e) => {
        const stage = e.target.getStage();
        if (stage) {
          const pointerPos = stage.getPointerPosition();
          if (pointerPos) {
            setTooltipPos({ x: pointerPos.x, y: pointerPos.y });
          }
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'default';
        }
        setIsHovered(false);
      }}
      />
      
    {/* Active editing label - show user name when being edited by others */}
    {isActive && activeBy && (
      <Group
        x={shape.x}
        y={shape.y - radius - 25}
        listening={false}
      >
        <KonvaText
          text={`✏️ ${activeBy.userName}`}
          fontSize={12}
          fill={activeBy.userColor}
          fontStyle="bold"
          padding={4}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 1 }}
        />
      </Group>
    )}
    
    {/* Tooltip - show last edited by on hover */}
    {userName && (
      <Tooltip
        x={tooltipPos.x}
        y={tooltipPos.y}
        userName={userName}
        timestamp={shape.lastModifiedAt}
        visible={isHovered && !isActive}
      />
    )}
  </Group>
  );
}

/**
 * Custom comparison function for memo
 * Prevents re-renders when shape properties haven't changed
 */
function arePropsEqual(prevProps: TriangleProps, nextProps: TriangleProps) {
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.fill === nextProps.shape.fill &&
    prevProps.shape.rotation === nextProps.shape.rotation &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActive === nextProps.isActive
  );
}

export default memo(Triangle, arePropsEqual);

