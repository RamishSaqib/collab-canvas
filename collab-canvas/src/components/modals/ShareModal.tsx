import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [draftIsPublic, setDraftIsPublic] = useState(project.isPublic);
  const [draftCollaborators, setDraftCollaborators] = useState(project.collaborators);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Reset drafts when project or open state changes
  useEffect(() => {
    if (isOpen) {
      setDraftIsPublic(project.isPublic);
      setDraftCollaborators(project.collaborators);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/canvas/${project.id}`;
  
  const isOwner = project.collaborators.find(c => c.userId === currentUserId)?.role === 'owner';

  const hasChanges = useMemo(() => {
    if (draftIsPublic !== project.isPublic) return true;
    const orig = project.collaborators.map(c => ({ userId: c.userId, role: c.role, email: c.email || '' }))
      .sort((a, b) => a.userId.localeCompare(b.userId));
    const draft = draftCollaborators.map(c => ({ userId: c.userId, role: c.role, email: c.email || '' }))
      .sort((a, b) => a.userId.localeCompare(b.userId));
    return JSON.stringify(orig) !== JSON.stringify(draft);
  }, [draftIsPublic, draftCollaborators, project.isPublic, project.collaborators]);

  const tryClose = useCallback(async () => {
    if (!hasChanges) {
      onClose();
      return;
    }
    const wantsSave = window.confirm('You have unsaved changes. Save before closing?');
    if (wantsSave) {
      await handleSave();
    } else {
      onClose();
    }
  }, [hasChanges]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTogglePublic = () => {
    setDraftIsPublic(prev => !prev);
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const newCollab = { userId: email.trim(), email: email.trim(), role, addedAt: Date.now() } as any;
      // Prevent duplicates
      if (!draftCollaborators.some(c => c.userId === newCollab.userId)) {
        setDraftCollaborators(prev => [...prev, newCollab]);
      }
      setEmail('');
      setRole('editor');
    } catch (err) {
      console.error('Failed to add collaborator (draft):', err);
      setError('Failed to add collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = (userId: string) => {
    if (!window.confirm('Remove this collaborator?')) return;
    setDraftCollaborators(prev => prev.filter(c => c.userId !== userId));
  };

  const handleChangeRole = (userId: string, newRole: 'editor' | 'viewer') => {
    setDraftCollaborators(prev => prev.map(c => c.userId === userId ? { ...c, role: newRole } : c));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Update project visibility
      if (draftIsPublic !== project.isPublic) {
        await onUpdateProject(project.id, { isPublic: draftIsPublic });
      }

      // Diff collaborators
      const origMap = new Map(project.collaborators.map(c => [c.userId, c.role] as const));
      const draftMap = new Map(draftCollaborators.map(c => [c.userId, c.role] as const));

      // Additions
      for (const [userId, role] of draftMap) {
        if (!origMap.has(userId)) {
          const addRole = role === 'owner' ? 'editor' : role;
          await onAddCollaborator(project.id, userId, addRole);
        }
      }
      // Removals
      for (const [userId] of origMap) {
        if (!draftMap.has(userId)) {
          await onRemoveCollaborator(project.id, userId);
        }
      }
      // Role changes
      for (const [userId, newRole] of draftMap) {
        const oldRole = origMap.get(userId);
        if (oldRole && oldRole !== newRole) {
          const updateRole = newRole === 'owner' ? 'editor' : newRole;
          await onUpdateCollaboratorRole(project.id, userId, updateRole);
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to save sharing settings:', err);
      setError('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={tryClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share "{project.name}"</h2>
          <button className="modal-close" onClick={tryClose}>×</button>
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
                  checked={draftIsPublic}
                  onChange={handleTogglePublic}
                  className="toggle-checkbox"
                />
                <span className="toggle-switch"></span>
                <span className="toggle-text">
                  {draftIsPublic ? '🌐 Public' : '🔒 Private'}
                </span>
              </label>
              <p className="share-hint">
                {draftIsPublic
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
              Collaborators ({draftCollaborators.length})
            </label>
            <div className="collaborators-list">
              {draftCollaborators.map((collaborator) => (
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
          <button onClick={tryClose} className="btn-secondary">
            Close
          </button>
          {isOwner && (
            <button onClick={handleSave} className="btn-primary-save" disabled={!hasChanges || isLoading}>
              {isLoading ? 'Saving...' : hasChanges ? 'Save changes' : 'Saved'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

