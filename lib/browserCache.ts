/**
 * BrowserCache - IndexedDB-based caching system for larger data
 * Provides persistent storage with TTL support and automatic cleanup
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  autoCleanup?: boolean; // Auto cleanup expired entries
}

class BrowserCache {
  private dbName = 'OMAYA_CACHE_DB';
  private dbVersion = 1;
  private storeName = 'cache_store';
  private db: IDBDatabase | null = null;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 60 * 60 * 1000, // 1 hour default
      maxSize: options.maxSize || 1000,
      autoCleanup: options.autoCleanup !== false,
    };
  }

  /**
   * Initialize IndexedDB connection
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key from URL and options
   */
  private generateCacheKey(url: string, options: any = {}): string {
    const optionsStr = JSON.stringify(options, Object.keys(options).sort());
    return `cache_${btoa(url + optionsStr).replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Clean up expired entries
   */
  private async cleanupExpired(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp');
    const request = index.openCursor();

    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry<any>;
          if (this.isExpired(entry)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Cache a request with automatic fetching
   */
  async cacheRequest<T>(
    url: string, 
    options: RequestInit = {},
    customTtl?: number
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(url, options);
    const ttl = customTtl || this.options.ttl;

    try {
      // Try to get from cache first
      const cached = await this.get<T>(cacheKey);
      if (cached) {
        console.log(`[BrowserCache] Cache hit for ${url}`);
        return cached;
      }

      // Fetch fresh data
      console.log(`[BrowserCache] Cache miss for ${url}, fetching...`);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the data
      await this.set(cacheKey, data, ttl);

      // Auto cleanup if enabled
      if (this.options.autoCleanup) {
        this.cleanupExpired().catch(console.error);
      }

      return data;
    } catch (error) {
      console.error(`[BrowserCache] Fetch failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const entry = request.result as CacheEntry<T> | undefined;
          
          if (!entry) {
            resolve(null);
            return;
          }

          if (this.isExpired(entry)) {
            // Delete expired entry
            this.delete(key).catch(console.error);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };

        request.onerror = () => {
          console.error(`[BrowserCache] Failed to get ${key}:`, request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error(`[BrowserCache] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.options.ttl,
        key,
      };

      const request = store.put(entry);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`[BrowserCache] Cached ${key} with TTL ${entry.ttl}ms`);
          resolve();
        };

        request.onerror = () => {
          console.error(`[BrowserCache] Failed to set ${key}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`[BrowserCache] Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`[BrowserCache] Deleted ${key}`);
          resolve();
        };

        request.onerror = () => {
          console.error(`[BrowserCache] Failed to delete ${key}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`[BrowserCache] Error deleting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('[BrowserCache] Cleared all cache entries');
          resolve();
        };

        request.onerror = () => {
          console.error('[BrowserCache] Failed to clear cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[BrowserCache] Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ totalEntries: number; totalSize: number }> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          resolve({
            totalEntries: request.result,
            totalSize: 0, // Would need to calculate actual size
          });
        };

        request.onerror = () => {
          resolve({ totalEntries: 0, totalSize: 0 });
        };
      });
    } catch (error) {
      console.error('[BrowserCache] Error getting stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }

  /**
   * Get or set with deduplication (similar to existing cache)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fetch and cache
    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }
}

// Create singleton instance
export const browserCache = new BrowserCache({
  ttl: 60 * 60 * 1000, // 1 hour default
  maxSize: 1000,
  autoCleanup: true,
});

// Export the class for custom instances
export { BrowserCache };

// Utility function for common use cases
export const cacheRequest = <T>(
  url: string,
  options: RequestInit = {},
  ttl?: number
): Promise<T> => {
  return browserCache.cacheRequest<T>(url, options, ttl);
};
