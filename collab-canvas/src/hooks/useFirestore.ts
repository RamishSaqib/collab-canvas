import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CanvasObject } from '../lib/types';

const CANVAS_ID = 'main-canvas'; // Single shared canvas for MVP

/**
 * Firestore persistence hook for canvas objects
 * Manages save, update, delete, and real-time sync operations
 */
export function useFirestore() {
  
  /**
   * Get reference to objects collection for the main canvas
   */
  const getObjectsCollection = () => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    return collection(db, 'canvases', CANVAS_ID, 'objects');
  };

  /**
   * Get reference to a specific object document
   */
  const getObjectDoc = (objectId: string) => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    return doc(db, 'canvases', CANVAS_ID, 'objects', objectId);
  };

  /**
   * Save a new object to Firestore
   */
  const saveObject = async (object: CanvasObject): Promise<void> => {
    try {
      const objectRef = getObjectDoc(object.id);
      await setDoc(objectRef, object);
      console.log('Object saved to Firestore:', object.id);
    } catch (error) {
      console.error('Error saving object to Firestore:', error);
      throw error;
    }
  };

  /**
   * Update an existing object in Firestore
   */
  const updateObject = async (objectId: string, updates: Partial<CanvasObject>): Promise<void> => {
    try {
      const objectRef = getObjectDoc(objectId);
      await updateDoc(objectRef, {
        ...updates,
        lastModifiedAt: Date.now()
      });
      console.log('Object updated in Firestore:', objectId);
    } catch (error) {
      console.error('Error updating object in Firestore:', error);
      throw error;
    }
  };

  /**
   * Delete an object from Firestore
   */
  const deleteObject = async (objectId: string): Promise<void> => {
    try {
      const objectRef = getObjectDoc(objectId);
      await deleteDoc(objectRef);
      console.log('Object deleted from Firestore:', objectId);
    } catch (error) {
      console.error('Error deleting object from Firestore:', error);
      throw error;
    }
  };

  /**
   * Subscribe to real-time updates for all objects in the canvas
   * Returns unsubscribe function
   */
  const subscribeToObjects = (
    onObjectsChange: (objects: CanvasObject[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe => {
    const objectsQuery = query(getObjectsCollection());

    const unsubscribe = onSnapshot(
      objectsQuery,
      (snapshot) => {
        const objects: CanvasObject[] = [];
        snapshot.forEach((doc) => {
          objects.push(doc.data() as CanvasObject);
        });
        console.log('Firestore objects updated, count:', objects.length);
        onObjectsChange(objects);
      },
      (error) => {
        console.error('Error in Firestore subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );

    return unsubscribe;
  };

  return {
    saveObject,
    updateObject,
    deleteObject,
    subscribeToObjects,
    canvasId: CANVAS_ID
  };
}

