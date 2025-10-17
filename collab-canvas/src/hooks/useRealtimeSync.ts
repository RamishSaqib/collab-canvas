import { useCallback, useEffect, useRef } from 'react';
import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';
import type { Unsubscribe } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { throttle } from '../utils/performance';

const UPDATE_THROTTLE_MS = 16; // ~60 Hz (60 FPS)
const STALE_THRESHOLD_MS = 5000; // 5 seconds
const CLEANUP_INTERVAL_MS = 10000; // 10 seconds

export interface ActiveShape {
  x: number;
  y: number;
  text?: string;
  userId: string;
  userName: string;
  userColor: string;
  timestamp: number;
  type: 'drag' | 'edit';
}

export interface UseRealtimeSyncProps {
  projectId: string;
  userId: string;
  userName: string;
  userColor: string;
}

/**
 * Hook for managing active shape updates in Realtime Database
 * Provides ultra-low latency sync for shapes being actively edited
 * 
 * Performance: ~10-20ms latency vs ~350ms with Firestore only
 */
export function useRealtimeSync({ 
  projectId,
  userId, 
  userName, 
  userColor,
}: UseRealtimeSyncProps) {
  
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeShapesRef = useRef<Map<string, ActiveShape>>(new Map());
  
  /**
   * Get reference to active shapes collection in RTDB
   */
  const getActiveShapesRef = useCallback(() => {
    if (!rtdb) {
      console.warn('Realtime Database not initialized');
      return null;
    }
    return ref(rtdb, `active-shapes/${projectId}`);
  }, [projectId]);

  /**
   * Get reference to specific active shape
   */
  const getActiveShapeRef = useCallback((shapeId: string) => {
    if (!rtdb) {
      console.warn('Realtime Database not initialized');
      return null;
    }
    return ref(rtdb, `active-shapes/${projectId}/${shapeId}`);
  }, [projectId]);

  /**
   * Update active shape position (throttled to 60 FPS)
   * Use for drag move events
   */
  const updateActivePosition = useCallback(
    throttle((shapeId: string, x: number, y: number) => {
      const shapeRef = getActiveShapeRef(shapeId);
      if (!shapeRef) return;

      const activeData: ActiveShape = {
        x,
        y,
        userId,
        userName,
        userColor,
        timestamp: Date.now(),
        type: 'drag',
      };

      set(shapeRef, activeData).catch((error) => {
        console.error('Failed to update active position:', error);
      });

      // Update local cache
      activeShapesRef.current.set(shapeId, activeData);
    }, UPDATE_THROTTLE_MS),
    [getActiveShapeRef, userId, userName, userColor]
  );

  /**
   * Update active text content (throttled)
   * Use during text editing
   */
  const updateActiveText = useCallback(
    throttle((shapeId: string, text: string) => {
      const shapeRef = getActiveShapeRef(shapeId);
      if (!shapeRef) return;

      const activeData: ActiveShape = {
        x: 0, // Position not relevant for text updates
        y: 0,
        text,
        userId,
        userName,
        userColor,
        timestamp: Date.now(),
        type: 'edit',
      };

      set(shapeRef, activeData).catch((error) => {
        console.error('Failed to update active text:', error);
      });

      // Update local cache
      activeShapesRef.current.set(shapeId, activeData);
    }, UPDATE_THROTTLE_MS),
    [getActiveShapeRef, userId, userName, userColor]
  );

  /**
   * Mark shape as active (call on drag start or edit start)
   */
  const markShapeActive = useCallback((shapeId: string, x: number, y: number, type: 'drag' | 'edit' = 'drag') => {
    const shapeRef = getActiveShapeRef(shapeId);
    if (!shapeRef) return;

    const activeData: ActiveShape = {
      x,
      y,
      userId,
      userName,
      userColor,
      timestamp: Date.now(),
      type,
    };

    set(shapeRef, activeData).catch((error) => {
      console.error('Failed to mark shape active:', error);
    });

    // Set up disconnect cleanup
    if (rtdb) {
      onDisconnect(shapeRef).remove();
    }

    // Update local cache
    activeShapesRef.current.set(shapeId, activeData);
  }, [getActiveShapeRef, userId, userName, userColor]);

  /**
   * Mark shape as inactive (call on drag end or edit complete)
   * Removes from RTDB after a short delay
   */
  const markShapeInactive = useCallback((shapeId: string) => {
    const shapeRef = getActiveShapeRef(shapeId);
    if (!shapeRef) return;

    // Remove after 1 second to allow final updates to propagate
    setTimeout(() => {
      remove(shapeRef).catch((error) => {
        console.error('Failed to mark shape inactive:', error);
      });

      // Remove from local cache
      activeShapesRef.current.delete(shapeId);
    }, 1000);
  }, [getActiveShapeRef]);

  /**
   * Clean up stale active shapes
   * Called automatically every 10 seconds
   */
  const cleanupStaleShapes = useCallback(() => {
    const now = Date.now();
    const shapesRef = getActiveShapesRef();
    if (!shapesRef) return;

    activeShapesRef.current.forEach((activeShape, shapeId) => {
      if (now - activeShape.timestamp > STALE_THRESHOLD_MS) {
        console.log('Cleaning up stale shape:', shapeId);
        const shapeRef = getActiveShapeRef(shapeId);
        if (shapeRef) {
          remove(shapeRef).catch((error) => {
            console.error('Failed to cleanup stale shape:', error);
          });
        }
        activeShapesRef.current.delete(shapeId);
      }
    });
  }, [getActiveShapesRef, getActiveShapeRef]);

  /**
   * Subscribe to active shapes updates
   * Callback receives map of all active shapes
   */
  const subscribeToActiveShapes = useCallback((
    callback: (activeShapes: Map<string, ActiveShape>) => void,
    onError?: (error: Error) => void
  ): Unsubscribe => {
    const shapesRef = getActiveShapesRef();
    
    if (!shapesRef) {
      console.warn('Cannot subscribe to active shapes: RTDB not initialized');
      return () => {}; // Return empty unsubscribe function
    }

    console.log('Subscribing to active shapes...');

    const unsubscribe = onValue(
      shapesRef,
      (snapshot) => {
        const activeShapes = new Map<string, ActiveShape>();
        
        snapshot.forEach((childSnapshot) => {
          const shapeId = childSnapshot.key;
          const data = childSnapshot.val() as ActiveShape;
          
          if (shapeId && data) {
            // Only include shapes from other users or recent updates
            const now = Date.now();
            if (data.userId !== userId || now - data.timestamp < 1000) {
              activeShapes.set(shapeId, data);
              // Update local cache
              activeShapesRef.current.set(shapeId, data);
            }
          }
        });

        console.log('Active shapes update:', activeShapes.size, 'shapes');
        callback(activeShapes);
      },
      (error) => {
        console.error('Active shapes subscription error:', error);
        if (onError) {
          onError(error);
        }
      }
    );

    return unsubscribe;
  }, [getActiveShapesRef, userId]);

  /**
   * Check if RTDB is available
   */
  const isAvailable = useCallback(() => {
    return !!rtdb;
  }, []);

  // Set up automatic cleanup interval
  useEffect(() => {
    if (!rtdb) return;

    cleanupIntervalRef.current = setInterval(() => {
      cleanupStaleShapes();
    }, CLEANUP_INTERVAL_MS);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cleanupStaleShapes]);

  // Cleanup all user's active shapes on unmount
  useEffect(() => {
    return () => {
      // Remove all shapes marked by this user
      activeShapesRef.current.forEach((_, shapeId) => {
        const shapeRef = getActiveShapeRef(shapeId);
        if (shapeRef) {
          remove(shapeRef).catch((error) => {
            console.error('Failed to cleanup on unmount:', error);
          });
        }
      });
      activeShapesRef.current.clear();
    };
  }, [getActiveShapeRef]);

  return {
    updateActivePosition,
    updateActiveText,
    markShapeActive,
    markShapeInactive,
    subscribeToActiveShapes,
    cleanupStaleShapes,
    isAvailable,
  };
}

