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
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic';
  textAlign?: 'left' | 'center' | 'right';
  fill: string;
  rotation?: number;
  zIndex?: number;
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

// Command Pattern for Undo/Redo
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  getDescription(): string;
}

export type CommandType = 
  | 'create'
  | 'delete'
  | 'update'
  | 'move'
  | 'transform'
  | 'multi';

// Collaborative Comments
export interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    color: string;
  };
  position: {
    x: number;
    y: number;
  };
  shapeId?: string; // Optional: if attached to a shape
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}

// AI Canvas Agent Types
export type CommandIntent =
  | 'create'
  | 'delete'
  | 'move'
  | 'resize'
  | 'rotate'
  | 'changeColor'
  | 'arrange'
  | 'grid'
  | 'stack'
  | 'complex';

export interface CommandEntity {
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'text';
  color?: string;
  position?: { x: number; y: number };
  size?: { width?: number; height?: number; radius?: number; scale?: number };
  rotation?: number;
  text?: string;
  count?: number; // For grids like "3x3"
  spacing?: number;
  direction?: 'horizontal' | 'vertical';
  query?: ShapeQuery; // For finding existing shapes
  fontSize?: number;
}

export interface ShapeQuery {
  type?: 'rectangle' | 'circle' | 'triangle' | 'text' | 'all';
  color?: string;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  selected?: boolean; // Query selected shapes
  limit?: number; // Limit to N most recent shapes (1 for "the shape", undefined for "all shapes")
}

export interface AICommand {
  intent: CommandIntent;
  entities: CommandEntity;
  confidence?: number;
  description?: string; // Human-readable description
}

export interface AIResponse {
  success: boolean;
  commands: AICommand[];
  error?: string;
  suggestions?: string[];
}
