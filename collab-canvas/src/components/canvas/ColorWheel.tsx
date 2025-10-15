import { useEffect, useRef, useState, useCallback } from 'react';
import './ColorWheel.css';

interface ColorWheelProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  size?: number;
}

/**
 * Interactive color wheel component for intuitive color selection
 * Uses HSL color space for smooth gradient transitions
 */
export default function ColorWheel({ selectedColor, onColorSelect, size = 200 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Convert HSL to Hex color
   */
  const hslToHex = useCallback((h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }, []);

  /**
   * Draw the color wheel on canvas
   */
  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw color wheel (hue circle)
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 90) * Math.PI / 180;
      const endAngle = (angle + 1 - 90) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, hslToHex(angle, 100, 50));
      gradient.addColorStop(1, hslToHex(angle, 100, 50));

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw saturation/lightness gradient in center
    const innerRadius = radius * 0.6;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [size, hslToHex]);

  /**
   * Initialize canvas when component mounts
   */
  useEffect(() => {
    drawColorWheel();
  }, [drawColorWheel]);

  /**
   * Get color at specific position on the wheel
   */
  const getColorAtPosition = useCallback((x: number, y: number): string => {
    const canvas = canvasRef.current;
    if (!canvas) return selectedColor;

    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const centerX = size / 2;
    const centerY = size / 2;

    // Calculate angle (hue)
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;

    // Calculate saturation and lightness based on distance from center
    const radius = size / 2 - 10;
    const saturation = Math.min(100, (distance / radius) * 100);
    const lightness = Math.max(20, 100 - (distance / radius) * 30); // Keep it visible

    return hslToHex(angle, saturation, lightness);
  }, [size, selectedColor, hslToHex]);

  /**
   * Handle mouse/touch down
   */
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const color = getColorAtPosition(clientX, clientY);
    onColorSelect(color);
  }, [getColorAtPosition, onColorSelect]);

  /**
   * Handle mouse/touch move
   */
  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const color = getColorAtPosition(clientX, clientY);
    onColorSelect(color);
  }, [isDragging, getColorAtPosition, onColorSelect]);

  /**
   * Handle mouse/touch up
   */
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const color = getColorAtPosition(clientX, clientY);
        onColorSelect(color);
      };

      const handleGlobalUp = () => {
        setIsDragging(false);
      };

      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalMove);
      window.addEventListener('touchend', handleGlobalUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalUp);
        window.removeEventListener('touchmove', handleGlobalMove);
        window.removeEventListener('touchend', handleGlobalUp);
      };
    }
  }, [isDragging, getColorAtPosition, onColorSelect]);

  return (
    <div className="color-wheel-container">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="color-wheel-canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />
      <div 
        className="color-wheel-indicator"
        style={{ backgroundColor: selectedColor }}
        title={selectedColor}
      />
    </div>
  );
}

