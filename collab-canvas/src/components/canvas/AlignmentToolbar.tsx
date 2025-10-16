import { memo } from 'react';
import './AlignmentToolbar.css';

interface AlignmentToolbarProps {
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
  onDistributeHorizontally: () => void;
  onDistributeVertically: () => void;
  canDistribute: boolean; // Need 3+ shapes to distribute
}

function AlignmentToolbar({
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  onDistributeHorizontally,
  onDistributeVertically,
  canDistribute,
}: AlignmentToolbarProps) {
  return (
    <div className="alignment-toolbar">
      <div className="alignment-section">
        <span className="alignment-label">Align:</span>
        <button
          onClick={onAlignLeft}
          className="alignment-btn"
          title="Align Left"
          aria-label="Align Left"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="2" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="5" y="4" width="8" height="3" fill="currentColor" />
            <rect x="5" y="9" width="10" height="3" fill="currentColor" />
            <rect x="5" y="14" width="6" height="3" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={onAlignCenter}
          className="alignment-btn"
          title="Align Center"
          aria-label="Align Center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="6" y="4" width="8" height="3" fill="currentColor" />
            <rect x="5" y="9" width="10" height="3" fill="currentColor" />
            <rect x="7" y="14" width="6" height="3" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={onAlignRight}
          className="alignment-btn"
          title="Align Right"
          aria-label="Align Right"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="18" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="7" y="4" width="8" height="3" fill="currentColor" />
            <rect x="5" y="9" width="10" height="3" fill="currentColor" />
            <rect x="9" y="14" width="6" height="3" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="alignment-divider" />

      <div className="alignment-section">
        <button
          onClick={onAlignTop}
          className="alignment-btn"
          title="Align Top"
          aria-label="Align Top"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="2" y1="2" x2="18" y2="2" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="5" width="3" height="8" fill="currentColor" />
            <rect x="9" y="5" width="3" height="10" fill="currentColor" />
            <rect x="14" y="5" width="3" height="6" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={onAlignMiddle}
          className="alignment-btn"
          title="Align Middle"
          aria-label="Align Middle"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="6" width="3" height="8" fill="currentColor" />
            <rect x="9" y="5" width="3" height="10" fill="currentColor" />
            <rect x="14" y="7" width="3" height="6" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={onAlignBottom}
          className="alignment-btn"
          title="Align Bottom"
          aria-label="Align Bottom"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="7" width="3" height="8" fill="currentColor" />
            <rect x="9" y="5" width="3" height="10" fill="currentColor" />
            <rect x="14" y="9" width="3" height="6" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="alignment-divider" />

      <div className="alignment-section">
        <span className="alignment-label">Distribute:</span>
        <button
          onClick={onDistributeHorizontally}
          className="alignment-btn"
          title="Distribute Horizontally (3+ shapes)"
          aria-label="Distribute Horizontally"
          disabled={!canDistribute}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="7" width="3" height="6" fill="currentColor" />
            <rect x="8.5" y="7" width="3" height="6" fill="currentColor" />
            <rect x="15" y="7" width="3" height="6" fill="currentColor" />
            <line x1="5.5" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" />
            <line x1="12" y1="10" x2="14.5" y2="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" />
          </svg>
        </button>
        <button
          onClick={onDistributeVertically}
          className="alignment-btn"
          title="Distribute Vertically (3+ shapes)"
          aria-label="Distribute Vertically"
          disabled={!canDistribute}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="7" y="2" width="6" height="3" fill="currentColor" />
            <rect x="7" y="8.5" width="6" height="3" fill="currentColor" />
            <rect x="7" y="15" width="6" height="3" fill="currentColor" />
            <line x1="10" y1="5.5" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" />
            <line x1="10" y1="12" x2="10" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(AlignmentToolbar);

