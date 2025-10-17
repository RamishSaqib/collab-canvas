import { useState, useCallback } from 'react';
import type { Command } from '../lib/types';

const MAX_HISTORY_SIZE = 50;

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryState>({
    undoStack: [],
    redoStack: [],
  });

  const canUndo = history.undoStack.length > 0;
  const canRedo = history.redoStack.length > 0;

  /**
   * Execute a command and add it to history
   */
  const executeCommand = useCallback((command: Command) => {
    // Execute the command
    command.execute();

    // Add to undo stack
    setHistory((prev) => {
      const newUndoStack = [...prev.undoStack, command];
      
      // Limit stack size
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.shift();
      }

      return {
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack when new command executed
      };
    });
  }, []);

  /**
   * Undo the last command
   */
  const undo = useCallback(() => {
    if (!canUndo) return null;

    setHistory((prev) => {
      const newUndoStack = [...prev.undoStack];
      const command = newUndoStack.pop();

      if (!command) return prev;

      // Execute undo
      command.undo();

      return {
        undoStack: newUndoStack,
        redoStack: [...prev.redoStack, command],
      };
    });

    return history.undoStack[history.undoStack.length - 1]?.getDescription() || 'Undo';
  }, [canUndo, history.undoStack]);

  /**
   * Redo the last undone command
   */
  const redo = useCallback(() => {
    if (!canRedo) return null;

    setHistory((prev) => {
      const newRedoStack = [...prev.redoStack];
      const command = newRedoStack.pop();

      if (!command) return prev;

      // Execute redo
      command.redo();

      return {
        undoStack: [...prev.undoStack, command],
        redoStack: newRedoStack,
      };
    });

    return history.redoStack[history.redoStack.length - 1]?.getDescription() || 'Redo';
  }, [canRedo, history.redoStack]);

  /**
   * Execute multiple commands as a single batch operation
   * Useful for AI-generated commands that create multiple shapes
   */
  const executeBatch = useCallback((commands: Command[], description?: string) => {
    if (commands.length === 0) return;
    
    if (commands.length === 1) {
      // Single command, execute normally
      executeCommand(commands[0]);
      return;
    }

    // Multiple commands, wrap in a batch command
    // Import MultiShapeCommand from commands.ts
    const { MultiShapeCommand } = require('../utils/commands');
    const batchCommand = new MultiShapeCommand(commands);
    
    // Override description if provided
    if (description) {
      batchCommand.getDescription = () => description;
    }
    
    executeCommand(batchCommand);
  }, [executeCommand]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory({
      undoStack: [],
      redoStack: [],
    });
  }, []);

  return {
    executeCommand,
    executeBatch,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    undoStackSize: history.undoStack.length,
    redoStackSize: history.redoStack.length,
  };
}

