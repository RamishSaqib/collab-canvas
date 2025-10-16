import { useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  writeBatch
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CanvasObject } from '../lib/types';
import { useOperationQueue, type QueuedOperation } from './useOperationQueue';
import { useConnectionStatus } from './useConnectionStatus';

const CANVAS_ID = 'main-canvas'; // Single shared canvas for MVP

// Debounce helper
interface PendingUpdate {
  objectId: string;
  updates: Partial<CanvasObject>;
  timeoutId: ReturnType<typeof setTimeout>;
}

const pendingUpdates = new Map<string, PendingUpdate>();

// Reduced debounce for better perceived performance
// Note: In hybrid sync architecture (PR #12), active shape updates
// go through Realtime Database with no debounce (~20ms latency)
// This Firestore debounce only applies to final state persistence
const DEBOUNCE_MS = 100; // Reduced from 300ms → 100ms for immediate improvement

/**
 * Firestore persistence hook for canvas objects
 * Manages save, update, delete, and real-time sync operations
 * Includes debouncing for performance optimization
 * 
 * Performance: 100ms debounce provides good balance between
 * responsiveness and write operation costs
 */
export function useFirestore() {
  const { isOnline } = useConnectionStatus();
  const { queueOperation, processQueue } = useOperationQueue();
  
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
   * Execute a queued operation
   */
  const executeQueuedOperation = async (op: QueuedOperation): Promise<void> => {
    switch (op.type) {
      case 'create':
        const objectRef = getObjectDoc(op.objectId);
        await setDoc(objectRef, op.payload as CanvasObject);
        break;
      case 'update':
        const updateRef = getObjectDoc(op.objectId);
        await updateDoc(updateRef, { ...op.payload, lastModifiedAt: Date.now() });
        break;
      case 'delete':
        const deleteRef = getObjectDoc(op.objectId);
        await deleteDoc(deleteRef);
        break;
    }
  };

  /**
   * Save a new object to Firestore
   * Queues operation if offline
   */
  const saveObject = async (object: CanvasObject): Promise<void> => {
    // Temporarily disabled offline check - always try to save
    // TODO: Re-enable after fixing connection detection
    // if (!isOnline) {
    //   queueOperation('create', object.id, object);
    //   console.log('📦 Queued create operation (offline):', object.id);
    //   return;
    // }

    try {
      const objectRef = getObjectDoc(object.id);
      await setDoc(objectRef, object);
      console.log('✅ Object saved to Firestore:', object.id);
    } catch (error) {
      console.error('❌ Error saving object to Firestore:', error);
      // Queue on failure
      queueOperation('create', object.id, object);
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
   * Queues operation if offline
   */
  const deleteObject = async (objectId: string): Promise<void> => {
    // Cancel any pending updates for this object
    const pending = pendingUpdates.get(objectId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingUpdates.delete(objectId);
    }

    // Temporarily disabled offline check - always try to delete
    // TODO: Re-enable after fixing connection detection
    // if (!isOnline) {
    //   queueOperation('delete', objectId, {});
    //   console.log('📦 Queued delete operation (offline):', objectId);
    //   return;
    // }

    try {
      const objectRef = getObjectDoc(objectId);
      await deleteDoc(objectRef);
      console.log('✅ Object deleted from Firestore:', objectId);
    } catch (error) {
      console.error('❌ Error deleting object from Firestore:', error);
      // Queue on failure
      queueOperation('delete', objectId, {});
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

  /**
   * Batch save multiple objects at once
   * More efficient for bulk operations like test data generation
   */
  const batchSaveObjects = async (objects: CanvasObject[]) => {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const batch = writeBatch(db);
    const objectsCol = getObjectsCollection();

    objects.forEach(obj => {
      const docRef = doc(objectsCol, obj.id);
      batch.set(docRef, obj);
    });

    await batch.commit();
    console.log(`✅ Batch saved ${objects.length} objects`);
  };

  /**
   * Batch delete multiple objects at once
   * More efficient for bulk delete operations
   */
  const batchDeleteObjects = async (objectIds: string[]) => {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Firestore batches can only handle 500 operations at a time
    const BATCH_SIZE = 500;
    const batches = [];

    for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
      const batchIds = objectIds.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      const objectsCol = getObjectsCollection();

      batchIds.forEach(id => {
        const docRef = doc(objectsCol, id);
        batch.delete(docRef);
      });

      batches.push(batch.commit());
    }

    await Promise.all(batches);
    console.log(`✅ Batch deleted ${objectIds.length} objects`);
  };

  // Process queued operations when connection is restored
  useEffect(() => {
    if (isOnline) {
      console.log('🌐 Connection restored, processing queued operations...');
      processQueue(executeQueuedOperation).catch(error => {
        console.error('Failed to process operation queue:', error);
      });
    }
  }, [isOnline, processQueue]);

  return {
    saveObject,
    updateObject,
    deleteObject,
    batchSaveObjects,
    batchDeleteObjects,
    subscribeToObjects,
    flushUpdate,
    flushAllUpdates,
    canvasId: CANVAS_ID
  };
}
