import { useEffect, useRef } from 'react';
import ColorWheel from './ColorWheel';
import './ColorPicker.css';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
  onApply?: () => void;
  showApply?: boolean;
  position?: { x: number; y: number };
}

/**
 * Color picker component with interactive color wheel
 * Supports both pre-creation and post-creation color selection
 */
export default function ColorPicker({ 
  selectedColor, 
  onColorChange, 
  onClose, 
  onApply,
  showApply = false,
  position 
}: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  /**
   * Close picker when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add delay to prevent immediate close when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && showApply && onApply) {
        onApply();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onApply, showApply]);

  const pickerStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {};

  return (
    <div className="color-picker-overlay">
      <div 
        ref={pickerRef}
        className="color-picker" 
        style={pickerStyle}
      >
        <div className="color-picker-header">
          <h3>Choose Color</h3>
          <button 
            className="color-picker-close"
            onClick={onClose}
            aria-label="Close color picker"
          >
            ×
          </button>
        </div>

        <div className="color-picker-content">
          <ColorWheel
            selectedColor={selectedColor}
            onColorSelect={onColorChange}
            size={200}
          />

          <div className="color-picker-preview">
            <div className="preview-label">Selected Color:</div>
            <div 
              className="preview-box"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="preview-hex">{selectedColor.toUpperCase()}</div>
          </div>

          <div className="color-picker-actions">
            {showApply && onApply && (
              <button 
                className="color-picker-button apply"
                onClick={onApply}
              >
                Apply to Selected
              </button>
            )}
            <button 
              className="color-picker-button close"
              onClick={onClose}
            >
              {showApply ? 'Cancel' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

