# OMAYA Exchange Caching System

A comprehensive caching system built with IndexedDB for larger data storage, designed to improve performance and reduce API calls across the OMAYA Exchange frontend.

## Overview

The caching system consists of three main components:

1. **BrowserCache** - IndexedDB-based persistent storage for larger data
2. **SliceCache** - Redux slice-specific caching utility
3. **CachedApiClient** - Enhanced API client with automatic caching

## Features

- ✅ **IndexedDB Storage** - Persistent storage for larger data sets
- ✅ **1-Hour TTL** - Configurable time-to-live for cached data
- ✅ **Automatic Cleanup** - Expired entries are automatically removed
- ✅ **Redux Integration** - Seamless integration with Redux slices
- ✅ **Request Deduplication** - Prevents duplicate API calls
- ✅ **Memory + Persistent** - Hybrid caching approach
- ✅ **TypeScript Support** - Full type safety

## Quick Start

### 1. Using SliceCache in Redux Slices

```typescript
import { sliceCache } from '../../../lib/utils/sliceCache';

export const fetchAssets = createAsyncThunk<AssetsResponse, void>(
  "exchange/fetchAssets",
  async (_, { rejectWithValue }) => {
    try {
      const data = await sliceCache.getOrSet(
        'exchange',
        'fetchAssets',
        async () => {
          const response = await get<AssetsResponse>(endpoint);
          return response.data;
        },
        undefined, // no params
        60 * 60 * 1000 // 1 hour cache
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### 2. Using BrowserCache Directly

```typescript
import { browserCache } from '../lib/browserCache';

// Cache a request with automatic fetching
const marketData = await browserCache.cacheRequest(
  'https://api.example.com/markets',
  { method: 'GET' },
  60 * 60 * 1000 // 1 hour cache
);

// Manual cache operations
await browserCache.set('key', data, ttl);
const data = await browserCache.get('key');
const exists = await browserCache.has('key');
await browserCache.delete('key');
```

### 3. Using CachedApiClient

```typescript
import { cachedGet } from '../lib/cachedApiClient';

// Automatically caches GET requests
const response = await cachedGet('/api/assets', {
  timeout: 10000,
  // cache: true is default for GET requests
});
```

## API Reference

### BrowserCache

The core IndexedDB-based caching system.

#### Methods

- `cacheRequest<T>(url, options, ttl?)` - Cache a fetch request
- `get<T>(key)` - Get cached data
- `set<T>(key, data, ttl?)` - Set cached data
- `has(key)` - Check if key exists and is not expired
- `delete(key)` - Delete cached data
- `clear()` - Clear all cached data
- `getStats()` - Get cache statistics

#### Example

```typescript
import { browserCache } from '../lib/browserCache';

// Cache with 1-hour TTL
const data = await browserCache.cacheRequest(
  'https://api.example.com/data',
  { method: 'GET' },
  60 * 60 * 1000
);
```

### SliceCache

Redux slice-specific caching utility.

#### Methods

- `getOrSet<T>(sliceName, actionType, fetchFn, params?, ttl?)` - Get or set with automatic caching
- `set<T>(sliceName, actionType, data, params?, ttl?)` - Set cached data
- `get<T>(sliceName, actionType, params?)` - Get cached data
- `has(sliceName, actionType, params?)` - Check if data exists
- `delete(sliceName, actionType, params?)` - Delete cached data
- `clearSlice(sliceName)` - Clear all cache for a slice
- `clear()` - Clear all cache
- `getStats()` - Get cache statistics

#### Example

```typescript
import { sliceCache } from '../lib/utils/sliceCache';

// Cache with parameters
const data = await sliceCache.getOrSet(
  'markets',
  'fetchMarkets',
  async () => {
    const response = await fetchMarketData(params);
    return response.data;
  },
  params, // cache key params
  60 * 60 * 1000 // 1 hour cache
);
```

### CachedApiClient

Enhanced API client with automatic caching.

#### Methods

- `get<T>(url, config?)` - Cached GET request
- `post<T>(url, data?, config?)` - POST request (cached if configured)
- `put<T>(url, data?, config?)` - PUT request (cached if configured)
- `patch<T>(url, data?, config?)` - PATCH request (cached if configured)
- `delete<T>(url, config?)` - DELETE request (cached if configured)
- `clearCache(urlPattern?)` - Clear cache
- `getCacheStats()` - Get cache statistics

#### Example

```typescript
import { cachedGet } from '../lib/cachedApiClient';

// Automatically cached GET request
const response = await cachedGet('/api/assets', {
  timeout: 10000,
  // cache: true is default for GET requests
});
```

## Configuration

### Default Settings

- **TTL**: 1 hour (60 * 60 * 1000 ms)
- **Storage**: IndexedDB for data > 1KB, memory for smaller data
- **Auto Cleanup**: Enabled
- **Max Entries**: 1000

### Custom Configuration

```typescript
import { BrowserCache } from '../lib/browserCache';
import { SliceCache } from '../lib/utils/sliceCache';

// Custom BrowserCache instance
const customCache = new BrowserCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 500,
  autoCleanup: true,
});

// Custom SliceCache instance
const customSliceCache = new SliceCache({
  ttl: 2 * 60 * 60 * 1000, // 2 hours
  useIndexedDB: true,
  prefix: 'custom',
});
```

## Integration with Existing Code

### 1. Update Redux Slices

Replace direct API calls with cached versions:

```typescript
// Before
export const fetchData = createAsyncThunk(
  "slice/fetchData",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/endpoint', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// After
export const fetchData = createAsyncThunk(
  "slice/fetchData",
  async (params, { rejectWithValue }) => {
    try {
      const data = await sliceCache.getOrSet(
        'slice',
        'fetchData',
        async () => {
          const response = await api.get('/endpoint', { params });
          return response.data;
        },
        params,
        60 * 60 * 1000 // 1 hour cache
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### 2. Update API Calls

Use the cached API client for automatic caching:

```typescript
// Before
import { get } from '../lib/apiClient';

const response = await get('/api/data');

// After
import { cachedGet } from '../lib/cachedApiClient';

const response = await cachedGet('/api/data');
```

## Best Practices

### 1. Cache Strategy

- **Cache GET requests** - Safe to cache, improves performance
- **Don't cache POST/PUT/PATCH** - Usually not safe to cache
- **Use appropriate TTL** - Balance between freshness and performance
- **Cache at the right level** - Slice level for Redux, API level for direct calls

### 2. Cache Key Management

- Use descriptive slice names and action types
- Include parameters in cache keys when relevant
- Avoid overly specific cache keys that prevent reuse

### 3. Error Handling

- Always handle cache failures gracefully
- Fall back to direct API calls if cache fails
- Log cache errors for debugging

### 4. Memory Management

- Use IndexedDB for larger data sets
- Set appropriate TTL to prevent memory bloat
- Clear cache when appropriate (logout, etc.)

## Performance Benefits

- **Reduced API Calls** - Cached data eliminates redundant requests
- **Faster Load Times** - Cached data loads instantly
- **Better UX** - Users see data immediately
- **Reduced Server Load** - Fewer API requests to backend
- **Offline Resilience** - Cached data available when offline

## Monitoring and Debugging

### Cache Statistics

```typescript
// Get cache statistics
const stats = await sliceCache.getStats();
console.log('Cache stats:', stats);

// Get browser cache stats
const browserStats = await browserCache.getStats();
console.log('Browser cache stats:', browserStats);
```

### Debug Logging

The caching system includes comprehensive logging:

- Cache hits/misses
- Cache operations (set, get, delete)
- Error handling
- Performance metrics

### Cache Inspection

You can inspect the IndexedDB cache in browser dev tools:

1. Open DevTools
2. Go to Application tab
3. Expand IndexedDB
4. Look for `OMAYA_CACHE_DB`

## Migration Guide

### From Existing Cache

If you're migrating from the existing cache system:

1. Replace `cache.getOrSet()` calls with `sliceCache.getOrSet()`
2. Update import statements
3. Test thoroughly to ensure data consistency

### Gradual Migration

You can migrate gradually:

1. Start with new features using the new cache system
2. Update existing slices one by one
3. Monitor performance and fix any issues
4. Complete migration when confident

## Troubleshooting

### Common Issues

1. **Cache not working** - Check if IndexedDB is supported
2. **Data not updating** - Check TTL settings and cache invalidation
3. **Memory issues** - Check cache size and cleanup settings
4. **Type errors** - Ensure proper TypeScript types

### Debug Steps

1. Check browser console for cache logs
2. Inspect IndexedDB in DevTools
3. Verify cache keys are consistent
4. Test with different TTL values

## Future Enhancements

- [ ] Cache compression for larger data
- [ ] Cache warming strategies
- [ ] Advanced cache invalidation patterns
- [ ] Cache analytics and monitoring
- [ ] Service Worker integration
- [ ] Cache synchronization across tabs

## Support

For questions or issues with the caching system:

1. Check this documentation
2. Review the example code in `lib/utils/cacheExample.ts`
3. Check browser console for error messages
4. Contact the development team

