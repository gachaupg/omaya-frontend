/**
 * Asset Manager
 * Centralized asset fetching and caching to prevent redundant API calls
 */

import { sliceCache } from './sliceCache';
import { getSupportedAssets } from '../../features/swap/api';
import { EXCHANGE_ENDPOINTS } from '../../features/exchange/api';
import { cachedGet } from '../cachedApiClient';

interface AssetManagerOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

class AssetManager {
  private static instance: AssetManager;
  private pendingRequests = new Map<string, Promise<any>>();

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Get swap assets with intelligent caching
   */
  async getSwapAssets(options: AssetManagerOptions = {}): Promise<any[]> {
    const { ttl = 2 * 60 * 60 * 1000, forceRefresh = false } = options;
    const cacheKey = 'swap_assets_global';

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log('[AssetManager] Deduplicating swap assets request');
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create request promise
    const requestPromise = this.fetchSwapAssets(ttl, forceRefresh);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get exchange assets with intelligent caching
   */
  async getExchangeAssets(options: AssetManagerOptions = {}): Promise<any> {
    const { ttl = 2 * 60 * 60 * 1000, forceRefresh = false } = options;
    const cacheKey = 'exchange_assets_global';

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log('[AssetManager] Deduplicating exchange assets request');
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create request promise
    const requestPromise = this.fetchExchangeAssets(ttl, forceRefresh);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch swap assets with caching
   */
  private async fetchSwapAssets(ttl: number, forceRefresh: boolean): Promise<any[]> {
    if (!forceRefresh) {
      // Try to get from cache first
      const cached = await sliceCache.get<any[]>('swap', 'fetchSupportedAssets');
      if (cached) {
        console.log('[AssetManager] Cache hit for swap assets');
        return cached;
      }
    }

    console.log('[AssetManager] Cache miss for swap assets, fetching...');
    const assets = await getSupportedAssets();
    
    // Cache the result
    await sliceCache.set('swap', 'fetchSupportedAssets', assets, undefined, ttl);
    
    return assets;
  }

  /**
   * Fetch exchange assets with caching
   */
  private async fetchExchangeAssets(ttl: number, forceRefresh: boolean): Promise<any> {
    if (!forceRefresh) {
      // Try to get from cache first
      const cached = await sliceCache.get<any>('exchange', 'fetchAssets');
      if (cached) {
        console.log('[AssetManager] Cache hit for exchange assets');
        return cached;
      }
    }

    console.log('[AssetManager] Cache miss for exchange assets, fetching...');
    const response = await cachedGet(EXCHANGE_ENDPOINTS.ASSETS, {
      timeout: 10000,
      ttl: ttl,
      cache: true
    });
    
    const assets = response.data;
    
    // Cache the result
    await sliceCache.set('exchange', 'fetchAssets', assets, undefined, ttl);
    
    return assets;
  }

  /**
   * Clear all asset caches
   */
  async clearAssetCaches(): Promise<void> {
    await sliceCache.delete('swap', 'fetchSupportedAssets');
    await sliceCache.delete('exchange', 'fetchAssets');
    console.log('[AssetManager] Cleared all asset caches');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return await sliceCache.getStats();
  }
}

// Export singleton instance
export const assetManager = AssetManager.getInstance();

// Export convenience functions
export const getSwapAssets = (options?: AssetManagerOptions) => 
  assetManager.getSwapAssets(options);

export const getExchangeAssets = (options?: AssetManagerOptions) => 
  assetManager.getExchangeAssets(options);

export const clearAssetCaches = () => 
  assetManager.clearAssetCaches();

export const getAssetCacheStats = () => 
  assetManager.getCacheStats();
