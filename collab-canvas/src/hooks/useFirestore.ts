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

// Debounce helper
interface PendingUpdate {
  objectId: string;
  updates: Partial<CanvasObject>;
  timeoutId: NodeJS.Timeout;
}

const pendingUpdates = new Map<string, PendingUpdate>();
const DEBOUNCE_MS = 300; // 300ms debounce for updates

/**
 * Firestore persistence hook for canvas objects
 * Manages save, update, delete, and real-time sync operations
 * Includes debouncing for performance optimization
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
   * Execute pending update immediately
   */
  const executePendingUpdate = async (pending: PendingUpdate): Promise<void> => {
    try {
      const objectRef = getObjectDoc(pending.objectId);
      await updateDoc(objectRef, {
        ...pending.updates,
        lastModifiedAt: Date.now()
      });
      console.log('Object updated in Firestore (debounced):', pending.objectId);
    } catch (error) {
      console.error('Error updating object in Firestore:', error);
      throw error;
    }
  };

  /**
   * Update an existing object in Firestore (debounced for performance)
   * Multiple rapid updates to the same object will be batched
   */
  const updateObject = async (objectId: string, updates: Partial<CanvasObject>): Promise<void> => {
    // Cancel any pending update for this object
    const existing = pendingUpdates.get(objectId);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }

    // Merge with existing pending updates
    const mergedUpdates = existing 
      ? { ...existing.updates, ...updates }
      : updates;

    // Schedule the update
    const timeoutId = setTimeout(async () => {
      const pending = pendingUpdates.get(objectId);
      if (pending) {
        pendingUpdates.delete(objectId);
        await executePendingUpdate(pending);
      }
    }, DEBOUNCE_MS);

    // Store the pending update
    pendingUpdates.set(objectId, {
      objectId,
      updates: mergedUpdates,
      timeoutId
    });
  };

  /**
   * Flush a specific pending update immediately (useful for important updates)
   */
  const flushUpdate = async (objectId: string): Promise<void> => {
    const pending = pendingUpdates.get(objectId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingUpdates.delete(objectId);
      await executePendingUpdate(pending);
    }
  };

  /**
   * Flush all pending updates immediately
   */
  const flushAllUpdates = async (): Promise<void> => {
    const updates = Array.from(pendingUpdates.values());
    pendingUpdates.clear();
    
    // Clear all timeouts
    updates.forEach(pending => clearTimeout(pending.timeoutId));
    
    // Execute all updates in parallel
    await Promise.all(updates.map(executePendingUpdate));
  };

  /**
   * Delete an object from Firestore
   */
  const deleteObject = async (objectId: string): Promise<void> => {
    try {
      // Cancel any pending updates for this object
      const pending = pendingUpdates.get(objectId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingUpdates.delete(objectId);
      }

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
    flushUpdate,
    flushAllUpdates,
    canvasId: CANVAS_ID
  };
}
