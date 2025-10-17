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
      // Get the stage's bounding box to capture all shapes
      const shapes = stage.find('.shape'); // Assuming shapes have class 'shape'
      if (shapes.length === 0) {
        console.log('No shapes to capture for thumbnail');
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

      // Capture the stage as data URL (JPEG, medium quality)
      const dataURL = stage.toDataURL({
        x: minX,
        y: minY,
        width: width,
        height: height,
        pixelRatio: scale,
        mimeType: 'image/jpeg',
        quality: 0.7, // Medium quality (0-1)
      });

      console.log('✅ Thumbnail generated (base64)');
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

