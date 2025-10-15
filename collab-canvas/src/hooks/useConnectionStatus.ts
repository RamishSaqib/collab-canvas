import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

/**
 * Hook to monitor Firebase Realtime Database connection status
 * Provides real-time updates on connection state
 * 
 * States:
 * - online: Connected to Firebase
 * - offline: Disconnected from Firebase
 * - reconnecting: Attempting to reconnect
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);

  useEffect(() => {
    if (!rtdb) {
      console.warn('RTDB not initialized, assuming online');
      // Even if RTDB isn't initialized, we're probably online
      // Don't set to offline - Firestore might still work
      return;
    }

    let offlineTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Monitor RTDB connection using .info/connected
    const connectedRef = ref(rtdb, '.info/connected');
    
    const handleConnectionChange = (snapshot: any) => {
      const isConnected = snapshot.val() === true;
      
      // Clear any pending offline timeout
      if (offlineTimeoutId) {
        clearTimeout(offlineTimeoutId);
        offlineTimeoutId = null;
      }
      
      if (isConnected) {
        console.log('✅ Firebase RTDB connected');
        setStatus('online');
      } else {
        console.log('⚠️ Firebase RTDB disconnected, waiting...');
        setStatus('reconnecting');
        
        // After 5 seconds of disconnect, change to offline
        // (longer timeout to avoid false positives during brief disconnects)
        offlineTimeoutId = setTimeout(() => {
          console.log('❌ Firebase RTDB offline');
          setStatus('offline');
        }, 5000);
      }
    };

    const unsubscribe = onValue(connectedRef, handleConnectionChange);

    // Monitor browser online/offline events
    const handleOnline = () => {
      console.log('🌐 Browser back online');
      setStatus('online');
    };

    const handleOffline = () => {
      console.log('🔌 Browser went offline');
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      if (offlineTimeoutId) {
        clearTimeout(offlineTimeoutId);
      }
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firestore network state (separate from RTDB)
  useEffect(() => {
    const handleFirestoreOnline = () => {
      console.log('✅ Firestore online');
      setIsFirestoreOnline(true);
    };

    const handleFirestoreOffline = () => {
      console.log('❌ Firestore offline');
      setIsFirestoreOnline(false);
    };

    // Note: Firestore doesn't have a built-in connection monitor like RTDB
    // We rely on browser online/offline events as a proxy
    window.addEventListener('online', handleFirestoreOnline);
    window.addEventListener('offline', handleFirestoreOffline);

    return () => {
      window.removeEventListener('online', handleFirestoreOnline);
      window.removeEventListener('offline', handleFirestoreOffline);
    };
  }, []);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isReconnecting: status === 'reconnecting',
    isFirestoreOnline,
  };
}

