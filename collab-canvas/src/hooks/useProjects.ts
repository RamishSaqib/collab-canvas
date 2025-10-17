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
  serverTimestamp,
  Timestamp
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
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        lastModifiedAt: Date.now(),
      });
      console.log('✅ Project updated:', projectId);
      return true;
    } catch (err) {
      console.error('❌ Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      return false;
    }
  }, []);

  return {
    projects,
    loading,
    error,
    createProject,
    deleteProject,
    updateProject,
  };
}

