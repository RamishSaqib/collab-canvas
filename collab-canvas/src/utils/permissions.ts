import type { Project, CollaboratorRole } from '../lib/types';

/**
 * Check if a user has a specific role or higher in a project
 */
export function hasRole(project: Project, userId: string, minRole: CollaboratorRole): boolean {
  const collaborator = project.collaborators.find(c => c.userId === userId);
  if (!collaborator) {
    // Check if project is public and minimum role is viewer
    return project.isPublic && minRole === 'viewer';
  }

  const roleHierarchy: Record<CollaboratorRole, number> = {
    owner: 3,
    editor: 2,
    viewer: 1,
  };

  return roleHierarchy[collaborator.role] >= roleHierarchy[minRole];
}

/**
 * Check if a user can edit a project (owner or editor)
 */
export function canEdit(project: Project, userId: string): boolean {
  return hasRole(project, userId, 'editor');
}

/**
 * Check if a user can view a project (owner, editor, viewer, or public)
 */
export function canView(project: Project, userId: string): boolean {
  return hasRole(project, userId, 'viewer') || project.isPublic;
}

/**
 * Check if a user is the owner of a project
 */
export function isOwner(project: Project, userId: string): boolean {
  return project.createdBy === userId || hasRole(project, userId, 'owner');
}

/**
 * Get the user's role in a project
 */
export function getUserRole(project: Project, userId: string): CollaboratorRole | null {
  const collaborator = project.collaborators.find(c => c.userId === userId);
  return collaborator?.role || null;
}

/**
 * Check if a user can delete a project (only owner)
 */
export function canDelete(project: Project, userId: string): boolean {
  return isOwner(project, userId);
}

/**
 * Check if a user can share/manage collaborators (only owner)
 */
export function canManageCollaborators(project: Project, userId: string): boolean {
  return isOwner(project, userId);
}

/**
 * Check if a user can update project settings (only owner)
 */
export function canUpdateSettings(project: Project, userId: string): boolean {
  return isOwner(project, userId);
}

