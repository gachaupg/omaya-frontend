# Production Readiness - Implementation Plan

**Date**: October 20, 2025  
**Project**: Omaya Technology Platform

This document provides specific, actionable implementation steps for fixing critical issues identified in the audit.

---

## Priority 1: CRITICAL FIXES (Block Production) - Days 1-5

### Fix 1.1: Token Refresh Mutex Implementation

**Issue**: Race conditions in token refresh causing premature logouts  
**Files to Modify**: `lib/utils/tokenRefresh.ts`, `lib/apiClient.ts`  
**Estimated Time**: 4-6 hours

#### Implementation Steps

**Step 1**: Create Token Refresh Mutex

Create new file: `lib/utils/tokenRefreshMutex.ts`

```typescript
/**
 * tokenRefreshMutex.ts - Ensures only one token refresh happens at a time
 */
class TokenRefreshMutex {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private subscribers: Array<(token: string | null) => void> = [];

  async acquireRefresh(
    refreshFn: () => Promise<string | null>
  ): Promise<string | null> {
    // If already refreshing, wait for that refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      console.log("[TokenMutex] Refresh in progress, waiting...");
      return this.refreshPromise;
    }

    // Start new refresh
    this.isRefreshing = true;
    this.refreshPromise = this.executeRefresh(refreshFn);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(
    refreshFn: () => Promise<string | null>
  ): Promise<string | null> {
    try {
      console.log("[TokenMutex] Executing token refresh");
      const newToken = await refreshFn();
      console.log("[TokenMutex] Token refresh successful");

      // Notify all subscribers
      this.notifySubscribers(newToken);

      return newToken;
    } catch (error) {
      console.error("[TokenMutex] Token refresh failed", error);
      this.notifySubscribers(null);
      throw error;
    }
  }

  private notifySubscribers(token: string | null) {
    this.subscribers.forEach((callback) => callback(token));
    this.subscribers = [];
  }

  waitForRefresh(callback: (token: string | null) => void) {
    if (this.isRefreshing && this.refreshPromise) {
      this.subscribers.push(callback);
    }
  }

  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }
}

// Singleton instance
export const tokenRefreshMutex = new TokenRefreshMutex();
```

**Step 2**: Update `lib/utils/tokenRefresh.ts`

```typescript
import { tokenRefreshMutex } from "./tokenRefreshMutex";

export const refreshAccessToken = async (): Promise<string | null> => {
  // Use mutex to ensure only one refresh at a time
  return tokenRefreshMutex.acquireRefresh(async () => {
    try {
      const profile = storage.getProfile();

      if (!profile?.tokens?.refresh) {
        logger.warn("No refresh token available");
        return null;
      }

      logger.info("Attempting to refresh access token");

      const response = await axios.post(
        `${API_BASE_URL}/api/token/refresh/`,
        { refresh: profile.tokens.refresh },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { access, refresh } = response.data;
      logger.info("Access token refreshed successfully");

      const updatedProfile = {
        ...profile,
        tokens: {
          access,
          refresh: refresh || profile.tokens.refresh,
        },
      };

      storage.setProfile(updatedProfile);
      cookieUtils.setCookie("access_token", access, {
        maxAge: 86400,
        secure: true,
        sameSite: "strict",
      });

      if (storeDispatch && refreshTokensAction) {
        storeDispatch(
          refreshTokensAction({
            access,
            refresh: refresh || undefined,
          })
        );
      }

      // Broadcast to other tabs
      window.dispatchEvent(
        new CustomEvent("tokenRefreshed", {
          detail: { access, refresh },
        })
      );

      return access;
    } catch (error: any) {
      logger.error("Token refresh failed", error);
      storage.removeProfile();
      cookieUtils.removeCookie("access_token");

      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }

      return null;
    }
  });
};

// Reduce expiry buffer from 5 minutes to 2 minutes
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Consider token expired if it expires in less than 2 minutes (reduced from 5)
    return timeUntilExpiry < 2 * 60 * 1000;
  } catch (error) {
    logger.error("Error checking token expiration", error);
    return true;
  }
};
```

**Step 3**: Update `lib/apiClient.ts` Interceptor

```typescript
const addRefreshTokenInterceptor = (instance: AxiosInstance): AxiosInstance => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      const profile = storage.getProfile();

      if (
        error.response?.status === 401 &&
        profile?.tokens?.refresh &&
        originalRequest &&
        !(originalRequest as any)._retry
      ) {
        (originalRequest as any)._retry = true;

        try {
          // Use mutex-protected refresh
          const newAccessToken = await refreshAccessToken();

          if (!newAccessToken) {
            throw new Error("Token refresh returned null");
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Mutex already handled cleanup, just reject
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
  return instance;
};
```

**Step 4**: Disable or Adjust Proactive Refresh

Update `hooks/useTokenRefresh.ts`:

```typescript
// Increase interval from 2 minutes to 5 minutes to reduce conflicts
const interval = setInterval(
  () => {
    if (isAuthenticated && tokens?.access) {
      // Check before refreshing (mutex will handle if already refreshing)
      proactiveTokenRefresh().catch(console.error);
    }
  },
  5 * 60 * 1000
); // Changed from 2 minutes to 5 minutes
```

**Testing Checklist**:

- [ ] Open 5 tabs, let token expire, verify only 1 refresh call
- [ ] Make 10 concurrent API calls with expired token, verify 1 refresh
- [ ] Verify no duplicate refresh calls in Network tab
- [ ] Verify all tabs get updated token after refresh
- [ ] Verify proactive refresh doesn't conflict with interceptor refresh

---

### Fix 1.2: Cross-Tab Token Synchronization

**Issue**: Token refresh in one tab doesn't update other tabs  
**Files to Modify**: `features/auth/utils/storage.ts`, `lib/utils/tokenRefresh.ts`  
**Estimated Time**: 2-3 hours

#### Implementation Steps

**Step 1**: Add Storage Event Listener

Create new file: `lib/utils/crossTabSync.ts`

```typescript
/**
 * crossTabSync.ts - Synchronize authentication state across tabs
 */
import { storage } from "@/features/auth/utils/storage";
import { store } from "@/store";
import { initializeAuth, logout } from "@/features/auth/slices/authSlice";

export const initializeCrossTabSync = () => {
  if (typeof window === "undefined") return;

  // Listen for storage changes from other tabs
  window.addEventListener("storage", (event) => {
    if (event.key === "profile") {
      if (event.newValue) {
        // Profile updated in another tab, refresh our state
        console.log("[CrossTabSync] Profile updated in another tab");
        store.dispatch(initializeAuth());
      } else {
        // Profile cleared in another tab (logout)
        console.log("[CrossTabSync] Logout detected in another tab");
        store.dispatch(logout());
      }
    }
  });

  // Listen for custom token refresh events
  window.addEventListener("tokenRefreshed", ((event: CustomEvent) => {
    console.log("[CrossTabSync] Token refreshed in another tab");
    store.dispatch(initializeAuth());
  }) as EventListener);
};
```

**Step 2**: Initialize in App Layout

Update `app/layout.tsx` or `app/providers.tsx`:

```typescript
import { initializeCrossTabSync } from "@/lib/utils/crossTabSync";

useEffect(() => {
  initializeCrossTabSync();
}, []);
```

**Testing Checklist**:

- [ ] Open Tab A and Tab B
- [ ] Refresh token in Tab A
- [ ] Verify Tab B updates automatically (check Redux state)
- [ ] Logout in Tab A
- [ ] Verify Tab B also logs out

---

### Fix 1.3: Re-enable Redux Checks (with Exceptions)

**Issue**: Immutability and serializability checks disabled  
**Files to Modify**: `store/index.ts`, all slices with non-serializable data  
**Estimated Time**: 8-12 hours (requires auditing all slices)

#### Implementation Steps

**Step 1**: Audit for Non-Serializable Data

Search for non-serializable values in Redux state:

- File objects
- Date objects
- Functions
- Class instances
- Promises

**Common culprits**:

```typescript
// In slices - look for:
kyc_images: File[]  // ❌ Files not serializable
timestamp: Date     // ❌ Dates not serializable
callback: () => void // ❌ Functions not serializable
```

**Step 2**: Extract Non-Serializable Data

For File uploads:

```typescript
// Before: Store files in Redux
state.kyc_images = action.payload.files;

// After: Store file metadata only
state.kyc_images = action.payload.files.map((f) => ({
  name: f.name,
  size: f.size,
  type: f.type,
  // Store actual File in component state or FormData directly
}));
```

For Dates:

```typescript
// Before: Store Date objects
state.timestamp = new Date();

// After: Store ISO strings
state.timestamp = new Date().toISOString();

// When using:
const date = new Date(state.timestamp);
```

**Step 3**: Re-enable Checks with Exceptions

Update `store/index.ts`:

```typescript
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific action types that handle FormData
        ignoredActions: ["kyc/verify/pending", "p2p/uploadProof/pending"],
        // Ignore specific paths in state
        ignoredPaths: ["form.fileInputRef"],
      },
      immutableCheck: {
        // Enable in development only (performance overhead)
        enabled: process.env.NODE_ENV === "development",
      },
    }),
});
```

**Step 4**: Test Each Feature

- [ ] Login/Register flow
- [ ] KYC verification (file uploads)
- [ ] P2P deposit proof upload
- [ ] All form submissions
- [ ] Check console for Redux errors

---

### Fix 1.4: Implement Request Deduplication

**Issue**: Multiple identical API calls  
**Files to Modify**: `lib/apiClient.ts`  
**Estimated Time**: 3-4 hours

#### Implementation Steps

**Step 1**: Add Deduplication Layer

Update `lib/apiClient.ts`:

```typescript
// Add after imports
const pendingRequests = new Map<string, Promise<any>>();

function generateRequestKey(config: AxiosRequestConfig): string {
  const { method, url, params, data } = config;
  return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
}

function addDeduplicationInterceptor(instance: AxiosInstance): AxiosInstance {
  // Request interceptor
  instance.interceptors.request.use((config) => {
    const key = generateRequestKey(config);

    // Only deduplicate GET requests
    if (config.method?.toLowerCase() === "get") {
      if (pendingRequests.has(key)) {
        logger.debug("Deduplicating request", { key });
        // Return the existing pending request
        return Promise.reject({
          __DEDUPLICATED__: true,
          promise: pendingRequests.get(key),
        });
      }
    }

    return config;
  });

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      const key = generateRequestKey(response.config);
      pendingRequests.delete(key);
      return response;
    },
    (error) => {
      if (error.__DEDUPLICATED__) {
        // This was a deduplicated request, return the original promise
        return error.promise;
      }

      const key = generateRequestKey(error.config);
      pendingRequests.delete(key);
      return Promise.reject(error);
    }
  );

  return instance;
}

// Update createApiClient
const createApiClient = (): AxiosInstance => {
  const instance = createAxiosInstance();
  const withAuth = addAuthInterceptor(instance);
  const withRefresh = addRefreshTokenInterceptor(withAuth);
  const withRetry = addRetryInterceptor(withRefresh, DEFAULT_CONFIG);
  const withDedup = addDeduplicationInterceptor(withRetry); // Add this
  return withDedup;
};
```

**Testing**:

- [ ] Dashboard loads, check Network tab for duplicate calls
- [ ] P2P market page, verify no duplicate asset fetches
- [ ] Measure: Before and after duplicate call count

---

## Priority 2: HIGH PRIORITY FIXES - Days 6-10

### Fix 2.1: Implement Redux Selector Memoization

**Files to Modify**: All `features/*/slices/*.ts`  
**Estimated Time**: 6-8 hours

#### Implementation Pattern

**Before**:

```typescript
export const selectTransactionSummary = (state: RootState) =>
  state.transactionSummary.data;
```

**After**:

```typescript
import { createSelector } from "@reduxjs/toolkit";

export const selectTransactionSummaryState = (state: RootState) =>
  state.transactionSummary;

export const selectTransactionSummary = createSelector(
  [selectTransactionSummaryState],
  (transactionSummary) => transactionSummary.data
);

export const selectTransactionLoading = createSelector(
  [selectTransactionSummaryState],
  (transactionSummary) => transactionSummary.loading
);

export const selectTransactionError = createSelector(
  [selectTransactionSummaryState],
  (transactionSummary) => transactionSummary.error
);
```

#### Files to Update (Priority Order)

1. `features/auth/slices/authSlice.ts`
2. `features/p2p/slices/orderSlice.ts`
3. `features/p2p/slices/walletSlice.ts`
4. `features/p2p/slices/matchedTradesSlice.ts`
5. `features/exchange/slices/exchangeSlice.ts`
6. `features/swap/slices/swapSlice.ts`
7. All other slices

#### Testing

Use React DevTools Profiler:

- [ ] Before: Record dashboard load, note render count
- [ ] After: Same test, verify reduced renders
- [ ] Benchmark: aim for 30-50% reduction in renders

---

### Fix 2.2: Add React.memo to Heavy Components

**Files to Modify**: High-render-frequency components  
**Estimated Time**: 4-6 hours

#### Components to Memoize (Priority Order)

1. **`features/p2p/components/tabs/Market.tsx`** - Market order rows
2. **`features/exchange/components/TransactionHistoryTable/TransactionRow.tsx`**
3. **`components/dashboard/ui/Transactions.tsx`**
4. **`features/p2p/components/Common/Table.tsx`** - Table rows
5. **`components/charts/*`** - All chart components

#### Implementation Pattern

**Before**:

```typescript
const TransactionRow = ({ transaction }: Props) => {
  return <tr>...</tr>;
};
```

**After**:

```typescript
const TransactionRow = React.memo(({ transaction }: Props) => {
  return <tr>...</tr>;
}, (prevProps, nextProps) => {
  // Custom comparison for better control
  return prevProps.transaction.id === nextProps.transaction.id &&
         prevProps.transaction.status === nextProps.transaction.status;
});
```

---

### Fix 2.3: Optimize P2P Dashboard Waterfalls

**File to Modify**: `features/p2p/components/tabs/P2PDashboard.tsx:28-34`  
**Estimated Time**: 1 hour

**Before**:

```typescript
useEffect(() => {
  if (isAuthenticated) {
    dispatch(fetchWallets());
    dispatch(fetchMatchedTrades(1));
    dispatch(fetchTransactionSummary());
  }
}, [dispatch, isAuthenticated]);
```

**After**:

```typescript
useEffect(() => {
  if (isAuthenticated) {
    // Parallel dispatch
    Promise.all([
      dispatch(fetchWallets()),
      dispatch(fetchMatchedTrades(1)),
      dispatch(fetchTransactionSummary()),
    ]).catch((error) => {
      logger.error("Failed to load P2P dashboard data", error);
    });
  }
}, [dispatch, isAuthenticated]);
```

---

## Priority 3: MEDIUM PRIORITY - Days 11-15

### Fix 3.1: Remove Console.log Statements

**Files**: All source files  
**Estimated Time**: 4-6 hours

#### Automated Approach

Create script: `scripts/remove-console-logs.sh`

```bash
#!/bin/bash

# Find all console.log and replace with logger.debug
find features -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/console\.log/logger.debug/g' {} +

# Find all console.error and replace with logger.error
find features -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/console\.error/logger.error/g' {} +

echo "Console statements replaced with logger"
```

#### Manual Review Required

Some console.logs may be intentional debugging that should stay (gated by NODE_ENV). Review each file.

---

### Fix 3.2: Next.js Production Config

**File to Modify**: `next.config.ts`  
**Estimated Time**: 1 hour

```typescript
const nextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // Keep error and warn
          }
        : false,
  },
  // ... rest of config
};
```

---

## Testing & Validation Plan

### Performance Testing

**Before implementing fixes**:

1. Record baseline metrics:
   - Dashboard load time
   - Time to Interactive (TTI)
   - Largest Contentful Paint (LCP)
   - API call count on dashboard mount
   - Token refresh success rate

**After each fix**: 2. Re-measure and compare 3. Document improvements

### Load Testing Script

Create `scripts/performance-test.ts`:

```typescript
// Use Playwright to measure performance
import { chromium } from "@playwright/test";

async function measurePerformance() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Start performance measurement
  await page.goto("http://localhost:3000/dashboard");

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    return {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.fetchStart,
      timeToInteractive: navigation.domInteractive - navigation.fetchStart,
    };
  });

  console.log("Performance Metrics:", metrics);
  await browser.close();
}

measurePerformance();
```

---

## Rollout Strategy

### Phase 1: Critical Fixes (Week 1)

- Token refresh mutex
- Cross-tab sync
- Request deduplication
- Deploy to staging
- Monitor for 2-3 days

### Phase 2: Performance Fixes (Week 2)

- Redux selectors
- React.memo
- Parallel API calls
- Deploy to staging
- Run load tests

### Phase 3: Cleanup (Week 3)

- Console.log removal
- Redux checks re-enabled
- Final testing
- Deploy to production

### Phase 4: Monitoring (Week 4)

- Track metrics
- User feedback
- Bug fixes
- Performance tuning

---

## Success Metrics

### Target Improvements

| Metric                 | Baseline | Target | Method           |
| ---------------------- | -------- | ------ | ---------------- |
| Token refresh failures | ~10-20%  | < 1%   | Error monitoring |
| Dashboard load time    | ~3-4s    | < 2s   | Lighthouse       |
| API calls on mount     | 15-20    | < 10   | Network tab      |
| Component renders      | ~500     | < 250  | React DevTools   |
| Console.log count      | 600-800  | 0      | Search codebase  |

---

## Risk Mitigation

### Rollback Plan

For each fix:

1. Create feature flag
2. Deploy behind flag (disabled)
3. Enable for 10% of users
4. Monitor error rates
5. Gradually increase to 100%

### Monitoring

Set up alerts for:

- Token refresh failure rate > 5%
- API error rate increase > 20%
- Page load time > 3s
- WebSocket connection failures

---

**Plan Author**: AI Production Auditor  
**Last Updated**: October 20, 2025  
**Next Review**: After Phase 1 completion
