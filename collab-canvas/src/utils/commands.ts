import type { Command, CanvasObject } from '../lib/types';

/**
 * Base command class with common functionality
 */
abstract class BaseCommand implements Command {
  abstract execute(): void;
  abstract undo(): void;
  abstract getDescription(): string;

  redo(): void {
    this.execute();
  }
}

/**
 * Command for creating a new shape
 */
export class CreateShapeCommand extends BaseCommand {
  private shape: CanvasObject;
  private addShapeToState: (shape: CanvasObject) => void;
  private removeShapeFromState: (id: string) => void;

  constructor(
    shape: CanvasObject,
    addShapeToState: (shape: CanvasObject) => void,
    removeShapeFromState: (id: string) => void
  ) {
    super();
    this.shape = shape;
    this.addShapeToState = addShapeToState;
    this.removeShapeFromState = removeShapeFromState;
  }

  execute(): void {
    this.addShapeToState(this.shape);
  }

  undo(): void {
    this.removeShapeFromState(this.shape.id);
  }

  getDescription(): string {
    return `Create ${this.shape.type}`;
  }
}

/**
 * Command for deleting shapes
 */
export class DeleteShapeCommand extends BaseCommand {
  private shapes: CanvasObject[];
  private addShapesToState: (shapes: CanvasObject[]) => void;
  private removeShapesFromState: (ids: string[]) => void;

  constructor(
    shapes: CanvasObject[],
    addShapesToState: (shapes: CanvasObject[]) => void,
    removeShapesFromState: (ids: string[]) => void
  ) {
    super();
    this.shapes = shapes;
    this.addShapesToState = addShapesToState;
    this.removeShapesFromState = removeShapesFromState;
  }

  execute(): void {
    this.removeShapesFromState(this.shapes.map(s => s.id));
  }

  undo(): void {
    this.addShapesToState(this.shapes);
  }

  getDescription(): string {
    return this.shapes.length === 1 
      ? `Delete ${this.shapes[0].type}`
      : `Delete ${this.shapes.length} shapes`;
  }
}

/**
 * Command for updating shape properties
 */
export class UpdateShapeCommand extends BaseCommand {
  private shapeIds: string[];
  private oldStates: Map<string, Partial<CanvasObject>>;
  private newStates: Map<string, Partial<CanvasObject>>;
  private updateShapesInState: (updates: Map<string, Partial<CanvasObject>>) => void;

  constructor(
    shapeIds: string[],
    oldStates: Map<string, Partial<CanvasObject>>,
    newStates: Map<string, Partial<CanvasObject>>,
    updateShapesInState: (updates: Map<string, Partial<CanvasObject>>) => void
  ) {
    super();
    this.shapeIds = shapeIds;
    this.oldStates = oldStates;
    this.newStates = newStates;
    this.updateShapesInState = updateShapesInState;
  }

  execute(): void {
    this.updateShapesInState(this.newStates);
  }

  undo(): void {
    this.updateShapesInState(this.oldStates);
  }

  getDescription(): string {
    return this.shapeIds.length === 1
      ? 'Update shape'
      : `Update ${this.shapeIds.length} shapes`;
  }
}

/**
 * Command for moving shapes
 */
export class MoveShapeCommand extends BaseCommand {
  private shapeIds: string[];
  private oldPositions: Map<string, { x: number; y: number }>;
  private newPositions: Map<string, { x: number; y: number }>;
  private updateShapesInState: (updates: Map<string, Partial<CanvasObject>>) => void;

  constructor(
    shapeIds: string[],
    oldPositions: Map<string, { x: number; y: number }>,
    newPositions: Map<string, { x: number; y: number }>,
    updateShapesInState: (updates: Map<string, Partial<CanvasObject>>) => void
  ) {
    super();
    this.shapeIds = shapeIds;
    this.oldPositions = oldPositions;
    this.newPositions = newPositions;
    this.updateShapesInState = updateShapesInState;
  }

  execute(): void {
    const updates = new Map<string, Partial<CanvasObject>>();
    this.shapeIds.forEach(id => {
      const pos = this.newPositions.get(id);
      if (pos) {
        updates.set(id, pos);
      }
    });
    this.updateShapesInState(updates);
  }

  undo(): void {
    const updates = new Map<string, Partial<CanvasObject>>();
    this.shapeIds.forEach(id => {
      const pos = this.oldPositions.get(id);
      if (pos) {
        updates.set(id, pos);
      }
    });
    this.updateShapesInState(updates);
  }

  getDescription(): string {
    return this.shapeIds.length === 1
      ? 'Move shape'
      : `Move ${this.shapeIds.length} shapes`;
  }
}

/**
 * Command for transforming shapes (resize, rotate)
 */
export class TransformShapeCommand extends BaseCommand {
  private shapeIds: string[];
  private oldTransforms: Map<string, Partial<CanvasObject>>;
  private newTransforms: Map<string, Partial<CanvasObject>>;
  private updateShapesInState: (updates: Map<string, Partial<CanvasObject>>) => void;

  constructor(
    shapeIds: string[],
    oldTransforms: Map<string, Partial<CanvasObject>>,
    newTransforms: Map<string, Partial<CanvasObject>>,
    updateShapesInState: (updates: Map<string, Partial<CanvasObject>>) => void
  ) {
    super();
    this.shapeIds = shapeIds;
    this.oldTransforms = oldTransforms;
    this.newTransforms = newTransforms;
    this.updateShapesInState = updateShapesInState;
  }

  execute(): void {
    this.updateShapesInState(this.newTransforms);
  }

  undo(): void {
    this.updateShapesInState(this.oldTransforms);
  }

  getDescription(): string {
    return this.shapeIds.length === 1
      ? 'Transform shape'
      : `Transform ${this.shapeIds.length} shapes`;
  }
}

/**
 * Command for batching multiple commands together
 */
export class MultiShapeCommand extends BaseCommand {
  private commands: Command[];

  constructor(commands: Command[]) {
    super();
    this.commands = commands;
  }

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  getDescription(): string {
    return `Multiple operations (${this.commands.length})`;
  }
}

