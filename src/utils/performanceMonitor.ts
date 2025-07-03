// Performance monitoring utility for PharmaLens

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Start timing a performance metric
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(name, metric);
  }

  // End timing and calculate duration
  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log the result
    console.log(`⚡ ${name}: ${metric.duration.toFixed(2)}ms`, metric.metadata || '');

    return metric.duration;
  }

  // Measure a function execution time
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // Measure an async function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  // Get performance summary
  getSummary(): Record<string, any> {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return {};

    const totalTime = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const avgTime = totalTime / metrics.length;
    const slowest = metrics.reduce((max, m) => 
      (m.duration || 0) > (max.duration || 0) ? m : max
    );
    const fastest = metrics.reduce((min, m) => 
      (m.duration || 0) < (min.duration || 0) ? m : min
    );

    return {
      totalMetrics: metrics.length,
      totalTime: totalTime.toFixed(2),
      averageTime: avgTime.toFixed(2),
      slowest: {
        name: slowest.name,
        duration: slowest.duration?.toFixed(2)
      },
      fastest: {
        name: fastest.name,
        duration: fastest.duration?.toFixed(2)
      }
    };
  }

  // Monitor bundle size
  logBundleInfo(): void {
    if (!this.isEnabled) return;

    // Estimate bundle size from loaded scripts
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('assets')) {
        // Rough estimation - in production you'd want actual file sizes
        totalSize += 500; // KB estimate per chunk
      }
    });

    console.log(`📦 Estimated bundle size: ~${totalSize}KB`);
  }

  // Monitor memory usage
  logMemoryUsage(): void {
    if (!this.isEnabled || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    console.log('🧠 Memory usage:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
    });
  }

  // Monitor Core Web Vitals
  logWebVitals(): void {
    if (!this.isEnabled) return;

    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      console.log(`🎨 First Contentful Paint: ${fcpEntry.startTime.toFixed(2)}ms`);
    }

    // Largest Contentful Paint (requires observer)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`🖼️ Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
          observer.disconnect();
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Observer not supported
      }
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    start: performanceMonitor.start.bind(performanceMonitor),
    end: performanceMonitor.end.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    clear: performanceMonitor.clear.bind(performanceMonitor)
  };
};

// Utility functions for common measurements
export const measureSearchTime = async (searchFn: () => Promise<any>, query: string) => {
  return performanceMonitor.measureAsync(
    'drug-search',
    searchFn,
    { query, timestamp: Date.now() }
  );
};

export const measureRenderTime = (componentName: string, renderFn: () => any) => {
  return performanceMonitor.measure(
    `render-${componentName}`,
    renderFn,
    { component: componentName }
  );
};

export const measureDataLoad = async (loadFn: () => Promise<any>, dataType: string) => {
  return performanceMonitor.measureAsync(
    `data-load-${dataType}`,
    loadFn,
    { dataType, timestamp: Date.now() }
  );
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Log initial metrics
  setTimeout(() => {
    performanceMonitor.logBundleInfo();
    performanceMonitor.logMemoryUsage();
    performanceMonitor.logWebVitals();
  }, 1000);

  // Log memory usage periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      performanceMonitor.logMemoryUsage();
    }, 30000); // Every 30 seconds
  }
}