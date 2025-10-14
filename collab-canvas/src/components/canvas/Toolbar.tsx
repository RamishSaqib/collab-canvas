import './Toolbar.css';

interface ToolbarProps {
  user: {
    name: string;
    email: string;
    color: string;
  };
  onSignOut: () => void;
}

export default function Toolbar({ user, onSignOut }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="toolbar-title">CollabCanvas</h1>
        <div className="toolbar-divider"></div>
        <div className="toolbar-tools">
          <button className="tool-button" title="Select Tool (V)" disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3l14 7-6 2-2 6-6-15z" />
            </svg>
          </button>
          <button className="tool-button" title="Rectangle Tool (R)" disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="12" height="12" />
            </svg>
          </button>
          <span className="tool-hint">Shape tools coming in PR #4</span>
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

