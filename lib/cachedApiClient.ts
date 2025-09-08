/**
 * Cached API Client
 * Enhanced API client with automatic caching using IndexedDB
 */

import { get, post, put, patch, del, AxiosRequestConfig } from './apiClient';
import { AxiosResponse } from 'axios';
import { browserCache } from './browserCache';

interface CachedApiOptions {
  ttl?: number; // Time to live in milliseconds
  useCache?: boolean; // Whether to use caching
  cacheKey?: string; // Custom cache key
}

interface CachedAxiosRequestConfig extends AxiosRequestConfig {
  cache?: boolean; // Whether to cache this request
  ttl?: number; // Time to live in milliseconds
  cacheKey?: string; // Custom cache key
}

class CachedApiClient {
  private defaultTTL = 60 * 60 * 1000; // 1 hour default

  /**
   * Generate cache key from URL and config
   */
  private generateCacheKey(url: string, config?: CachedAxiosRequestConfig): string {
    const method = config?.method || 'GET';
    const params = config?.params ? JSON.stringify(config.params) : '';
    const data = config?.data ? JSON.stringify(config.data) : '';
    return `api_${method}_${btoa(url + params + data).replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * Check if request should be cached
   */
  private shouldCache(method: string, config?: CachedAxiosRequestConfig): boolean {
    // Only cache GET requests by default
    if (method.toUpperCase() !== 'GET') return false;
    
    // Don't cache if explicitly disabled
    if (config?.cache === false) return false;
    
    return true;
  }

  /**
   * Cached GET request
   */
  async get<T>(
    url: string,
    config?: CachedAxiosRequestConfig & CachedApiOptions
  ): Promise<AxiosResponse<T>> {
    const { ttl, useCache = true, cacheKey, ...axiosConfig } = config || {};
    
    if (useCache && this.shouldCache('GET', axiosConfig)) {
      const key = cacheKey || this.generateCacheKey(url, axiosConfig);
      
      try {
        // Try to get from cache first
        const cached = await browserCache.get<AxiosResponse<T>>(key);
        if (cached) {
          console.log(`[CachedApiClient] Cache hit for GET ${url}`);
          return cached;
        }
      } catch (error) {
        console.warn(`[CachedApiClient] Cache get failed for ${url}:`, error);
      }

      try {
        // Fetch fresh data
        console.log(`[CachedApiClient] Cache miss for GET ${url}, fetching...`);
        const response = await get<T>(url, axiosConfig);
        
        // Cache the response
        await browserCache.set(key, response, ttl || this.defaultTTL);
        
        return response;
      } catch (error) {
        console.error(`[CachedApiClient] GET request failed for ${url}:`, error);
        throw error;
      }
    }

    // No caching, direct request
    return get<T>(url, axiosConfig);
  }

  /**
   * Cached POST request (usually not cached, but can be for specific cases)
   */
  async post<T>(
    url: string,
    data?: any,
    config?: CachedAxiosRequestConfig & CachedApiOptions
  ): Promise<AxiosResponse<T>> {
    const { ttl, useCache = false, cacheKey, ...axiosConfig } = config || {};
    
    if (useCache && cacheKey) {
      const key = cacheKey;
      
      try {
        // Try to get from cache first
        const cached = await browserCache.get<AxiosResponse<T>>(key);
        if (cached) {
          console.log(`[CachedApiClient] Cache hit for POST ${url}`);
          return cached;
        }
      } catch (error) {
        console.warn(`[CachedApiClient] Cache get failed for ${url}:`, error);
      }

      try {
        // Fetch fresh data
        const response = await post<T>(url, data, axiosConfig);
        
        // Cache the response
        await browserCache.set(key, response, ttl || this.defaultTTL);
        
        return response;
      } catch (error) {
        console.error(`[CachedApiClient] POST request failed for ${url}:`, error);
        throw error;
      }
    }

    // No caching, direct request
    return post<T>(url, data, axiosConfig);
  }

  /**
   * Cached PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: CachedAxiosRequestConfig & CachedApiOptions
  ): Promise<AxiosResponse<T>> {
    const { ttl, useCache = false, cacheKey, ...axiosConfig } = config || {};
    
    if (useCache && cacheKey) {
      const key = cacheKey;
      
      try {
        // Try to get from cache first
        const cached = await browserCache.get<AxiosResponse<T>>(key);
        if (cached) {
          console.log(`[CachedApiClient] Cache hit for PUT ${url}`);
          return cached;
        }
      } catch (error) {
        console.warn(`[CachedApiClient] Cache get failed for ${url}:`, error);
      }

      try {
        // Fetch fresh data
        const response = await put<T>(url, data, axiosConfig);
        
        // Cache the response
        await browserCache.set(key, response, ttl || this.defaultTTL);
        
        return response;
      } catch (error) {
        console.error(`[CachedApiClient] PUT request failed for ${url}:`, error);
        throw error;
      }
    }

    // No caching, direct request
    return put<T>(url, data, axiosConfig);
  }

  /**
   * Cached PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
    config?: CachedAxiosRequestConfig & CachedApiOptions
  ): Promise<AxiosResponse<T>> {
    const { ttl, useCache = false, cacheKey, ...axiosConfig } = config || {};
    
    if (useCache && cacheKey) {
      const key = cacheKey;
      
      try {
        // Try to get from cache first
        const cached = await browserCache.get<AxiosResponse<T>>(key);
        if (cached) {
          console.log(`[CachedApiClient] Cache hit for PATCH ${url}`);
          return cached;
        }
      } catch (error) {
        console.warn(`[CachedApiClient] Cache get failed for ${url}:`, error);
      }

      try {
        // Fetch fresh data
        const response = await patch<T>(url, data, axiosConfig);
        
        // Cache the response
        await browserCache.set(key, response, ttl || this.defaultTTL);
        
        return response;
      } catch (error) {
        console.error(`[CachedApiClient] PATCH request failed for ${url}:`, error);
        throw error;
      }
    }

    // No caching, direct request
    return patch<T>(url, data, axiosConfig);
  }

  /**
   * Cached DELETE request
   */
  async delete<T>(
    url: string,
    config?: CachedAxiosRequestConfig & CachedApiOptions
  ): Promise<AxiosResponse<T>> {
    const { ttl, useCache = false, cacheKey, ...axiosConfig } = config || {};
    
    if (useCache && cacheKey) {
      const key = cacheKey;
      
      try {
        // Try to get from cache first
        const cached = await browserCache.get<AxiosResponse<T>>(key);
        if (cached) {
          console.log(`[CachedApiClient] Cache hit for DELETE ${url}`);
          return cached;
        }
      } catch (error) {
        console.warn(`[CachedApiClient] Cache get failed for ${url}:`, error);
      }

      try {
        // Fetch fresh data
        const response = await del<T>(url, axiosConfig);
        
        // Cache the response
        await browserCache.set(key, response, ttl || this.defaultTTL);
        
        return response;
      } catch (error) {
        console.error(`[CachedApiClient] DELETE request failed for ${url}:`, error);
        throw error;
      }
    }

    // No caching, direct request
    return del<T>(url, axiosConfig);
  }

  /**
   * Clear cache for specific URL pattern
   */
  async clearCache(urlPattern?: string): Promise<void> {
    try {
      if (urlPattern) {
        // This is a simplified implementation
        // In a real scenario, you'd need to track keys by URL pattern
        console.log(`[CachedApiClient] Clearing cache for pattern: ${urlPattern}`);
      } else {
        await browserCache.clear();
        console.log('[CachedApiClient] Cleared all cache');
      }
    } catch (error) {
      console.error('[CachedApiClient] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      return await browserCache.getStats();
    } catch (error) {
      console.error('[CachedApiClient] Failed to get cache stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

// Create singleton instance
export const cachedApiClient = new CachedApiClient();

// Export individual methods for convenience
export const cachedGet = cachedApiClient.get.bind(cachedApiClient);
export const cachedPost = cachedApiClient.post.bind(cachedApiClient);
export const cachedPut = cachedApiClient.put.bind(cachedApiClient);
export const cachedPatch = cachedApiClient.patch.bind(cachedApiClient);
export const cachedDelete = cachedApiClient.delete.bind(cachedApiClient);

// Export the class for custom instances
export { CachedApiClient };

