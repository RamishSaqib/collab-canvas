import { useState, useMemo } from 'react';
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

type FilterType = 'all' | 'favorites' | 'recent';
type SortType = 'lastAccessed' | 'created' | 'alphabetical';

export default function ProjectsPage({ user }: ProjectsPageProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('lastAccessed');
  const [searchQuery, setSearchQuery] = useState('');
  const { projects, loading, createProject, deleteProject, updateProject, toggleFavorite, duplicateProject } = useProjects({ userId: user.id });

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

  const handleToggleFavorite = async (projectId: string, currentValue: boolean) => {
    await toggleFavorite(projectId, currentValue);
  };

  const handleDuplicateProject = async (projectId: string) => {
    const newProjectId = await duplicateProject(projectId);
    if (newProjectId) {
      console.log('✅ Project duplicated successfully');
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    await updateProject(projectId, { name: newName });
  };

  // Filter, sort, and search projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply filter
    if (filter === 'favorites') {
      result = result.filter(p => p.isFavorite);
    } else if (filter === 'recent') {
      // Recent = accessed within last 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      result = result.filter(p => p.lastAccessedAt >= sevenDaysAgo);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    // Apply sort
    if (sortBy === 'lastAccessed') {
      result.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
    } else if (sortBy === 'created') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [projects, filter, sortBy, searchQuery]);

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilter('favorites')}
          >
            ⭐ Favorites
          </button>
          <button 
            className={`filter-tab ${filter === 'recent' ? 'active' : ''}`}
            onClick={() => setFilter('recent')}
          >
            🕒 Recent
          </button>
        </div>
        
        <div className="view-controls">
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
          >
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
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {filter === 'favorites' ? '⭐' : filter === 'recent' ? '🕒' : '🔍'}
            </div>
            <h2>
              {searchQuery ? 'No matching projects' : 
               filter === 'favorites' ? 'No favorite projects' :
               filter === 'recent' ? 'No recent projects' : 'No projects found'}
            </h2>
            <p>
              {searchQuery ? `No projects match "${searchQuery}"` :
               filter === 'favorites' ? 'Star projects to see them here' :
               filter === 'recent' ? 'Projects accessed in the last 7 days will appear here' : 
               'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              onToggleFavorite={handleToggleFavorite}
              onDuplicate={handleDuplicateProject}
              onRename={handleRenameProject}
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

