import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Comment } from '../lib/types';

interface UseCommentsProps {
  projectId: string;
  userId: string;
}

export function useComments({ projectId, userId }: UseCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to comments in real-time
  useEffect(() => {
    if (!db) {
      console.error('Firestore not initialized');
      setLoading(false);
      return;
    }

    const commentsRef = collection(db, 'projects', projectId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData: Comment[] = [];
        snapshot.forEach((doc) => {
          commentsData.push({ id: doc.id, ...doc.data() } as Comment);
        });
        setComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  /**
   * Create a new comment
   */
  const createComment = useCallback(
    async (text: string, position: { x: number; y: number }, author: { id: string; name: string; color: string }, shapeId?: string): Promise<string> => {
      if (!db) throw new Error('Firestore not initialized');
      
      const commentsRef = collection(db, 'projects', projectId, 'comments');
      const now = Date.now();

      const commentData: Omit<Comment, 'id'> = {
        text,
        author,
        position,
        ...(shapeId ? { shapeId } : {}), // Only include shapeId if defined
        resolved: false,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(commentsRef, commentData);
      console.log('💬 Created comment:', docRef.id);
      return docRef.id;
    },
    [projectId]
  );

  /**
   * Update an existing comment
   */
  const updateComment = useCallback(
    async (commentId: string, text: string): Promise<void> => {
      if (!db) throw new Error('Firestore not initialized');
      
      const commentRef = doc(db, 'projects', projectId, 'comments', commentId);
      await updateDoc(commentRef, {
        text,
        updatedAt: Date.now(),
      });
      console.log('💬 Updated comment:', commentId);
    },
    [projectId]
  );

  /**
   * Toggle resolved status of a comment
   */
  const toggleResolveComment = useCallback(
    async (commentId: string, resolved: boolean): Promise<void> => {
      if (!db) throw new Error('Firestore not initialized');
      
      const commentRef = doc(db, 'projects', projectId, 'comments', commentId);
      await updateDoc(commentRef, {
        resolved,
        updatedAt: Date.now(),
      });
      console.log(`💬 ${resolved ? 'Resolved' : 'Reopened'} comment:`, commentId);
    },
    [projectId]
  );

  /**
   * Delete a comment (only by author)
   */
  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      if (!db) throw new Error('Firestore not initialized');
      
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      // Only allow deletion by the comment author
      if (comment.author.id !== userId) {
        console.warn('Cannot delete comment created by another user');
        return;
      }

      const commentRef = doc(db, 'projects', projectId, 'comments', commentId);
      await deleteDoc(commentRef);
      console.log('💬 Deleted comment:', commentId);
    },
    [projectId, userId, comments]
  );

  /**
   * Delete all comments attached to a shape (when shape is deleted)
   */
  const deleteShapeComments = useCallback(
    async (shapeId: string): Promise<void> => {
      if (!db) throw new Error('Firestore not initialized');
      
      const firestore = db; // Capture db in closure for TypeScript
      const shapeComments = comments.filter((c) => c.shapeId === shapeId);
      await Promise.all(
        shapeComments.map((comment) => {
          const commentRef = doc(firestore, 'projects', projectId, 'comments', comment.id);
          return deleteDoc(commentRef);
        })
      );
      console.log(`💬 Deleted ${shapeComments.length} comments attached to shape:`, shapeId);
    },
    [projectId, comments]
  );

  return {
    comments,
    loading,
    createComment,
    updateComment,
    toggleResolveComment,
    deleteComment,
    deleteShapeComments,
  };
}

