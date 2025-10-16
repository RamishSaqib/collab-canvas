import { memo } from 'react';
import { Circle, Group, Text as KonvaText } from 'react-konva';
import type { Comment } from '../../lib/types';

interface CommentPinProps {
  comment: Comment;
  onClick: () => void;
  isSelected: boolean;
}

function CommentPin({ comment, onClick, isSelected }: CommentPinProps) {
  const pinRadius = 12;
  const color = comment.resolved ? '#94a3b8' : comment.author.color;

  return (
    <Group
      x={comment.position.x}
      y={comment.position.y}
      onClick={onClick}
      onTap={onClick}
    >
      {/* Pin circle */}
      <Circle
        radius={pinRadius}
        fill={color}
        stroke={isSelected ? '#ffffff' : color}
        strokeWidth={isSelected ? 3 : 0}
        opacity={comment.resolved ? 0.6 : 1}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={6}
        shadowOffset={{ x: 0, y: 2 }}
        listening={true}
        perfectDrawEnabled={false}
      />

      {/* Comment icon (speech bubble) */}
      <KonvaText
        text="💬"
        fontSize={14}
        offsetX={7}
        offsetY={7}
        listening={false}
      />

      {/* Hover effect */}
      <Circle
        radius={pinRadius + 4}
        fill="transparent"
        listening={true}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'pointer';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />
    </Group>
  );
}

export default memo(CommentPin);

