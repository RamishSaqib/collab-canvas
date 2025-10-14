// User types
export interface User {
  id: string;
  name: string;
  email: string;
  color: string; // for cursor
}

// Cursor Position
export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

// Canvas Object (Shape)
export interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fill: string;
  rotation?: number;
  createdBy: string;
  lastModifiedBy: string;
  lastModifiedAt: number;
}

// Canvas State
export interface CanvasState {
  objects: Record<string, CanvasObject>;
  version: number; // for conflict resolution
}

// Presence
export interface Presence {
  userId: string;
  userName: string;
  color: string;
  lastSeen: number;
}

// Auth State
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

