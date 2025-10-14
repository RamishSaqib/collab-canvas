import { Group, Circle, Text, Rect } from 'react-konva';
import type { CursorPosition } from '../../lib/types';

interface CursorProps {
  cursor: CursorPosition;
  stageScale: number;
}

/**
 * Renders another user's cursor position with their name label
 */
export default function Cursor({ cursor, stageScale }: CursorProps) {
  // Scale the cursor size based on zoom level for consistent appearance
  const cursorSize = 12 / stageScale;
  const fontSize = 14 / stageScale;
  const padding = 8 / stageScale;
  const labelOffset = 18 / stageScale;

  // Measure text width (approximate)
  const textWidth = cursor.userName.length * fontSize * 0.6;

  return (
    <Group x={cursor.x} y={cursor.y}>
      {/* Cursor circle with outer ring */}
      <Circle
        radius={cursorSize + 2 / stageScale}
        fill="white"
        opacity={0.8}
      />
      <Circle
        radius={cursorSize}
        fill={cursor.color}
        stroke="white"
        strokeWidth={2 / stageScale}
      />
      
      {/* Name label background */}
      <Rect
        x={labelOffset}
        y={-fontSize / 2 - padding}
        width={textWidth + padding * 2}
        height={fontSize + padding * 2}
        fill={cursor.color}
        cornerRadius={4 / stageScale}
        opacity={0.9}
      />
      
      {/* User name label */}
      <Text
        text={cursor.userName}
        x={labelOffset + padding}
        y={-fontSize / 2}
        fontSize={fontSize}
        fontFamily="Arial, sans-serif"
        fontStyle="bold"
        fill="white"
      />
    </Group>
  );
}

