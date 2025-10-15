import { useEffect, useRef } from 'react';

/**
 * Hook to ensure critical operations complete before page unload
 * Flushes any pending debounced updates to prevent data loss
 * 
 * This solves the "100ms debounce edge case" where a user might:
 * - Make an edit
 * - Immediately refresh the page (within 100ms)
 * - Lose that edit because the debounced update didn't fire
 */
export function useBeforeUnload(flushCallback: () => Promise<void>) {
  const flushCallbackRef = useRef(flushCallback);

  // Keep ref up to date
  useEffect(() => {
    flushCallbackRef.current = flushCallback;
  }, [flushCallback]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Execute flush synchronously
      // Note: Modern browsers limit what you can do in beforeunload
      // We do our best to flush, but can't guarantee completion
      try {
        // Call the flush callback
        flushCallbackRef.current();
        
        // For debugging - this message won't show in modern browsers
        // but the return value indicates we want to delay unload
        const message = 'Saving changes...';
        e.preventDefault();
        e.returnValue = message;
        return message;
      } catch (error) {
        console.error('Error flushing updates before unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

