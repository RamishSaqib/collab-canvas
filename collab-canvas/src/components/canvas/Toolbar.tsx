import './Toolbar.css';
import type { CanvasMode } from './Canvas';

interface ToolbarProps {
  user: {
    name: string;
    email: string;
    color: string;
  };
  onSignOut: () => void;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  selectedColor: string;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
}

export default function Toolbar({ user, onSignOut, mode, onModeChange, selectedColor, showColorPicker, onToggleColorPicker }: ToolbarProps) {
  const handleToolClick = (tool: CanvasMode) => {
    onModeChange(tool);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="toolbar-title">CollabCanvas</h1>
        <div className="toolbar-divider"></div>
        <div className="toolbar-tools">
          <button 
            className={`tool-button ${mode === 'select' ? 'active' : ''}`}
            title="Select Tool (V)" 
            onClick={() => handleToolClick('select')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3l14 7-6 2-2 6-6-15z" />
            </svg>
          </button>
          <button 
            className={`tool-button ${mode === 'rectangle' ? 'active' : ''}`}
            title="Rectangle Tool (R)" 
            onClick={() => handleToolClick('rectangle')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="12" height="12" />
            </svg>
          </button>
          <button 
            className={`tool-button ${mode === 'circle' ? 'active' : ''}`}
            title="Circle Tool (C)" 
            onClick={() => handleToolClick('circle')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="6" />
            </svg>
          </button>
          <button 
            className={`tool-button ${mode === 'triangle' ? 'active' : ''}`}
            title="Triangle Tool (T)" 
            onClick={() => handleToolClick('triangle')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4 L16 16 L4 16 Z" />
            </svg>
          </button>
          <button 
            className={`tool-button ${mode === 'text' ? 'active' : ''}`}
            title="Text Tool (A)" 
            onClick={() => handleToolClick('text')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 4h8v2h-3v10h-2V6H6V4z" />
            </svg>
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className={`tool-button color-button ${showColorPicker ? 'active' : ''}`}
            title="Color Picker (P)" 
            onClick={onToggleColorPicker}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7" />
              <path d="M10 6 L10 10 L13 10" strokeLinecap="round" />
            </svg>
            <div 
              className="color-swatch"
              style={{ backgroundColor: selectedColor }}
              title={selectedColor}
            />
          </button>
        </div>
      </div>

      <div className="toolbar-right">
        <div className="user-badge">
          <span className="user-avatar-small" style={{ backgroundColor: user.color }}>
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="user-name-small">{user.name}</span>
        </div>
        <button onClick={onSignOut} className="toolbar-signout">
          Sign Out
        </button>
      </div>
    </div>
  );
}

