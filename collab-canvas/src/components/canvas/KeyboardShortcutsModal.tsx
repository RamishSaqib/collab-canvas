import { useEffect } from 'react';
import './KeyboardShortcutsModal.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Tools
  { keys: ['V'], description: 'Select tool', category: 'Tools' },
  { keys: ['R'], description: 'Rectangle tool', category: 'Tools' },
  { keys: ['C'], description: 'Circle tool', category: 'Tools' },
  { keys: ['T'], description: 'Triangle tool', category: 'Tools' },
  { keys: ['A'], description: 'Text tool', category: 'Tools' },
  { keys: ['P'], description: 'Color picker', category: 'Tools' },
  { keys: ['ESC'], description: 'Deselect & return to select mode', category: 'Tools' },
  
  // Selection
  { keys: ['Click'], description: 'Select shape', category: 'Selection' },
  { keys: ['Shift', 'Click'], description: 'Multi-select (toggle)', category: 'Selection' },
  { keys: ['Drag'], description: 'Draw selection box', category: 'Selection' },
  { keys: ['Ctrl', 'A'], description: 'Select all shapes', category: 'Selection' },
  { keys: ['← →'], description: 'Navigate between selected shapes', category: 'Selection' },
  
  // Shape Actions
  { keys: ['Delete'], description: 'Delete selected shape(s)', category: 'Shape Actions' },
  { keys: ['Backspace'], description: 'Delete selected shape(s)', category: 'Shape Actions' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate selected shape(s)', category: 'Shape Actions' },
  { keys: ['Ctrl', ']'], description: 'Bring to front', category: 'Shape Actions' },
  { keys: ['Ctrl', '['], description: 'Send to back', category: 'Shape Actions' },
  { keys: ['Drag Handles'], description: 'Resize/rotate shape', category: 'Shape Actions' },
  { keys: ['Drag Shape'], description: 'Move shape', category: 'Shape Actions' },
  
  // Text Formatting
  { keys: ['Double-Click Text'], description: 'Edit text content', category: 'Text Formatting' },
  { keys: ['Ctrl', 'B'], description: 'Toggle bold', category: 'Text Formatting' },
  { keys: ['Ctrl', 'I'], description: 'Toggle italic', category: 'Text Formatting' },
  
  // Color
  { keys: ['Enter'], description: 'Apply color to selected shape', category: 'Color' },
  
  // Navigation
  { keys: ['Mouse Wheel'], description: 'Zoom in/out', category: 'Navigation' },
  { keys: ['Drag Empty Space'], description: 'Pan canvas', category: 'Navigation' },
  { keys: ['Ctrl', 'Drag'], description: 'Pan canvas (force)', category: 'Navigation' },
  
  // Help
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on background click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group shortcuts by category
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div className="shortcuts-modal-backdrop" onClick={handleBackdropClick}>
      <div className="shortcuts-modal">
        <div className="shortcuts-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button 
            className="shortcuts-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="shortcuts-modal-content">
          {categories.map(category => (
            <div key={category} className="shortcuts-category">
              <h3 className="shortcuts-category-title">{category}</h3>
              <div className="shortcuts-list">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="shortcut-item">
                      <div className="shortcut-keys">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd key={keyIndex} className="shortcut-key">
                            {key}
                          </kbd>
                        ))}
                      </div>
                      <div className="shortcut-description">
                        {shortcut.description}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-modal-footer">
          <p className="shortcuts-tip">
            💡 Press <kbd>?</kbd> to toggle this menu anytime
          </p>
        </div>
      </div>
    </div>
  );
}

