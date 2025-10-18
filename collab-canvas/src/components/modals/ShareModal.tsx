import { useState, useEffect } from 'react';
import type { Project } from '../../lib/types';
import './ShareModal.css';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUserId: string;
  onUpdateProject: (projectId: string, updates: any) => Promise<boolean>;
  onAddCollaborator: (projectId: string, email: string, role: 'editor' | 'viewer') => Promise<boolean>;
  onRemoveCollaborator: (projectId: string, userId: string) => Promise<boolean>;
  onUpdateCollaboratorRole: (projectId: string, userId: string, role: 'editor' | 'viewer') => Promise<boolean>;
}

export default function ShareModal({
  isOpen,
  onClose,
  project,
  currentUserId,
  onUpdateProject,
  onAddCollaborator,
  onRemoveCollaborator,
  onUpdateCollaboratorRole,
}: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/canvas/${project.id}`;
  
  const isOwner = project.collaborators.find(c => c.userId === currentUserId)?.role === 'owner';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTogglePublic = async () => {
    try {
      await onUpdateProject(project.id, { isPublic: !project.isPublic });
    } catch (err) {
      console.error('Failed to toggle public:', err);
      setError('Failed to update project visibility');
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onAddCollaborator(project.id, email.trim(), role);
      setEmail('');
      setRole('editor');
    } catch (err) {
      console.error('Failed to add collaborator:', err);
      setError(err instanceof Error ? err.message : 'Failed to add collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!window.confirm('Remove this collaborator?')) return;

    try {
      await onRemoveCollaborator(project.id, userId);
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
      setError('Failed to remove collaborator');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    try {
      await onUpdateCollaboratorRole(project.id, userId, newRole);
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update role');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share "{project.name}"</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Share Link */}
          <div className="share-section">
            <label className="share-label">Share Link</label>
            <div className="share-link-container">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="share-link-input"
              />
              <button onClick={handleCopyLink} className="btn-copy">
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Public/Private Toggle */}
          {isOwner && (
            <div className="share-section">
              <label className="share-label toggle-label">
                <input
                  type="checkbox"
                  checked={project.isPublic}
                  onChange={handleTogglePublic}
                  className="toggle-checkbox"
                />
                <span className="toggle-switch"></span>
                <span className="toggle-text">
                  {project.isPublic ? '🌐 Public' : '🔒 Private'}
                </span>
              </label>
              <p className="share-hint">
                {project.isPublic
                  ? 'Anyone with the link can view this project'
                  : 'Only invited collaborators can access'}
              </p>
            </div>
          )}

          {/* Add Collaborator Form */}
          {isOwner && (
            <div className="share-section">
              <label className="share-label">Add Collaborator</label>
              <form onSubmit={handleAddCollaborator} className="add-collaborator-form">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                  disabled={isLoading}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="role-select"
                  disabled={isLoading}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="submit" className="btn-add" disabled={isLoading || !email.trim()}>
                  {isLoading ? 'Adding...' : 'Add'}
                </button>
              </form>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          {/* Collaborators List */}
          <div className="share-section">
            <label className="share-label">
              Collaborators ({project.collaborators.length})
            </label>
            <div className="collaborators-list">
              {project.collaborators.map((collaborator) => (
                <div key={collaborator.userId} className="collaborator-item">
                  <div className="collaborator-info">
                    <span className="collaborator-email">
                      {collaborator.userId === currentUserId ? 'You' : (collaborator.email || collaborator.userId)}
                    </span>
                    <span className={`collaborator-role ${collaborator.role}`}>
                      {collaborator.role}
                    </span>
                  </div>
                  {isOwner && collaborator.role !== 'owner' && (
                    <div className="collaborator-actions">
                      <select
                        value={collaborator.role}
                        onChange={(e) => handleChangeRole(collaborator.userId, e.target.value as 'editor' | 'viewer')}
                        className="role-select-small"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveCollaborator(collaborator.userId)}
                        className="btn-remove"
                        title="Remove collaborator"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

