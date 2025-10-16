import { useState, useRef, useEffect } from 'react';
import type { Comment } from '../../lib/types';
import './CommentPanel.css';

interface CommentPanelProps {
  comment: Comment;
  onClose: () => void;
  onResolve: () => void;
  onDelete: () => void;
  onUpdate: (text: string) => void;
  canDelete: boolean; // Only author can delete
}

export default function CommentPanel({
  comment,
  onClose,
  onResolve,
  onDelete,
  onUpdate,
  canDelete,
}: CommentPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim() && editText !== comment.text) {
      onUpdate(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="comment-panel">
      <div className="comment-panel-header">
        <h3>Comment</h3>
        <button
          className="comment-panel-close"
          onClick={onClose}
          aria-label="Close comment panel"
        >
          ✕
        </button>
      </div>

      <div className="comment-panel-content">
        <div className="comment-item">
          <div className="comment-author">
            <div
              className="comment-author-avatar"
              style={{ backgroundColor: comment.author.color }}
            >
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
            <div className="comment-author-info">
              <span className="comment-author-name">{comment.author.name}</span>
              <span className="comment-timestamp">
                {formatTimestamp(comment.createdAt)}
                {comment.updatedAt !== comment.createdAt && ' (edited)'}
              </span>
            </div>
          </div>

          {isEditing ? (
            <div className="comment-edit">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="comment-textarea"
                rows={3}
                placeholder="Edit your comment..."
              />
              <div className="comment-edit-actions">
                <button className="comment-btn comment-btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  className="comment-btn comment-btn-primary"
                  onClick={handleSave}
                  disabled={!editText.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="comment-text">{comment.text}</div>
              {canDelete && (
                <div className="comment-actions">
                  <button
                    className="comment-action-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                  <button className="comment-action-btn comment-delete" onClick={onDelete}>
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="comment-panel-footer">
        <button
          className={`comment-resolve-btn ${comment.resolved ? 'resolved' : ''}`}
          onClick={onResolve}
        >
          {comment.resolved ? '🔄 Reopen' : '✓ Resolve'}
        </button>
      </div>
    </div>
  );
}

