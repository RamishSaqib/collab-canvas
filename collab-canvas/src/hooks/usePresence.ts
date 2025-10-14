import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, off } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import type { Presence } from '../lib/types';

const CANVAS_ID = 'main-canvas'; // Same as cursors and Firestore

interface UsePresenceProps {
  userId: string;
  userName: string;
  userColor: string;
}

/**
 * Hook for tracking online users (presence awareness)
 * Uses Firebase Realtime Database with automatic disconnect handling
 */
export function usePresence({ userId, userName, userColor }: UsePresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<Presence[]>([]);
  const disconnectHandlerSetRef = useRef(false);

  /**
   * Broadcast current user's presence
   */
  const broadcastPresence = useCallback(() => {
    if (!rtdb) {
      console.warn('Realtime Database not initialized');
      return;
    }

    const presenceRef = ref(rtdb, `presence/${CANVAS_ID}/${userId}`);
    const presenceData: Presence = {
      userId,
      userName,
      color: userColor,
      lastSeen: Date.now(),
    };

    set(presenceRef, presenceData).catch((error) => {
      console.error('Failed to broadcast presence:', error);
    });

    // Set up disconnect handler (only once)
    if (!disconnectHandlerSetRef.current && rtdb) {
      onDisconnect(presenceRef).remove().catch((error) => {
        console.error('Failed to set disconnect handler:', error);
      });
      disconnectHandlerSetRef.current = true;
    }
  }, [userId, userName, userColor]);

  /**
   * Subscribe to all users' presence
   */
  useEffect(() => {
    if (!rtdb) {
      console.warn('Realtime Database not initialized, presence disabled');
      return;
    }

    console.log('Setting up presence subscription...');

    // Broadcast own presence immediately
    broadcastPresence();

    // Set up heartbeat to keep presence alive (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      broadcastPresence();
    }, 30000);

    const presenceRef = ref(rtdb, `presence/${CANVAS_ID}`);

    const handlePresenceUpdate = (snapshot: any) => {
      const users: Presence[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = Date.now();
        const TIMEOUT_MS = 60000; // 1 minute timeout
        
        Object.keys(data).forEach((presenceUserId) => {
          const presence = data[presenceUserId] as Presence;
          
          // Filter out stale presence (older than 1 minute)
          if (now - presence.lastSeen < TIMEOUT_MS) {
            users.push(presence);
          }
        });

        // Sort by userName for consistent order
        users.sort((a, b) => a.userName.localeCompare(b.userName));
      }

      console.log('Presence updated, online users:', users.length);
      setOnlineUsers(users);
    };

    // Subscribe to presence updates
    onValue(presenceRef, handlePresenceUpdate, (error) => {
      console.error('Presence subscription error:', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up presence subscription');
      clearInterval(heartbeatInterval);
      off(presenceRef);
      
      // Remove own presence on unmount
      const userPresenceRef = ref(rtdb!, `presence/${CANVAS_ID}/${userId}`);
      set(userPresenceRef, null).catch((error) => {
        console.error('Failed to remove presence on unmount:', error);
      });
    };
  }, [userId, broadcastPresence]);

  return {
    onlineUsers,
    broadcastPresence,
  };
}

