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
}

export default function Toolbar({ user, onSignOut, mode, onModeChange }: ToolbarProps) {
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

