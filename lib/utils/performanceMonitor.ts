/**
 * Performance Monitor for API calls
 * Tracks response times, success rates, and performance metrics
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  success: boolean;
  timestamp: number;
  error?: string;
  cacheHit?: boolean;
}

interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly slowThreshold = 5000; // 5 seconds

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metric.responseTime > this.slowThreshold) {
          }

    // Log cache hits for optimization insights
    if (metric.cacheHit) {
          }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        slowestEndpoint: '',
        fastestEndpoint: '',
      };
    }

    const successfulRequests = this.metrics.filter(m => m.success).length;
    const failedRequests = this.metrics.length - successfulRequests;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    
    const totalResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / this.metrics.length;

    // Find slowest and fastest endpoints
    const endpointTimes = this.metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 };
      }
      acc[key].total += metric.responseTime;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const endpointAverages = Object.entries(endpointTimes).map(([endpoint, data]) => ({
      endpoint,
      averageTime: data.total / data.count,
    }));

    const slowestEndpoint = endpointAverages.reduce((slowest, current) => 
      current.averageTime > slowest.averageTime ? current : slowest
    ).endpoint;

    const fastestEndpoint = endpointAverages.reduce((fastest, current) => 
      current.averageTime < fastest.averageTime ? current : fastest
    ).endpoint;

    return {
      totalRequests: this.metrics.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      cacheHitRate: Math.round((cacheHits / this.metrics.length) * 100),
      slowestEndpoint,
      fastestEndpoint,
    };
  }

  /**
   * Get metrics for a specific endpoint
   */
  getEndpointMetrics(endpoint: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.endpoint.includes(endpoint));
  }

  /**
   * Get recent slow requests
   */
  getSlowRequests(threshold: number = this.slowThreshold): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime);
  }

  /**
   * Get cache performance
   */
  getCachePerformance(): { hits: number; misses: number; hitRate: number } {
    const hits = this.metrics.filter(m => m.cacheHit).length;
    const misses = this.metrics.filter(m => m.cacheHit === false).length;
    const total = hits + misses;
    
    return {
      hits,
      misses,
      hitRate: total > 0 ? Math.round((hits / total) * 100) : 0,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get performance recommendations based on metrics
   */
  getRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.averageResponseTime > 3000) {
      recommendations.push('Consider reducing API timeouts or implementing better caching');
    }

    if (stats.cacheHitRate < 50) {
      recommendations.push('Low cache hit rate - consider increasing cache TTL or improving cache keys');
    }

    if (stats.failedRequests / stats.totalRequests > 0.1) {
      recommendations.push('High failure rate - check API reliability and error handling');
    }

    const slowRequests = this.getSlowRequests();
    if (slowRequests.length > 0) {
      const slowest = slowRequests[0];
      recommendations.push(`Slowest request: ${slowest.method} ${slowest.endpoint} (${slowest.responseTime}ms)`);
    }

    return recommendations;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to wrap API calls with performance monitoring
export const withPerformanceMonitoring = async <T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET',
  options: { cacheHit?: boolean } = {}
): Promise<T> => {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const result = await apiCall();
    success = true;
    return result;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const responseTime = Date.now() - startTime;
    
    performanceMonitor.recordMetric({
      endpoint,
      method,
      responseTime,
      success,
      error,
      cacheHit: options.cacheHit,
    });
  }
};

// Performance dashboard data
export const getPerformanceDashboard = () => {
  const stats = performanceMonitor.getStats();
  const recommendations = performanceMonitor.getRecommendations();
  const cachePerformance = performanceMonitor.getCachePerformance();
  const slowRequests = performanceMonitor.getSlowRequests();

  return {
    stats,
    recommendations,
    cachePerformance,
    slowRequests: slowRequests.slice(0, 10), // Top 10 slowest requests
    timestamp: new Date().toISOString(),
  };
};

export default performanceMonitor;








