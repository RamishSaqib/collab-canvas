import { useState, useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { clampZoom, calculateZoomPosition, getZoomPoint, fitStageToWindow } from '../../utils/canvas';
import './Canvas.css';

interface CanvasProps {
  user: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
}

export default function Canvas({ user }: CanvasProps) {
  const [stageSize, setStageSize] = useState(fitStageToWindow());
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize(fitStageToWindow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = getZoomPoint(stage);

    // Zoom factor
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    
    const newScale = clampZoom(
      direction > 0 ? oldScale * scaleBy : oldScale / scaleBy,
      0.1,
      5
    );

    // Calculate new position to zoom toward cursor
    const newPos = calculateZoomPosition(stage, oldScale, newScale, pointer);

    setStageScale(newScale);
    setStagePosition(newPos);
  };

  // Handle drag end to update position
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {/* Grid background for reference */}
          {/* Shapes will be rendered here in future PRs */}
        </Layer>
      </Stage>
      
      {/* Canvas info overlay */}
      <div className="canvas-info">
        <div className="info-item">
          <span className="info-label">User:</span>
          <span className="info-value">{user.name}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Zoom:</span>
          <span className="info-value">{Math.round(stageScale * 100)}%</span>
        </div>
        <div className="info-item">
          <span className="info-label">Position:</span>
          <span className="info-value">
            {Math.round(stagePosition.x)}, {Math.round(stagePosition.y)}
          </span>
        </div>
      </div>
    </div>
  );
}

