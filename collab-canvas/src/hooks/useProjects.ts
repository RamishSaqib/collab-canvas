import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Project } from '../lib/types';

interface UseProjectsProps {
  userId: string;
}

export function useProjects({ userId }: UseProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to user's projects
  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    const projectsQuery = query(
      collection(db, 'projects'),
      where('createdBy', '==', userId)
      // Note: orderBy with where requires a composite index
      // For now, we'll sort client-side to avoid index requirements
    );

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const projectsData: Project[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            createdBy: data.createdBy,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
            lastModifiedAt: data.lastModifiedAt instanceof Timestamp ? data.lastModifiedAt.toMillis() : data.lastModifiedAt,
            lastAccessedAt: data.lastAccessedAt instanceof Timestamp ? data.lastAccessedAt.toMillis() : data.lastAccessedAt,
            isFavorite: data.isFavorite || false,
            thumbnailUrl: data.thumbnailUrl,
            collaborators: data.collaborators || [],
            isPublic: data.isPublic || false,
          };
        });
        // Sort client-side by createdAt (newest first)
        projectsData.sort((a, b) => b.createdAt - a.createdAt);
        setProjects(projectsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  /**
   * Create a new project
   */
  const createProject = useCallback(async (name: string): Promise<string | null> => {
    if (!db) {
      setError('Firestore not initialized');
      return null;
    }
    
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: name.trim(),
        createdBy: userId,
        createdAt: serverTimestamp(),
        lastModifiedAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
        isFavorite: false,
        collaborators: [
          {
            userId,
            role: 'owner',
            addedAt: Date.now(),
          }
        ],
        isPublic: false,
      });
      
      console.log('✅ Project created:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('❌ Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    }
  }, [userId]);

  /**
   * Delete a project (and all its data)
   */
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!db) {
      setError('Firestore not initialized');
      return false;
    }
    
    try {
      // Note: This only deletes the project document
      // In a production app, you'd want a Cloud Function to cascade delete
      // shapes, comments, etc. For now, we'll keep it simple.
      await deleteDoc(doc(db, 'projects', projectId));
      console.log('✅ Project deleted:', projectId);
      return true;
    } catch (err) {
      console.error('❌ Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      return false;
    }
  }, []);

  /**
   * Update a project (for saving thumbnail, renaming, favoriting, etc.)
   */
  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<Omit<Project, 'id' | 'createdBy' | 'createdAt'>>
  ): Promise<boolean> => {
    if (!db) {
      setError('Firestore not initialized');
      return false;
    }
    
    try {
      // Filter out undefined values and convert null to deleteField()
      const filteredUpdates: any = {
        lastModifiedAt: Date.now(),
      };
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          // Use deleteField() for null values to remove the field from Firestore
          filteredUpdates[key] = value === null ? deleteField() : value;
        }
      });
      
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, filteredUpdates);
      console.log('✅ Project updated:', projectId);
      return true;
    } catch (err) {
      console.error('❌ Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      return false;
    }
  }, []);

  /**
   * Toggle favorite status of a project
   */
  const toggleFavorite = useCallback(async (projectId: string, currentValue: boolean): Promise<boolean> => {
    if (!db) {
      setError('Firestore not initialized');
      return false;
    }
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        isFavorite: !currentValue,
        lastModifiedAt: Date.now(),
      });
      console.log('✅ Project favorite toggled:', projectId);
      return true;
    } catch (err) {
      console.error('❌ Error toggling favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
      return false;
    }
  }, []);

  /**
   * Duplicate a project (creates a copy with all shapes)
   */
  const duplicateProject = useCallback(async (projectId: string): Promise<string | null> => {
    if (!db) {
      setError('Firestore not initialized');
      return null;
    }
    
    try {
      // Get the original project
      const originalProject = projects.find(p => p.id === projectId);
      if (!originalProject) {
        throw new Error('Project not found');
      }

      // Create new project with "(Copy)" suffix
      const newProjectData: any = {
        name: `${originalProject.name} (Copy)`,
        createdBy: userId,
        createdAt: serverTimestamp(),
        lastModifiedAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
        isFavorite: false,
      };
      
      // Only include thumbnailUrl if it exists (Firestore doesn't allow undefined)
      if (originalProject.thumbnailUrl) {
        newProjectData.thumbnailUrl = originalProject.thumbnailUrl;
      }
      
      const newProjectRef = await addDoc(collection(db, 'projects'), newProjectData);

      // Get all shapes from the original project
      const shapesQuery = query(collection(db, 'projects', projectId, 'shapes'));
      const shapesSnapshot = await getDocs(shapesQuery);

      // Copy all shapes to the new project
      if (!shapesSnapshot.empty) {
        const batch = writeBatch(db!);
        shapesSnapshot.docs.forEach((shapeDoc) => {
          const shapeData = shapeDoc.data();
          const newShapeRef = doc(collection(db!, 'projects', newProjectRef.id, 'shapes'));
          batch.set(newShapeRef, {
            ...shapeData,
            createdAt: Date.now(),
            lastModifiedAt: Date.now(),
          });
        });
        await batch.commit();
        console.log(`✅ Duplicated ${shapesSnapshot.docs.length} shapes`);
      }

      console.log('✅ Project duplicated:', newProjectRef.id);
      return newProjectRef.id;
    } catch (err) {
      console.error('❌ Error duplicating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate project');
      return null;
    }
  }, [userId, projects]);

  /**
   * Add a collaborator to a project
   * Note: For MVP, we use email as userId. In production, you'd lookup Firebase user by email.
   */
  const addCollaborator = useCallback(async (
    projectId: string,
    email: string,
    role: 'editor' | 'viewer'
  ): Promise<boolean> => {
    if (!db) {
      setError('Firestore not initialized');
      return false;
    }
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check if collaborator already exists
      if (project.collaborators.some(c => c.userId === email)) {
        throw new Error('User is already a collaborator');
      }

      const newCollaborator = {
        userId: email, // MVP: using email as userId
        role,
        addedAt: Date.now(),
        addedBy: userId,
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        collaborators: [...project.collaborators, newCollaborator],
        lastModifiedAt: Date.now(),
      });
      
      console.log('✅ Collaborator added:', email);
      return true;
    } catch (err) {
      console.error('❌ Error adding collaborator:', err);
      setError(err instanceof Error ? err.message : 'Failed to add collaborator');
      throw err;
    }
  }, [userId, projects]);

  /**
   * Remove a collaborator from a project
   */
  const removeCollaborator = useCallback(async (
    projectId: string,
    collaboratorUserId: string
  ): Promise<boolean> => {
    if (!db) {
      setError('Firestore not initialized');
      return false;
    }
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const updatedCollaborators = project.collaborators.filter(
        c => c.userId !== collaboratorUserId
      );

      if (updatedCollaborators.length === project.collaborators.length) {
        throw new Error('Collaborator not found');
      }

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        collaborators: updatedCollaborators,
        lastModifiedAt: Date.now(),
      });
      
      console.log('✅ Collaborator removed:', collaboratorUserId);
      return true;
    } catch (err) {
      console.error('❌ Error removing collaborator:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
      return false;
    }
  }, [projects]);

  /**
   * Update a collaborator's role
   */
  const updateCollaboratorRole = useCallback(async (
    projectId: string,
    collaboratorUserId: string,
    newRole: 'editor' | 'viewer'
  ): Promise<boolean> => {
    if (!db) {
      setError('Firestore not initialized');
      return false;
    }
    
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const updatedCollaborators = project.collaborators.map(c =>
        c.userId === collaboratorUserId ? { ...c, role: newRole } : c
      );

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        collaborators: updatedCollaborators,
        lastModifiedAt: Date.now(),
      });
      
      console.log('✅ Collaborator role updated:', collaboratorUserId, newRole);
      return true;
    } catch (err) {
      console.error('❌ Error updating collaborator role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
      return false;
    }
  }, [projects]);

  return {
    projects,
    loading,
    error,
    createProject,
    deleteProject,
    updateProject,
    toggleFavorite,
    duplicateProject,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
  };
}

