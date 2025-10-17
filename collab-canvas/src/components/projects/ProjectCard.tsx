import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../lib/types';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleOpen = () => {
    navigate(`/canvas/${project.id}`);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${project.name}"? This action cannot be undone.`)) {
      onDelete(project.id);
    }
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
        <div className="thumbnail-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
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
            <div className="project-menu" onClick={(e) => e.stopPropagation()}>
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

