/**
 * Optimized API Client with improved performance
 * Reduces timeouts, improves caching, and optimizes external API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './utils/logger';

interface OptimizedApiConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheTTL: number;
  enableRequestDeduplication: boolean;
}

const OPTIMIZED_CONFIG: OptimizedApiConfig = {
  timeout: 8000, // Reduced from 30s to 8s
  retries: 2, // Reduced from 3 to 2
  retryDelay: 500, // Reduced from 1000ms to 500ms
  enableCaching: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enableRequestDeduplication: true,
};

// External API specific configurations
const EXTERNAL_API_CONFIGS = {
  coingecko: {
    timeout: 5000, // 5 seconds for CoinGecko
    retries: 1,
    retryDelay: 200,
    rateLimitDelay: 200, // Reduced from 1000ms
  },
  changenow: {
    timeout: 10000, // 10 seconds for ChangeNow
    retries: 2,
    retryDelay: 300,
  },
  express: {
    timeout: 6000, // 6 seconds for Express operations
    retries: 1,
    retryDelay: 400,
  },
};

class OptimizedApiClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private rateLimiters = new Map<string, { lastRequest: number; requestCount: number }>();

  private getRateLimiter(apiName: string) {
    if (!this.rateLimiters.has(apiName)) {
      this.rateLimiters.set(apiName, { lastRequest: 0, requestCount: 0 });
    }
    return this.rateLimiters.get(apiName)!;
  }

  private async checkRateLimit(apiName: string, config: any) {
    const limiter = this.getRateLimiter(apiName);
    const now = Date.now();
    const timeSinceLastRequest = now - limiter.lastRequest;

    // Reset counter every minute
    if (timeSinceLastRequest > 60000) {
      limiter.requestCount = 0;
    }

    // Apply rate limiting
    if (timeSinceLastRequest < config.rateLimitDelay) {
      const delay = config.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    limiter.lastRequest = Date.now();
    limiter.requestCount++;
  }

  private generateCacheKey(url: string, config?: AxiosRequestConfig): string {
    const method = config?.method || 'GET';
    const params = config?.params ? JSON.stringify(config.params) : '';
    const data = config?.data ? JSON.stringify(config.data) : '';
    return `${method}_${btoa(url + params + data).replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  private isCacheValid(entry: { data: any; timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      logger.debug('Cache hit', { key });
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key); // Remove expired entry
    }
    
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    config: any,
    apiName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        if (apiName === 'coingecko') {
          await this.checkRateLimit(apiName, config);
        }

        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < config.retries) {
          const delay = config.retryDelay * (attempt + 1);
          logger.warn(`Request failed, retrying in ${delay}ms`, { 
            attempt: attempt + 1, 
            error: lastError.message,
            apiName 
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig & { apiName?: string; useCache?: boolean; cacheTTL?: number }
  ): Promise<AxiosResponse<T>> {
    const { apiName = 'default', useCache = true, cacheTTL = OPTIMIZED_CONFIG.cacheTTL, ...axiosConfig } = config || {};
    const cacheKey = this.generateCacheKey(url, axiosConfig);

    // Check cache first
    if (useCache && axiosConfig.method !== 'POST' && axiosConfig.method !== 'PUT' && axiosConfig.method !== 'PATCH') {
      const cached = await this.getFromCache<AxiosResponse<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check for pending request deduplication
    if (OPTIMIZED_CONFIG.enableRequestDeduplication && this.pendingRequests.has(cacheKey)) {
      logger.debug('Deduplicating request', { url, cacheKey });
      return this.pendingRequests.get(cacheKey)!;
    }

    // Get API-specific config
    const apiConfig = EXTERNAL_API_CONFIGS[apiName as keyof typeof EXTERNAL_API_CONFIGS] || {
      timeout: OPTIMIZED_CONFIG.timeout,
      retries: OPTIMIZED_CONFIG.retries,
      retryDelay: OPTIMIZED_CONFIG.retryDelay,
    };

    // Create request promise
    const requestPromise = this.executeWithRetry(async () => {
      const axiosInstance = axios.create({
        timeout: apiConfig.timeout,
        ...axiosConfig,
      });

      const response = await axiosInstance.get<T>(url, axiosConfig);
      
      // Cache successful response
      if (useCache) {
        this.setCache(cacheKey, response, cacheTTL);
      }

      return response;
    }, apiConfig, apiName);

    // Store pending request for deduplication
    if (OPTIMIZED_CONFIG.enableRequestDeduplication) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending request
      if (OPTIMIZED_CONFIG.enableRequestDeduplication) {
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { apiName?: string }
  ): Promise<AxiosResponse<T>> {
    const { apiName = 'default', ...axiosConfig } = config || {};
    const apiConfig = EXTERNAL_API_CONFIGS[apiName as keyof typeof EXTERNAL_API_CONFIGS] || {
      timeout: OPTIMIZED_CONFIG.timeout,
      retries: OPTIMIZED_CONFIG.retries,
      retryDelay: OPTIMIZED_CONFIG.retryDelay,
    };

    return this.executeWithRetry(async () => {
      const axiosInstance = axios.create({
        timeout: apiConfig.timeout,
        ...axiosConfig,
      });

      return await axiosInstance.post<T>(url, data, axiosConfig);
    }, apiConfig, apiName);
  }

  // Clear cache for specific pattern or all
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const optimizedApiClient = new OptimizedApiClient();

// Export convenience methods
export const optimizedGet = optimizedApiClient.get.bind(optimizedApiClient);
export const optimizedPost = optimizedApiClient.post.bind(optimizedApiClient);

export default optimizedApiClient;


