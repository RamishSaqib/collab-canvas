import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, off } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import type { CursorPosition } from '../lib/types';

const THROTTLE_MS = 33; // ~30 updates/second

interface UseCursorsProps {
  projectId: string;
  userId: string;
  userName: string;
  userColor: string;
}

/**
 * Hook for tracking and broadcasting cursor positions
 * Uses Firebase Realtime Database for fast cursor updates
 */
export function useCursors({ projectId, userId, userName, userColor }: UseCursorsProps) {
  const [otherCursors, setOtherCursors] = useState<CursorPosition[]>([]);
  const lastBroadcastTimeRef = useRef<number>(0);
  const disconnectHandlerSetRef = useRef(false);

  /**
   * Broadcast current cursor position to Firebase
   * Throttled to avoid excessive writes
   */
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!rtdb) {
      console.warn('Realtime Database not initialized');
      return;
    }

    const now = Date.now();
    if (now - lastBroadcastTimeRef.current < THROTTLE_MS) {
      return; // Throttle: skip this update
    }

    lastBroadcastTimeRef.current = now;

    const cursorRef = ref(rtdb, `cursors/${projectId}/${userId}`);
    const cursorData: CursorPosition = {
      userId,
      userName,
      x,
      y,
      color: userColor,
      timestamp: now,
    };

    set(cursorRef, cursorData).catch((error) => {
      console.error('Failed to broadcast cursor position:', error);
    });

    // Set up disconnect handler (only once)
    if (!disconnectHandlerSetRef.current && rtdb) {
      onDisconnect(cursorRef).remove().catch((error) => {
        console.error('Failed to set disconnect handler:', error);
      });
      disconnectHandlerSetRef.current = true;
    }
  }, [userId, userName, userColor]);

  /**
   * Subscribe to other users' cursor positions
   */
  useEffect(() => {
    if (!rtdb) {
      console.warn('Realtime Database not initialized, cursors disabled');
      return;
    }

    console.log('Setting up cursor subscription...');

    const cursorsRef = ref(rtdb, `cursors/${projectId}`);

    const handleCursorsUpdate = (snapshot: any) => {
      const cursors: CursorPosition[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        Object.keys(data).forEach((cursorUserId) => {
          // Don't show own cursor
          if (cursorUserId !== userId) {
            cursors.push(data[cursorUserId] as CursorPosition);
          }
        });
      }

      console.log('Cursors updated, count:', cursors.length);
      setOtherCursors(cursors);
    };

    // Subscribe to cursor updates
    onValue(cursorsRef, handleCursorsUpdate, (error) => {
      console.error('Cursor subscription error:', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up cursor subscription');
      off(cursorsRef);
      
      // Remove own cursor on unmount
      const cursorRef = ref(rtdb!, `cursors/${projectId}/${userId}`);
      set(cursorRef, null).catch((error) => {
        console.error('Failed to remove cursor on unmount:', error);
      });
    };
  }, [projectId, userId]);

  return {
    otherCursors,
    broadcastCursor,
  };
}

