/**
 * Coordinate conversion utilities for canvas grid system
 * Converts between Konva coordinates (0,0 = top-left) and
 * grid coordinates (0,0 = center)
 */

// Default canvas size (800x600)
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

/**
 * Convert Konva coordinates to grid coordinates
 * @param x - Konva X coordinate (0 = left edge)
 * @param y - Konva Y coordinate (0 = top edge)
 * @returns Grid coordinates where (0,0) is the canvas center
 */
export function konvaToGrid(x: number, y: number): { x: number; y: number } {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  return {
    x: Math.round(x - centerX),
    y: Math.round(centerY - y), // Invert Y axis (positive = up in grid coordinates)
  };
}

/**
 * Convert grid coordinates to Konva coordinates
 * @param x - Grid X coordinate (0 = center)
 * @param y - Grid Y coordinate (0 = center, positive = up)
 * @returns Konva coordinates where (0,0) is top-left
 */
export function gridToKonva(x: number, y: number): { x: number; y: number } {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  return {
    x: x + centerX,
    y: centerY - y, // Invert Y axis
  };
}

/**
 * Get the center point of multiple shapes
 * @param positions - Array of {x, y} positions
 * @returns Center point
 */
export function getCenterPoint(positions: { x: number; y: number }[]): { x: number; y: number } {
  if (positions.length === 0) {
    return { x: 0, y: 0 };
  }

  const sum = positions.reduce(
    (acc, pos) => ({
      x: acc.x + pos.x,
      y: acc.y + pos.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: Math.round(sum.x / positions.length),
    y: Math.round(sum.y / positions.length),
  };
}

