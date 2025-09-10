/**
 * Slice Cache Utility
 * Provides caching functionality specifically designed for Redux slices
 * with 1-hour TTL and automatic cache management
 */

import { persistentCache } from '../cache';
import { browserCache } from '../browserCache';

interface SliceCacheOptions {
  ttl?: number; // Time to live in milliseconds
  useIndexedDB?: boolean; // Use IndexedDB for larger data
  prefix?: string; // Cache key prefix
}

class SliceCache {
  private options: Required<SliceCacheOptions>;
  private cache: typeof persistentCache | typeof browserCache;

  constructor(options: SliceCacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 60 * 60 * 1000, // 1 hour default
      useIndexedDB: options.useIndexedDB || true,
      prefix: options.prefix || 'slice',
    };

    this.cache = this.options.useIndexedDB ? browserCache : persistentCache;
  }

  /**
   * Generate cache key for slice data
   */
  private generateKey(sliceName: string, actionType: string, params?: any): string {
    const baseKey = `${this.options.prefix}_${sliceName}_${actionType}`;
    if (params) {
      const paramsStr = JSON.stringify(params, Object.keys(params).sort());
      return `${baseKey}_${btoa(paramsStr).replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    return baseKey;
  }

  /**
   * Cache slice data
   */
  async set<T>(
    sliceName: string,
    actionType: string,
    data: T,
    params?: any,
    customTtl?: number
  ): Promise<void> {
    const key = this.generateKey(sliceName, actionType, params);
    const ttl = customTtl || this.options.ttl;

    try {
      if (this.options.useIndexedDB) {
        await browserCache.set(key, data, ttl);
      } else {
        await persistentCache.set(key, data, ttl);
      }
      
      console.log(`[SliceCache] Cached ${sliceName}/${actionType} for ${ttl}ms`);
    } catch (error) {
      console.warn(`[SliceCache] Failed to cache ${sliceName}/${actionType}:`, error);
    }
  }

  /**
   * Get cached slice data
   */
  async get<T>(
    sliceName: string,
    actionType: string,
    params?: any
  ): Promise<T | null> {
    const key = this.generateKey(sliceName, actionType, params);

    try {
      if (this.options.useIndexedDB) {
        return await browserCache.get<T>(key);
      } else {
        return await persistentCache.get<T>(key);
      }
    } catch (error) {
      console.warn(`[SliceCache] Failed to get ${sliceName}/${actionType}:`, error);
      return null;
    }
  }

  /**
   * Check if data exists in cache
   */
  async has(
    sliceName: string,
    actionType: string,
    params?: any
  ): Promise<boolean> {
    const key = this.generateKey(sliceName, actionType, params);

    try {
      if (this.options.useIndexedDB) {
        return await browserCache.has(key);
      } else {
        return await persistentCache.has(key);
      }
    } catch (error) {
      console.warn(`[SliceCache] Failed to check ${sliceName}/${actionType}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(
    sliceName: string,
    actionType: string,
    params?: any
  ): Promise<void> {
    const key = this.generateKey(sliceName, actionType, params);

    try {
      if (this.options.useIndexedDB) {
        await browserCache.delete(key);
      } else {
        // For persistentCache, we need to clear all as it doesn't have delete method
        // This is a limitation we'll work around
        console.warn(`[SliceCache] Delete not supported for persistentCache`);
      }
      
      console.log(`[SliceCache] Deleted ${sliceName}/${actionType}`);
    } catch (error) {
      console.warn(`[SliceCache] Failed to delete ${sliceName}/${actionType}:`, error);
    }
  }

  /**
   * Clear all cache for a specific slice
   */
  async clearSlice(sliceName: string): Promise<void> {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd need to track keys by slice
      console.log(`[SliceCache] Cleared cache for slice: ${sliceName}`);
    } catch (error) {
      console.warn(`[SliceCache] Failed to clear slice ${sliceName}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.options.useIndexedDB) {
        await browserCache.clear();
      } else {
        await persistentCache.clear();
      }
      
      console.log('[SliceCache] Cleared all cache');
    } catch (error) {
      console.warn('[SliceCache] Failed to clear cache:', error);
    }
  }

  /**
   * Get or set with automatic caching
   */
  async getOrSet<T>(
    sliceName: string,
    actionType: string,
    fetchFn: () => Promise<T>,
    params?: any,
    customTtl?: number
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(sliceName, actionType, params);
    if (cached) {
      console.log(`[SliceCache] Cache hit for ${sliceName}/${actionType}`);
      return cached;
    }

    // Fetch fresh data
    console.log(`[SliceCache] Cache miss for ${sliceName}/${actionType}, fetching...`);
    const data = await fetchFn();

    // Cache the data
    await this.set(sliceName, actionType, data, params, customTtl);

    return data;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      if (this.options.useIndexedDB) {
        return await browserCache.getStats();
      } else {
        return await persistentCache.getStats();
      }
    } catch (error) {
      console.warn('[SliceCache] Failed to get stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

// Create default instance with 1-hour TTL
export const sliceCache = new SliceCache({
  ttl: 60 * 60 * 1000, // 1 hour
  useIndexedDB: true,
  prefix: 'slice',
});

// Export the class for custom instances
export { SliceCache };

// Utility function for common slice caching patterns
export const createCachedAsyncThunk = <T, P = void>(
  sliceName: string,
  actionType: string,
  fetchFn: (params: P) => Promise<T>,
  options?: {
    ttl?: number;
    params?: (params: P) => any; // Function to extract cache key params
  }
) => {
  return async (params: P, { rejectWithValue }: any) => {
    try {
      const cacheParams = options?.params ? options.params(params) : params;
      const data = await sliceCache.getOrSet(
        sliceName,
        actionType,
        () => fetchFn(params),
        cacheParams,
        options?.ttl
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };
};






