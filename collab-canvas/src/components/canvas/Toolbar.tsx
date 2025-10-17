import './Toolbar.css';
import type { CanvasMode } from './Canvas';
import { AIInput } from './AIInput';

interface ToolbarProps {
  user: {
    name: string;
    email: string;
    color: string;
  };
  onSignOut: () => void;
  onBackToProjects?: () => void;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  selectedColor: string;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
  onGenerateTestShapes: (count: number) => void;
  onClearAllShapes: () => void;
  shapeCount: number;
  onAICommand?: (command: string) => Promise<{ success: boolean; message: string }>;
  isAIProcessing?: boolean;
  aiError?: string | null;
}

export default function Toolbar({ user, onSignOut, onBackToProjects, mode, onModeChange, selectedColor, showColorPicker, onToggleColorPicker, onGenerateTestShapes, onClearAllShapes, shapeCount, onAICommand, isAIProcessing, aiError }: ToolbarProps) {
  const handleToolClick = (tool: CanvasMode) => {
    onModeChange(tool);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {onBackToProjects && (
          <button 
            className="back-button" 
            onClick={onBackToProjects}
            title="Back to Projects"
          >
            ← Projects
          </button>
        )}
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
            className={`tool-button ${mode === 'hand' ? 'active' : ''}`}
            title="Hand Tool (H)" 
            onClick={() => handleToolClick('hand')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 3c-.55 0-1 .45-1 1v6H7c-.55 0-1 .45-1 1 0 .28.11.53.29.71l4 4c.18.18.43.29.71.29s.53-.11.71-.29l4-4c.18-.18.29-.43.29-.71 0-.55-.45-1-1-1h-1V4c0-.55-.45-1-1-1H9z" />
            </svg>
          </button>
          <div className="toolbar-divider"></div>
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
          <button 
            className={`tool-button ${mode === 'comment' ? 'active' : ''}`}
            title="Comment Tool" 
            onClick={() => handleToolClick('comment')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h12v10H9l-3 3v-3H4V4z" />
            </svg>
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className={`tool-button color-button ${showColorPicker ? 'active' : ''}`}
            title={`Color Picker (P) - ${selectedColor}`} 
            onClick={onToggleColorPicker}
            style={{ backgroundColor: selectedColor }}
          >
          </button>
        </div>
      </div>

      <div className="toolbar-right">
        {/* AI Input */}
        {onAICommand && (
          <>
            <AIInput
              onSubmit={onAICommand}
              isProcessing={isAIProcessing || false}
              lastError={aiError || null}
            />
            <div className="toolbar-divider"></div>
          </>
        )}

        {/* Performance testing buttons */}
        <div className="toolbar-perf-buttons">
          <button 
            className="perf-btn"
            onClick={() => onGenerateTestShapes(100)}
            title="Add 100 test shapes"
          >
            +100
          </button>
          <button 
            className="perf-btn"
            onClick={() => onGenerateTestShapes(500)}
            title="Add 500 test shapes"
          >
            +500
          </button>
          <button 
            className="perf-btn perf-btn-danger"
            onClick={onClearAllShapes}
            title={`Clear all ${shapeCount} shapes`}
          >
            Clear All
          </button>
        </div>
        <div className="toolbar-divider"></div>
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

