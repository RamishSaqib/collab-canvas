import { memo } from 'react';
import { Group, Rect, Text } from 'react-konva';

interface TooltipProps {
  x: number;
  y: number;
  userName: string;
  timestamp: number;
  visible: boolean;
}

/**
 * Tooltip component to show "Last edited by" information on hover
 * Displays user name and time ago
 */
function Tooltip({ x, y, userName, timestamp, visible }: TooltipProps) {
  if (!visible) return null;

  // Calculate time ago
  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return '1 day ago';
    return `${diffDay} days ago`;
  };

  const text = `Last edited by ${userName} ${getTimeAgo(timestamp)}`;
  const padding = 8;
  const fontSize = 12;
  
  // Estimate text width (approximate)
  const textWidth = text.length * 7;
  const tooltipWidth = textWidth + padding * 2;
  const tooltipHeight = fontSize + padding * 2;

  // Position tooltip above and slightly to the right of cursor
  const tooltipX = x + 15;
  const tooltipY = y - tooltipHeight - 10;

  return (
    <Group x={tooltipX} y={tooltipY} listening={false}>
      {/* Background */}
      <Rect
        width={tooltipWidth}
        height={tooltipHeight}
        fill="rgba(0, 0, 0, 0.85)"
        cornerRadius={6}
        shadowColor="rgba(0,0,0,0.4)"
        shadowBlur={8}
        shadowOffset={{ x: 0, y: 2 }}
      />
      
      {/* Text */}
      <Text
        text={text}
        x={padding}
        y={padding}
        fontSize={fontSize}
        fontFamily="Arial"
        fill="#ffffff"
      />
    </Group>
  );
}

export default memo(Tooltip);

