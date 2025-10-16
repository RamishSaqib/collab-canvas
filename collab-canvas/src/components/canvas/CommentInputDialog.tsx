import { useState, useRef, useEffect } from 'react';
import './CommentInputDialog.css';

interface CommentInputDialogProps {
  position: { x: number; y: number };
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export default function CommentInputDialog({ position, onSubmit, onCancel }: CommentInputDialogProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="comment-dialog-backdrop" onClick={onCancel} />

      {/* Dialog */}
      <div
        className="comment-input-dialog"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... (Ctrl+Enter to submit)"
            className="comment-input-textarea"
            rows={3}
          />
          <div className="comment-input-actions">
            <button
              type="button"
              className="comment-input-btn comment-input-btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="comment-input-btn comment-input-btn-submit"
              disabled={!text.trim()}
            >
              Comment
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

