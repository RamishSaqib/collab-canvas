/**
 * Performance monitoring utilities
 * Helps track and optimize app performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 100; // Keep only last 100 metrics

/**
 * Measure execution time of a function
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  recordMetric({
    name,
    duration,
    timestamp: Date.now(),
  });

  // Log slow operations (> 16ms, roughly one frame at 60fps)
  if (duration > 16) {
    console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Record a performance metric
 */
function recordMetric(metric: PerformanceMetric): void {
  performanceMetrics.push(metric);
  
  // Keep only recent metrics to avoid memory bloat
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics.shift();
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(operationName?: string): {
  count: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
} {
  const metrics = operationName
    ? performanceMetrics.filter(m => m.name === operationName)
    : performanceMetrics;

  if (metrics.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: 0,
    };
  }

  const durations = metrics.map(m => m.duration);
  const sum = durations.reduce((a, b) => a + b, 0);

  return {
    count: metrics.length,
    avgDuration: sum / metrics.length,
    maxDuration: Math.max(...durations),
    minDuration: Math.min(...durations),
  };
}

/**
 * Clear all recorded metrics
 */
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const operations = new Set(performanceMetrics.map(m => m.name));
  
  console.group('📊 Performance Summary');
  
  operations.forEach(operation => {
    const stats = getPerformanceStats(operation);
    console.log(
      `${operation}:`,
      `avg: ${stats.avgDuration.toFixed(2)}ms,`,
      `min: ${stats.minDuration.toFixed(2)}ms,`,
      `max: ${stats.maxDuration.toFixed(2)}ms,`,
      `count: ${stats.count}`
    );
  });
  
  console.groupEnd();
}

/**
 * Check for memory leaks by monitoring object count
 */
export function checkMemoryLeaks(
  objectCount: number,
  threshold: number = 1000
): void {
  if (objectCount > threshold) {
    console.warn(
      `⚠️ Potential memory leak: ${objectCount} objects in memory (threshold: ${threshold})`
    );
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

