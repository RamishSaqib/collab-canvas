import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../lib/types';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, currentValue: boolean) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onShare: (id: string) => void;
}

export default function ProjectCard({ project, onDelete, onToggleFavorite, onDuplicate, onRename, onShare }: ProjectCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleOpen = () => {
    navigate(`/canvas/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${project.name}"? This action cannot be undone.`)) {
      onDelete(project.id);
    }
    setShowMenu(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(project.id, project.isFavorite);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(project.id);
    setShowMenu(false);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('Enter new project name:', project.name);
    if (newName && newName.trim() && newName !== project.name) {
      onRename(project.id, newName.trim());
    }
    setShowMenu(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(project.id);
    setShowMenu(false);
  };

  const formatDate = (timestamp: number) => {
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="project-card" onClick={handleOpen}>
      {/* Thumbnail placeholder */}
      <div className="project-thumbnail">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt={project.name} className="thumbnail-image" />
        ) : (
          <div className="thumbnail-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
        )}
        {/* Favorite button */}
        <button
          className={`favorite-button ${project.isFavorite ? 'favorited' : ''}`}
          onClick={handleToggleFavorite}
          title={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {project.isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Project info */}
      <div className="project-info">
        <div className="project-header">
          <h3 className="project-name" title={project.name}>
            {project.name}
          </h3>
          <button
            className="project-menu-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            title="More options"
          >
            ⋮
          </button>
          {showMenu && (
            <div ref={menuRef} className="project-menu" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleShare} className="menu-item">
                🔗 Share
              </button>
              <button onClick={handleRename} className="menu-item">
                ✏️ Rename
              </button>
              <button onClick={handleDuplicate} className="menu-item">
                📋 Duplicate
              </button>
              <button onClick={handleDelete} className="menu-item danger">
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
        <p className="project-date">
          Modified {formatDate(project.lastModifiedAt)}
        </p>
      </div>
    </div>
  );
}

