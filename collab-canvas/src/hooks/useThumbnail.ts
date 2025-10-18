import { useCallback } from 'react';
import type Konva from 'konva';

interface UseThumbnailReturn {
  generateThumbnail: (stage: Konva.Stage) => Promise<string | null>;
}

/**
 * Hook for generating project thumbnails as base64 data URLs
 * Captures canvas screenshot and returns compressed base64 string
 */
export function useThumbnail(): UseThumbnailReturn {
  /**
   * Generate a thumbnail from the canvas stage as base64
   * @param stage - Konva stage to capture
   * @returns Base64 data URL of the thumbnail, or null if failed
   */
  const generateThumbnail = useCallback(async (
    stage: Konva.Stage
  ): Promise<string | null> => {
    try {
      // Get all layers from the stage
      const layers = stage.getLayers();
      
      if (layers.length === 0) {
        return null;
      }
      
      const layer = layers[0]; // Get the first layer
      const allChildren = layer.getChildren();
      
      // Filter out non-shape elements (Transformer, selection boxes, etc.)
      // Keep everything except Transformer nodes
      const shapes = allChildren.filter((node) => {
        const className = node.className;
        // Exclude Transformer and other non-shape nodes
        return className !== 'Transformer';
      });
      
      if (shapes.length === 0) {
        return null;
      }

      // Calculate bounds of all shapes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      shapes.forEach((shape) => {
        const box = shape.getClientRect();
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      });

      // Add padding
      const padding = 20;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const width = maxX - minX;
      const height = maxY - minY;

      // If canvas is empty or too small, return null
      if (width <= 0 || height <= 0) {
        console.log('Invalid canvas bounds for thumbnail');
        return null;
      }

      // Calculate scale to fit in 400x300 thumbnail
      const targetWidth = 400;
      const targetHeight = 300;
      const scale = Math.min(targetWidth / width, targetHeight / height);

      // Create a temporary canvas to add white background
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return null;
      }

      // Set canvas size (scaled)
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);

      // Get stage image data
      const stageDataURL = stage.toDataURL({
        x: minX,
        y: minY,
        width: width,
        height: height,
        pixelRatio: scale,
        mimeType: 'image/png',
      });

      // Draw stage image on top of white background
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = reject;
        img.src = stageDataURL;
      });

      // Convert to JPEG with white background
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);

      return dataURL;
    } catch (error) {
      console.error('❌ Error generating thumbnail:', error);
      return null;
    }
  }, []);

  return {
    generateThumbnail,
  };
}

