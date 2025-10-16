import { useState, useEffect, useRef } from 'react';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  shapeCount: number;
  userCount: number;
}

export default function PerformanceMonitor({ shapeCount, userCount }: PerformanceMonitorProps) {
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    let animationFrameId: number;

    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      // Update FPS every second
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);

        // Track FPS history for average
        fpsHistoryRef.current.push(currentFps);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }

        // Calculate average FPS
        const avg = Math.round(
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        );
        setAvgFps(avg);

        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      // Measure memory usage if available
      if ((performance as any).memory) {
        const usedMemory = (performance as any).memory.usedJSHeapSize;
        const totalMemory = (performance as any).memory.jsHeapSizeLimit;
        const percentUsed = Math.round((usedMemory / totalMemory) * 100);
        setMemoryUsage(percentUsed);
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const getFpsColor = () => {
    if (fps >= 55) return '#10b981'; // Green
    if (fps >= 45) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getPerformanceRating = () => {
    if (shapeCount >= 500 && avgFps >= 55 && userCount >= 5) return 'EXCELLENT';
    if (shapeCount >= 300 && avgFps >= 50 && userCount >= 4) return 'GOOD';
    if (shapeCount >= 100 && avgFps >= 45 && userCount >= 2) return 'SATISFACTORY';
    return 'TESTING';
  };

  return (
    <div className="performance-monitor">
      <div className="perf-header">
        <span className="perf-title">⚡ Performance</span>
        <span className={`perf-rating rating-${getPerformanceRating().toLowerCase()}`}>
          {getPerformanceRating()}
        </span>
      </div>
      
      <div className="perf-metrics">
        <div className="perf-metric">
          <span className="metric-label">FPS</span>
          <span className="metric-value" style={{ color: getFpsColor() }}>
            {fps}
          </span>
        </div>
        
        <div className="perf-metric">
          <span className="metric-label">Avg FPS</span>
          <span className="metric-value" style={{ color: getFpsColor() }}>
            {avgFps}
          </span>
        </div>

        <div className="perf-metric">
          <span className="metric-label">Objects</span>
          <span className="metric-value">{shapeCount}</span>
        </div>

        <div className="perf-metric">
          <span className="metric-label">Users</span>
          <span className="metric-value">{userCount}</span>
        </div>

        {memoryUsage > 0 && (
          <div className="perf-metric">
            <span className="metric-label">Memory</span>
            <span className="metric-value">{memoryUsage}%</span>
          </div>
        )}
      </div>

      <div className="perf-bar">
        <div 
          className="perf-bar-fill" 
          style={{ 
            width: `${(fps / 60) * 100}%`,
            backgroundColor: getFpsColor()
          }}
        />
      </div>
    </div>
  );
}

