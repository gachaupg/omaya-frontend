// lib/cache.ts
// Enhanced cache system with IndexedDB support for larger data

import { browserCache } from './browserCache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  useIndexedDB?: boolean; // Use IndexedDB for larger data
  ttl?: number; // Time to live in milliseconds
}

class EnhancedCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      useIndexedDB: options.useIndexedDB || false,
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
    };
  }

  set<T>(key: string, data: T, ttl: number = this.options.ttl): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Always store in memory cache for fast access
    this.memoryCache.set(key, entry);

    // Also store in IndexedDB if enabled and data is large
    if (this.options.useIndexedDB && this.shouldUseIndexedDB(data)) {
      browserCache.set(key, data, ttl).catch(console.error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // If using IndexedDB, check there
    if (this.options.useIndexedDB) {
      try {
        const indexedData = await browserCache.get<T>(key);
        if (indexedData) {
          // Update memory cache
          this.memoryCache.set(key, {
            data: indexedData,
            timestamp: Date.now(),
            ttl: this.options.ttl,
          });
          return indexedData;
        }
      } catch (error) {
        console.warn(`[EnhancedCache] IndexedDB get failed for ${key}:`, error);
      }
    }

    return null;
  }

  // Get or set with deduplication
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = this.options.ttl
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Check if there's already a pending request
    if (this.pendingRequests.has(key)) {
      console.log(`[EnhancedCache] Deduplicating request for ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const request = fetchFn().then(async data => {
      await this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.pendingRequests.clear();
    
    if (this.options.useIndexedDB) {
      try {
        await browserCache.clear();
      } catch (error) {
        console.warn('[EnhancedCache] Failed to clear IndexedDB cache:', error);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return true;
    }

    if (this.options.useIndexedDB) {
      try {
        return await browserCache.has(key);
      } catch (error) {
        console.warn(`[EnhancedCache] IndexedDB has check failed for ${key}:`, error);
      }
    }

    return false;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private shouldUseIndexedDB(data: any): boolean {
    // Use IndexedDB for larger data (rough estimate)
    const dataSize = JSON.stringify(data).length;
    return dataSize > 1024; // 1KB threshold
  }

  // Method to switch to IndexedDB mode
  enableIndexedDB(): void {
    this.options.useIndexedDB = true;
  }

  // Method to get cache statistics
  async getStats(): Promise<{ memoryEntries: number; indexedDBStats: any }> {
    const indexedDBStats = this.options.useIndexedDB 
      ? await browserCache.getStats() 
      : { totalEntries: 0, totalSize: 0 };

    return {
      memoryEntries: this.memoryCache.size,
      indexedDBStats,
    };
  }
}

// Create instances for different use cases
export const cache = new EnhancedCache(); // Default memory cache
export const persistentCache = new EnhancedCache({ 
  useIndexedDB: true, 
  ttl: 60 * 60 * 1000 // 1 hour for persistent cache
});

// Legacy export for backward compatibility
export { browserCache };
