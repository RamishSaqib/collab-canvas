import { memo, useState } from 'react';
import { Text as KonvaText, Group } from 'react-konva';
import type Konva from 'konva';
import type { CanvasObject } from '../../lib/types';
import type { ActiveShape } from '../../hooks/useRealtimeSync';
import Tooltip from './Tooltip';

interface TextProps {
  shape: CanvasObject;
  isSelected: boolean;
  isActive?: boolean;
  activeBy?: ActiveShape;
  onSelect: (e: any) => void;
  onDragStart: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDoubleClick?: () => void;
  userName?: string; // Name of user who last modified (for tooltip)
  userColor?: string; // Current user's color for selection highlight
  isDraggable?: boolean; // Whether shape can be dragged
  isListening?: boolean; // Whether shape responds to events
  shapeRef?: (node: Konva.Node | null) => void;
}

/**
 * Memoized Text component for optimal rendering performance
 * Supports double-click to trigger editing (handled at Canvas level)
 * Only re-renders when shape data, selection state, or callbacks change
 */
function Text({ shape, isSelected, isActive, activeBy, onSelect, onDragStart, onDragMove, onDragEnd, onDoubleClick, userName, userColor, isDraggable = true, isListening = true, shapeRef }: TextProps) {
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
    onSelect(e);
  };

  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent stage double-click event
    e.cancelBubble = true;
    if (onDoubleClick) {
      onDoubleClick();
    }
  };

  // Determine stroke color and style based on state
  const getStrokeColor = () => {
    if (isActive && activeBy) {
      return activeBy.userColor; // Active editing by another user
    }
    if (isSelected) {
      return userColor || '#667eea'; // Selected by current user (use their color)
    }
    return undefined;
  };

  const getStrokeWidth = () => {
    if (isActive && activeBy) {
      return 3; // Thicker for active editing
    }
    if (isSelected) {
      return 3; // Make selection more prominent
    }
    return 0;
  };

  return (
    <Group>
      <KonvaText
        id={shape.id}
        ref={shapeRef as any}
        name={`shape-${shape.id}`}
        x={shape.x}
        y={shape.y}
        text={shape.text || 'Text'}
        fontSize={shape.fontSize || 24}
        fontFamily="Arial"
        fill={shape.fill}
        fontStyle={shape.fontStyle || 'normal'}
        align={shape.textAlign || 'left'}
        rotation={shape.rotation || 0}
        draggable={isDraggable}
        listening={isListening}
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
        // Dynamic styling based on state
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
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
        y={shape.y - 30}
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
function arePropsEqual(prevProps: TextProps, nextProps: TextProps) {
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.text === nextProps.shape.text &&
    prevProps.shape.fontSize === nextProps.shape.fontSize &&
    prevProps.shape.fill === nextProps.shape.fill &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActive === nextProps.isActive
  );
}

export default memo(Text, arePropsEqual);

