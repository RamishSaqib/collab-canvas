import type Konva from 'konva';

// Get pointer position relative to the stage/canvas
export function getRelativePointerPosition(stage: Konva.Stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  
  const pos = stage.getPointerPosition();
  if (!pos) return { x: 0, y: 0 };
  
  return transform.point(pos);
}

// Clamp zoom level between min and max
export function clampZoom(zoom: number, min = 0.1, max = 5): number {
  return Math.min(Math.max(zoom, min), max);
}

// Get zoom point (for zooming centered on cursor)
export function getZoomPoint(stage: Konva.Stage) {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    // If no pointer, zoom to center
    return {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };
  }
  return pointer;
}

// Calculate new position after zoom
export function calculateZoomPosition(
  stage: Konva.Stage,
  oldScale: number,
  newScale: number,
  pointer: { x: number; y: number }
) {
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  return {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
}

// Fit stage to window size
export function fitStageToWindow() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

