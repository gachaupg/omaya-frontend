/**
 * Cache Usage Examples
 * Demonstrates how to use the new caching system in different scenarios
 */

import { sliceCache } from './sliceCache';
import { browserCache } from '../browserCache';
import { cachedGet } from '../cachedApiClient';

// Example 1: Using sliceCache in a Redux slice
export const exampleSliceUsage = () => {
  // In your slice file:
  /*
  export const fetchUserData = createAsyncThunk(
    "user/fetchUserData",
    async (userId: string, { rejectWithValue }) => {
      try {
        const data = await sliceCache.getOrSet(
          'user',
          'fetchUserData',
          async () => {
            const response = await api.get(`/users/${userId}`);
            return response.data;
          },
          { userId }, // cache key params
          60 * 60 * 1000 // 1 hour cache
        );
        return data;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );
  */
};

// Example 2: Using browserCache directly for large data
export const exampleBrowserCacheUsage = async () => {
  try {
    // Cache large market data
    const marketData = await browserCache.cacheRequest(
      'https://api.example.com/markets',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      60 * 60 * 1000 // 1 hour cache
    );
    
    console.log('Market data:', marketData);
    return marketData;
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    throw error;
  }
};

// Example 3: Using cached API client
export const exampleCachedApiUsage = async () => {
  try {
    // This will automatically cache GET requests
    const response = await cachedGet('/api/assets', {
      timeout: 10000,
      // cache: true is default for GET requests
    });
    
    console.log('Assets data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    throw error;
  }
};

// Example 4: Manual cache management
export const exampleManualCacheManagement = async () => {
  try {
    // Set data manually
    await sliceCache.set(
      'custom',
      'myData',
      { message: 'Hello World' },
      { id: '123' },
      30 * 60 * 1000 // 30 minutes
    );

    // Get data
    const data = await sliceCache.get('custom', 'myData', { id: '123' });
    console.log('Retrieved data:', data);

    // Check if data exists
    const exists = await sliceCache.has('custom', 'myData', { id: '123' });
    console.log('Data exists:', exists);

    // Delete data
    await sliceCache.delete('custom', 'myData', { id: '123' });

    // Get cache statistics
    const stats = await sliceCache.getStats();
    console.log('Cache stats:', stats);
  } catch (error) {
    console.error('Cache management error:', error);
  }
};

// Example 5: Cache invalidation patterns
export const exampleCacheInvalidation = async () => {
  try {
    // Clear all cache for a specific slice
    await sliceCache.clearSlice('user');
    
    // Clear all cache
    await sliceCache.clear();
    
    // Clear browser cache
    await browserCache.clear();
    
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Cache clearing error:', error);
  }
};

// Example 6: Using cache with different TTLs
export const exampleDifferentTTLs = async () => {
  try {
    // Short-term cache (5 minutes)
    const shortTermData = await sliceCache.getOrSet(
      'temp',
      'shortData',
      async () => ({ timestamp: Date.now() }),
      undefined,
      5 * 60 * 1000 // 5 minutes
    );

    // Long-term cache (24 hours)
    const longTermData = await sliceCache.getOrSet(
      'static',
      'longData',
      async () => ({ config: 'static' }),
      undefined,
      24 * 60 * 60 * 1000 // 24 hours
    );

    console.log('Short-term data:', shortTermData);
    console.log('Long-term data:', longTermData);
  } catch (error) {
    console.error('TTL example error:', error);
  }
};






