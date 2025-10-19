import { memo, useState } from 'react';
import { Rect, Group, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { CanvasObject } from '../../lib/types';
import type { ActiveShape } from '../../hooks/useRealtimeSync';
import Circle from './Circle';
import Triangle from './Triangle';
import Text from './Text';
import Tooltip from './Tooltip';

export interface ShapeProps {
  shape: CanvasObject;
  isSelected: boolean;
  isActive?: boolean;
  activeBy?: ActiveShape;
  onSelect: (e: any) => void;
  onDragStart: () => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTextChange?: (newText: string) => void;
  onTextDoubleClick?: () => void;
  userName?: string; // Name of user who last modified (for tooltip)
  userColor?: string; // Current user's color for selection highlight
  isDraggable?: boolean; // Whether shape can be dragged (false in hand mode)
  isListening?: boolean; // Whether shape responds to events (false in hand mode)
  shapeRef?: (node: Konva.Node | null) => void; // Ref callback for Transformer
}

/**
 * Memoized Shape component for optimal rendering performance
 * Only re-renders when shape data, selection state, or callbacks change
 * Renders different components based on shape type
 * 
 * isActive indicates the shape is being edited by someone in real-time
 * activeBy contains info about who is editing (userId, userName, userColor)
 */
function Shape({ shape, isSelected, isActive, activeBy, onSelect, onDragStart, onDragMove, onDragEnd, onTextDoubleClick, userName, userColor, isDraggable = true, isListening = true, shapeRef }: ShapeProps) {
  // Render different components based on shape type
  if (shape.type === 'circle') {
    return (
      <Circle
        shape={shape}
        isSelected={isSelected}
        isActive={isActive}
        activeBy={activeBy}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        userName={userName}
        userColor={userColor}
        isDraggable={isDraggable}
        isListening={isListening}
        shapeRef={shapeRef}
      />
    );
  }

  if (shape.type === 'triangle') {
    return (
      <Triangle
        shape={shape}
        isSelected={isSelected}
        isActive={isActive}
        activeBy={activeBy}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        userName={userName}
        userColor={userColor}
        isDraggable={isDraggable}
        isListening={isListening}
        shapeRef={shapeRef}
      />
    );
  }

  if (shape.type === 'text') {
    return (
      <Text
        shape={shape}
        isSelected={isSelected}
        isActive={isActive}
        activeBy={activeBy}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDoubleClick={onTextDoubleClick}
        userName={userName}
        userColor={userColor}
        isDraggable={isDraggable}
        isListening={isListening}
        shapeRef={shapeRef}
      />
    );
  }

  // Default to rectangle
  if (shape.type !== 'rectangle') return null;

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
      return 4; // Thicker for active editing
    }
    if (isSelected) {
      return 4; // Make selection more prominent
    }
    return 0;
  };

  const width = shape.width || 150;
  const height = shape.height || 100;

  return (
    <Group>
      <Rect
        id={shape.id}
        name={`shape-${shape.id}`}
        ref={shapeRef as any}
        x={shape.x}
        y={shape.y}
        width={width}
        height={height}
        fill={shape.fill}
        rotation={shape.rotation || 0}
        draggable={isDraggable}
        listening={isListening}
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
            container.style.cursor = isDraggable ? 'move' : 'default';
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
          y={shape.y - 25}
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

