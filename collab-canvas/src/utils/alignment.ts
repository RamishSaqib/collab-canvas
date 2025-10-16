import type { CanvasObject } from '../lib/types';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

/**
 * Get bounding box for a shape
 * Returns the bounding box in absolute coordinates (left, right, top, bottom)
 * and also returns whether the shape's x,y is centered or top-left
 */
function getShapeBounds(shape: CanvasObject) {
  let width: number;
  let height: number;
  let left: number;
  let top: number;
  let isCentered = false; // Does x,y represent center or top-left?

  if (shape.type === 'circle') {
    const radius = shape.radius || 50;
    width = radius * 2;
    height = radius * 2;
    left = shape.x - radius; // Circle x,y is center
    top = shape.y - radius;
    isCentered = true;
  } else if (shape.type === 'triangle') {
    // Triangle (RegularPolygon) x,y is CENTER in Konva
    // Radius is width/2 (see Triangle.tsx line 84)
    const radius = (shape.width || 100) / 2;
    // For a regular triangle (3-sided polygon), the bounding box is roughly:
    // Width: radius * sqrt(3) ≈ radius * 1.732
    // Height: radius * 1.5
    width = radius * 1.732;
    height = radius * 1.5;
    left = shape.x - width / 2;
    top = shape.y - radius; // Top point is at radius above center
    isCentered = true;
  } else if (shape.type === 'text') {
    // Text x,y is top-left
    const fontSize = shape.fontSize || 24;
    const text = shape.text || 'Text';
    width = text.length * fontSize * 0.6; // Rough estimate
    height = fontSize * 1.2;
    left = shape.x;
    top = shape.y;
    isCentered = false;
  } else {
    // Rectangle x,y is top-left
    width = shape.width || 100;
    height = shape.height || 100;
    left = shape.x;
    top = shape.y;
    isCentered = false;
  }

  // Calculate offsets from shape's x,y to the bounding box edges
  // This is needed for centered shapes where x,y is the center
  const offsetToLeft = shape.x - left;
  const offsetToTop = shape.y - top;

  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    width,
    height,
    isCentered, // Important for calculating new positions!
    offsetToLeft, // Distance from shape.x to left edge
    offsetToTop,  // Distance from shape.y to top edge
  };
}

/**
 * Align shapes to the left (leftmost edge)
 */
export function alignLeft(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 2) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const minLeft = Math.min(...boundsData.map(b => b.bounds.left));

  const updates = new Map<string, Partial<CanvasObject>>();
  boundsData.forEach(({ shape, bounds }) => {
    if (bounds.isCentered) {
      // For centered shapes, x is center, so add offset from left edge to center
      const newX = minLeft + bounds.offsetToLeft;
      updates.set(shape.id, { x: newX });
    } else {
      // For top-left shapes (rectangle, text), set x to left edge
      updates.set(shape.id, { x: minLeft });
    }
  });

  return updates;
}

/**
 * Align shapes to the center (horizontal center)
 */
export function alignCenter(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 2) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  
  // Calculate center of all shapes
  const allLeft = Math.min(...boundsData.map(b => b.bounds.left));
  const allRight = Math.max(...boundsData.map(b => b.bounds.right));
  const groupCenterX = (allLeft + allRight) / 2;

  const updates = new Map<string, Partial<CanvasObject>>();
  boundsData.forEach(({ shape, bounds }) => {
    // All shapes should have their center at groupCenterX
    // For centered shapes, x IS the center
    // For top-left shapes, x is left edge, so center is x + width/2
    if (bounds.isCentered) {
      updates.set(shape.id, { x: groupCenterX });
    } else {
      updates.set(shape.id, { x: groupCenterX - bounds.width / 2 });
    }
  });

  return updates;
}

/**
 * Align shapes to the right (rightmost edge)
 */
export function alignRight(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 2) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const maxRight = Math.max(...boundsData.map(b => b.bounds.right));

  const updates = new Map<string, Partial<CanvasObject>>();
  boundsData.forEach(({ shape, bounds }) => {
    if (bounds.isCentered) {
      // For centered shapes: right edge = shape.x + (width - offsetToLeft)
      // We want: shape.x + (width - offsetToLeft) = maxRight
      // So: shape.x = maxRight - width + offsetToLeft
      const newX = maxRight - bounds.width + bounds.offsetToLeft;
      updates.set(shape.id, { x: newX });
    } else {
      // For top-left shapes, set x so right edge is at maxRight
      const newX = maxRight - bounds.width;
      updates.set(shape.id, { x: newX });
    }
  });

  return updates;
}

/**
 * Align shapes to the top (topmost edge)
 */
export function alignTop(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 2) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const minTop = Math.min(...boundsData.map(b => b.bounds.top));

  const updates = new Map<string, Partial<CanvasObject>>();
  boundsData.forEach(({ shape, bounds }) => {
    if (bounds.isCentered) {
      // For centered shapes, y is center, so add offset from top edge to center
      const newY = minTop + bounds.offsetToTop;
      updates.set(shape.id, { y: newY });
    } else {
      // For top-left shapes, set y to top edge
      updates.set(shape.id, { y: minTop });
    }
  });

  return updates;
}

/**
 * Align shapes to the middle (vertical center)
 */
export function alignMiddle(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 2) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  
  // Calculate center of all shapes
  const allTop = Math.min(...boundsData.map(b => b.bounds.top));
  const allBottom = Math.max(...boundsData.map(b => b.bounds.bottom));
  const groupCenterY = (allTop + allBottom) / 2;

  const updates = new Map<string, Partial<CanvasObject>>();
  boundsData.forEach(({ shape, bounds }) => {
    if (bounds.isCentered) {
      updates.set(shape.id, { y: groupCenterY });
    } else {
      updates.set(shape.id, { y: groupCenterY - bounds.height / 2 });
    }
  });

  return updates;
}

/**
 * Align shapes to the bottom (bottommost edge)
 */
export function alignBottom(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 2) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  const maxBottom = Math.max(...boundsData.map(b => b.bounds.bottom));

  const updates = new Map<string, Partial<CanvasObject>>();
  boundsData.forEach(({ shape, bounds }) => {
    if (bounds.isCentered) {
      // For centered shapes: bottom edge = shape.y + (height - offsetToTop)
      // We want: shape.y + (height - offsetToTop) = maxBottom
      // So: shape.y = maxBottom - height + offsetToTop
      const newY = maxBottom - bounds.height + bounds.offsetToTop;
      updates.set(shape.id, { y: newY });
    } else {
      // For top-left shapes, set y so bottom edge is at maxBottom
      const newY = maxBottom - bounds.height;
      updates.set(shape.id, { y: newY });
    }
  });

  return updates;
}

/**
 * Distribute shapes evenly horizontally
 */
export function distributeHorizontally(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 3) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  
  // Sort by current left position
  boundsData.sort((a, b) => a.bounds.left - b.bounds.left);

  const leftmost = boundsData[0];
  const rightmost = boundsData[boundsData.length - 1];
  
  // Calculate total space available for gaps
  const totalWidth = rightmost.bounds.right - leftmost.bounds.left;
  const shapesWidth = boundsData.reduce((sum, b) => sum + b.bounds.width, 0);
  const totalGap = totalWidth - shapesWidth;
  const gapSize = totalGap / (boundsData.length - 1);

  const updates = new Map<string, Partial<CanvasObject>>();
  
  // Keep first and last in place, distribute middle ones
  let currentLeft = leftmost.bounds.left;
  boundsData.forEach(({ shape, bounds }, index) => {
    if (index === 0) {
      // Keep first shape in place
      currentLeft += bounds.width;
    } else if (index === boundsData.length - 1) {
      // Keep last shape in place
    } else {
      // Distribute middle shapes
      currentLeft += gapSize;
      // Calculate new x based on whether shape is centered or top-left
      let newX: number;
      if (bounds.isCentered) {
        // For centered shapes, add offset from left to center
        newX = currentLeft + bounds.offsetToLeft;
      } else {
        newX = currentLeft;
      }
      updates.set(shape.id, { x: newX });
      currentLeft += bounds.width;
    }
  });

  return updates;
}

/**
 * Distribute shapes evenly vertically
 */
export function distributeVertically(shapes: CanvasObject[]): Map<string, Partial<CanvasObject>> {
  if (shapes.length < 3) return new Map();

  const boundsData = shapes.map(s => ({ shape: s, bounds: getShapeBounds(s) }));
  
  // Sort by current top position
  boundsData.sort((a, b) => a.bounds.top - b.bounds.top);

  const topmost = boundsData[0];
  const bottommost = boundsData[boundsData.length - 1];
  
  // Calculate total space available for gaps
  const totalHeight = bottommost.bounds.bottom - topmost.bounds.top;
  const shapesHeight = boundsData.reduce((sum, b) => sum + b.bounds.height, 0);
  const totalGap = totalHeight - shapesHeight;
  const gapSize = totalGap / (boundsData.length - 1);

  const updates = new Map<string, Partial<CanvasObject>>();
  
  // Keep first and last in place, distribute middle ones
  let currentTop = topmost.bounds.top;
  boundsData.forEach(({ shape, bounds }, index) => {
    if (index === 0) {
      // Keep first shape in place
      currentTop += bounds.height;
    } else if (index === boundsData.length - 1) {
      // Keep last shape in place
    } else {
      // Distribute middle shapes
      currentTop += gapSize;
      // Calculate new y based on whether shape is centered or top-left
      let newY: number;
      if (bounds.isCentered) {
        // For centered shapes, add offset from top to center
        newY = currentTop + bounds.offsetToTop;
      } else {
        newY = currentTop;
      }
      updates.set(shape.id, { y: newY });
      currentTop += bounds.height;
    }
  });

  return updates;
}

