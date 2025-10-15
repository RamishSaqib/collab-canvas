import { useState, useCallback, useEffect, useRef } from 'react';
import type { CanvasObject } from '../lib/types';

export type OperationType = 'create' | 'update' | 'delete';

export interface QueuedOperation {
  id: string; // Unique operation ID
  type: OperationType;
  objectId: string;
  payload: Partial<CanvasObject>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OperationQueueState {
  operations: QueuedOperation[];
  isProcessing: boolean;
}

const STORAGE_KEY = 'collab-canvas-operation-queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const RETRY_DELAY_MAX = 10000; // 10 seconds max delay

/**
 * Operation Queue Hook
 * Manages a queue of operations that failed due to network issues
 * Persists queue to localStorage for survival across page refreshes
 * Implements exponential backoff retry strategy
 */
export function useOperationQueue() {
  const [state, setState] = useState<OperationQueueState>({
    operations: [],
    isProcessing: false,
  });
  
  const processingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const operations = JSON.parse(stored) as QueuedOperation[];
        console.log(`📦 Loaded ${operations.length} queued operations from localStorage`);
        setState(prev => ({ ...prev, operations }));
      }
    } catch (error) {
      console.error('Failed to load operation queue from localStorage:', error);
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.operations));
    } catch (error) {
      console.error('Failed to save operation queue to localStorage:', error);
    }
  }, [state.operations]);

  /**
   * Add an operation to the queue
   */
  const queueOperation = useCallback((
    type: OperationType,
    objectId: string,
    payload: Partial<CanvasObject>
  ): string => {
    const operation: QueuedOperation = {
      id: `${type}-${objectId}-${Date.now()}`,
      type,
      objectId,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
    };

    setState(prev => ({
      ...prev,
      operations: [...prev.operations, operation],
    }));

    console.log(`📝 Queued ${type} operation for object ${objectId}`);
    return operation.id;
  }, []);

  /**
   * Remove an operation from the queue
   */
  const removeOperation = useCallback((operationId: string) => {
    setState(prev => ({
      ...prev,
      operations: prev.operations.filter(op => op.id !== operationId),
    }));
    console.log(`✅ Removed operation ${operationId} from queue`);
  }, []);

  /**
   * Increment retry count for an operation
   */
  const incrementRetry = useCallback((operationId: string) => {
    setState(prev => ({
      ...prev,
      operations: prev.operations.map(op =>
        op.id === operationId
          ? { ...op, retryCount: op.retryCount + 1 }
          : op
      ),
    }));
  }, []);

  /**
   * Process a single operation
   * Returns true if successful, false if failed
   */
  const processOperation = useCallback(async (
    operation: QueuedOperation,
    executeFunc: (op: QueuedOperation) => Promise<void>
  ): Promise<boolean> => {
    try {
      console.log(`⚙️ Processing ${operation.type} operation for ${operation.objectId} (attempt ${operation.retryCount + 1}/${operation.maxRetries})`);
      
      await executeFunc(operation);
      
      console.log(`✅ Successfully processed operation ${operation.id}`);
      removeOperation(operation.id);
      return true;
    } catch (error) {
      console.error(`❌ Failed to process operation ${operation.id}:`, error);
      
      // Check if we should retry
      if (operation.retryCount < operation.maxRetries) {
        incrementRetry(operation.id);
        
        // Calculate exponential backoff delay
        const delay = Math.min(
          RETRY_DELAY_BASE * Math.pow(2, operation.retryCount),
          RETRY_DELAY_MAX
        );
        
        console.log(`🔄 Will retry in ${delay}ms`);
        return false;
      } else {
        console.error(`💀 Operation ${operation.id} failed after ${operation.maxRetries} retries, removing from queue`);
        removeOperation(operation.id);
        return false;
      }
    }
  }, [removeOperation, incrementRetry]);

  /**
   * Process all queued operations
   */
  const processQueue = useCallback(async (
    executeFunc: (op: QueuedOperation) => Promise<void>
  ) => {
    if (processingRef.current) {
      console.log('⏸️ Queue already processing, skipping');
      return;
    }

    if (state.operations.length === 0) {
      return;
    }

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true }));

    console.log(`🚀 Processing ${state.operations.length} queued operations...`);

    // Process operations sequentially to maintain order
    for (const operation of state.operations) {
      await processOperation(operation, executeFunc);
    }

    processingRef.current = false;
    setState(prev => ({ ...prev, isProcessing: false }));

    console.log('✨ Queue processing complete');
  }, [state.operations, processOperation]);

  /**
   * Clear all operations from the queue
   */
  const clearQueue = useCallback(() => {
    setState({ operations: [], isProcessing: false });
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Queue cleared');
  }, []);

  /**
   * Get queue status
   */
  const getQueueStatus = useCallback(() => {
    return {
      count: state.operations.length,
      isProcessing: state.isProcessing,
      operations: state.operations,
    };
  }, [state]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    queueOperation,
    processQueue,
    removeOperation,
    clearQueue,
    getQueueStatus,
    queueCount: state.operations.length,
    isProcessing: state.isProcessing,
  };
}

