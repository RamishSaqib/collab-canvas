import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../lib/firebase';
import { useProjects } from '../hooks/useProjects';
import type { User, Project } from '../lib/types';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import ShareModal from '../components/modals/ShareModal';
import { migrateProjectsToAddCollaboratorIds } from '../utils/migrateProjects';
import './ProjectsPage.css';

interface ProjectsPageProps {
  user: User;
}

type FilterType = 'all' | 'favorites' | 'recent' | 'shared';
type SortType = 'lastAccessed' | 'created' | 'alphabetical';

export default function ProjectsPage({ user }: ProjectsPageProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('lastAccessed');
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    projects, 
    loading, 
    createProject, 
    deleteProject, 
    updateProject, 
    toggleFavorite, 
    duplicateProject,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole 
  } = useProjects({ userId: user.id, userEmail: user.email });

  // Expose utilities to console for easy access
  useEffect(() => {
    // Migration utility
    (window as any).__migrateProjects = async () => {
      try {
        console.log('🔄 Starting migration...');
        const result = await migrateProjectsToAddCollaboratorIds();
        console.log('✨ Migration result:', result);
        return result;
      } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
      }
    };
    
    // Helper to make a project public and fix its data
    (window as any).__makeProjectPublic = async (projectId: string) => {
      if (!projectId) {
        console.error('❌ Please provide a project ID');
        console.log('Usage: await window.__makeProjectPublic("YOUR_PROJECT_ID")');
        return;
      }
      
      try {
        console.log('🔄 Fetching project:', projectId);
        const projectToUpdate = projects.find(p => p.id === projectId);
        
        if (!projectToUpdate) {
          console.error('❌ Project not found in your projects list');
          return;
        }
        
        console.log('📊 Current project data:', projectToUpdate);
        
        // Update with all required fields
        await updateProject(projectId, {
          isPublic: true,
          collaborators: projectToUpdate.collaborators?.length > 0 
            ? projectToUpdate.collaborators 
            : [{
                userId: projectToUpdate.createdBy,
                role: 'owner' as const,
                addedAt: Date.now()
              }]
        });
        
        console.log('✅ Project is now PUBLIC! Anyone with the link can access it.');
        console.log('🔗 Share this URL:', `${window.location.origin}/canvas/${projectId}`);
        return true;
      } catch (error) {
        console.error('❌ Failed to make project public:', error);
        throw error;
      }
    };
    
      console.log('💡 Utilities loaded!');
      console.log('  - Run migration: await window.__migrateProjects()');
      console.log('  - Make project public: await window.__makeProjectPublic("PROJECT_ID")');
      console.log('📍 You are on the projects page');
      console.log(' ');
      console.log('🔍 HYBRID SAVE SYSTEM:');
      console.log('  ✅ Creates & Deletes = AUTO-SAVED (instant for all users)');
      console.log('  💾 Edits (position, size, color) = MANUAL SAVE REQUIRED');
      console.log('  📌 Click "Save Project" to persist edits to Firestore');
    
    return () => {
      delete (window as any).__migrateProjects;
      delete (window as any).__makeProjectPublic;
    };
  }, [projects, updateProject]);

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

  const handleShareProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowShareModal(true);
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSelectedProject(null);
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
    } else if (filter === 'shared') {
      // Shared with me = not owned by current user
      result = result.filter(p => p.createdBy !== user.id);
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
    <div className="projects-page page-transition">
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
          <button 
            className={`filter-tab ${filter === 'shared' ? 'active' : ''}`}
            onClick={() => setFilter('shared')}
          >
            👥 Shared with me
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
              {filter === 'favorites' ? '⭐' : filter === 'recent' ? '🕒' : filter === 'shared' ? '👥' : '🔍'}
            </div>
            <h2>
              {searchQuery ? 'No matching projects' : 
               filter === 'favorites' ? 'No favorite projects' :
               filter === 'recent' ? 'No recent projects' :
               filter === 'shared' ? 'No shared projects' : 'No projects found'}
            </h2>
            <p>
              {searchQuery ? `No projects match "${searchQuery}"` :
               filter === 'favorites' ? 'Star projects to see them here' :
               filter === 'recent' ? 'Projects accessed in the last 7 days will appear here' : 
               filter === 'shared' ? 'Projects shared with you will appear here' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project, index) => (
            <div key={project.id} className={`stagger-item ${index < 10 ? '' : 'animate-fade-in'}`}>
              <ProjectCard
                project={project}
                onDelete={handleDeleteProject}
                onToggleFavorite={handleToggleFavorite}
                onDuplicate={handleDuplicateProject}
                onRename={handleRenameProject}
                onShare={handleShareProject}
              />
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />

      {/* Share Project Modal */}
      {selectedProject && (
        <ShareModal
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          project={projects.find(p => p.id === selectedProject.id) || selectedProject}
          currentUserId={user.id}
          onUpdateProject={updateProject}
          onAddCollaborator={addCollaborator}
          onRemoveCollaborator={removeCollaborator}
          onUpdateCollaboratorRole={updateCollaboratorRole}
        />
      )}
    </div>
  );
}

