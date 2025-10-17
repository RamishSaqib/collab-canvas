import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../lib/firebase';
import { useProjects } from '../hooks/useProjects';
import type { User } from '../lib/types';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import './ProjectsPage.css';

interface ProjectsPageProps {
  user: User;
}

export default function ProjectsPage({ user }: ProjectsPageProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { projects, loading, createProject, deleteProject } = useProjects({ userId: user.id });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleCreate = async (name: string) => {
    const projectId = await createProject(name);
    if (projectId) {
      // Navigate to the new project
      navigate(`/canvas/${projectId}`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
  };

  return (
    <div className="projects-page">
      {/* Header */}
      <header className="projects-header">
        <div className="header-left">
          <h1>CollabCanvas</h1>
        </div>
        
        <div className="header-center">
          <input
            type="text"
            placeholder="Search projects..."
            className="search-input"
          />
        </div>
        
        <div className="header-right">
          <button className="btn-primary" onClick={handleCreateProject}>
            + New Project
          </button>
          
          <div className="user-menu">
            <div 
              className="user-avatar" 
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button className="btn-secondary" onClick={handleSignOut}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Filters and Controls */}
      <div className="projects-controls">
        <div className="filter-tabs">
          <button className="filter-tab active">All</button>
          <button className="filter-tab">⭐ Favorites</button>
          <button className="filter-tab">🕒 Recent</button>
        </div>
        
        <div className="view-controls">
          <select className="sort-select">
            <option value="lastAccessed">Last Accessed</option>
            <option value="created">Created Date</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className={`projects-container ${viewMode}`}>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No projects yet</h2>
            <p>Create your first project to get started</p>
            <button className="btn-primary" onClick={handleCreateProject}>
              + Create Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
            />
          ))
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

