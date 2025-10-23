# Navigation Performance Fix - Implementation Plan

**Date**: October 20, 2025  
**Goal**: Fix 2.5-3.5 second navigation delays → Target < 0.8 seconds  
**Approach**: Careful, incremental fixes without breaking existing functionality

---

## 🎯 Implementation Order (Safe & Incremental)

### Phase 1: Quick Win - Fix Math.random() Key (30 min)

- **Impact**: 40-50% improvement immediately
- **Risk**: Very low
- **Files**: 1 file, 1 line change

### Phase 2: Centralize P2P Data Fetching (1-2 hours)

- **Impact**: 30-40% additional improvement
- **Risk**: Low (additive, doesn't remove existing code yet)
- **Files**: 1 new file, minor changes to existing

### Phase 3: Remove Duplicate Fetches (30 min)

- **Impact**: Clean up after Phase 2 works
- **Risk**: Very low (only after verifying Phase 2)
- **Files**: 3 files, remove duplicate useEffect blocks

### Phase 4: Make API Calls Parallel (15 min per feature)

- **Impact**: 3x faster API loading
- **Risk**: Very low (wrapper change only)
- **Files**: Multiple data providers

---

## 📝 Detailed Implementation Steps

### STEP 1: Fix Math.random() Key ⚡ (DO THIS FIRST!)

**File**: `app/dashboard/layout.tsx`

**Current Code** (line 42):

```typescript
key={Math.random()} // This destroys performance!
```

**New Code**:

```typescript
key = { pathname }; // Use route path for proper React reconciliation
```

**Need to import pathname**:

```typescript
import { usePathname } from "next/navigation";

// Inside component:
const pathname = usePathname();
```

**Full change needed**:

- Add import at top
- Add usePathname hook
- Change key prop

**Testing**:

- Navigate between pages
- Verify animation still works
- Verify no console errors
- Check Network tab - should see immediate improvement

---

### STEP 2: Create P2P Data Provider (Centralized Fetching)

**New File**: `features/p2p/components/P2PDataProvider.tsx`

**Purpose**: Single source of data fetching for all P2P components

**Code**:

```typescript
"use client";
import { useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchWallets } from '../slices/walletSlice';
import { fetchMatchedTrades } from '../slices/matchedTradesSlice';
import { fetchTransactionSummary } from '../slices/transactionSummarySlice';

interface P2PDataProviderProps {
  children: ReactNode;
}

export const P2PDataProvider = ({ children }: P2PDataProviderProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Check if data is already loaded to avoid unnecessary refetches
  const { data: walletsData } = useSelector((state: RootState) => state.wallets);
  const { data: tradesData } = useSelector((state: RootState) => state.matchedTrades);
  const transactionSummary = useSelector((state: RootState) => state.transactionSummary);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Only fetch if we don't have data (prevents refetch on tab switches)
    const needsData = !walletsData || !tradesData || !transactionSummary.data;

    if (needsData) {
      console.log('[P2PDataProvider] Fetching P2P data...');

      // Parallel API calls for maximum speed
      Promise.all([
        dispatch(fetchWallets()),
        dispatch(fetchMatchedTrades(1)),
        dispatch(fetchTransactionSummary())
      ]).then(() => {
        console.log('[P2PDataProvider] All P2P data loaded');
      }).catch((error) => {
        console.error('[P2PDataProvider] Error loading P2P data:', error);
      });
    }
  }, [isAuthenticated, dispatch]);

  return <>{children}</>;
};
```

**Why This Works**:

- Fetches data ONCE at parent level
- All child components get data from Redux
- Checks if data exists before fetching
- Uses parallel Promise.all for speed
- Doesn't break existing code (additive only)

---

### STEP 3: Wrap P2PLayout with Data Provider

**File**: `features/p2p/components/P2PLayout.tsx`

**Add Import**:

```typescript
import { P2PDataProvider } from "./P2PDataProvider";
```

**Wrap Return Statement**:

```typescript
return (
  <P2PDataProvider>
    <div className="dark:bg-[#18181D] bg-[#EEF1F4] w-full min-h-screen">
      <Tabs tabs={p2pTabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="pl-4 pt-0 mb-4 flex flex-col gap-4 rounded-lg w-full">
        {renderTabContent()}
      </div>
    </div>
  </P2PDataProvider>
);
```

**Testing After This Step**:

- Navigate to P2P page
- Check console for "[P2PDataProvider] Fetching P2P data..."
- Verify data loads correctly
- Check Network tab - should see parallel API calls
- **Keep existing child component fetches for now** (safety)

---

### STEP 4: Remove Duplicate Fetches (Only After Step 3 Works!)

**Files to Modify**:

#### 4A: `features/p2p/components/tabs/P2PDashboard.tsx`

**Remove These Lines** (28-34):

```typescript
// ❌ REMOVE THIS ENTIRE useEffect
useEffect(() => {
  if (isAuthenticated) {
    dispatch(fetchWallets());
    dispatch(fetchMatchedTrades(1));
    dispatch(fetchTransactionSummary());
  }
}, [dispatch, isAuthenticated]);
```

**Keep**: All other code stays the same! Components will get data from Redux.

#### 4B: `features/p2p/components/ui/p2pdashboard/P2pWallet.tsx`

**Remove These Lines** (58-64):

```typescript
// ❌ REMOVE THIS ENTIRE useEffect
useEffect(() => {
  if (isAuthenticated) {
    dispatch(fetchWallets());
    dispatch(fetchMatchedTrades(1));
    dispatch(fetchTransactionSummary());
  }
}, [dispatch, isAuthenticated]);
```

#### 4C: Check Other Components

Search for other components that might fetch the same data:

- UserCard
- Overview
- P2PCharts

**Only remove if they're fetching the SAME data as the provider!**

---

### STEP 5: Apply Same Pattern to Other Tabs

Once P2P Dashboard works, repeat for:

#### 5A: P2P Center Tab

**Create**: Similar data provider OR extend existing one

**Fetches**:

- fetchWallets (already in provider)
- p2pBuyandSell (add to provider)
- fetchMyOrders (add to provider)
- fetchTransactionSummary (already in provider)

#### 5B: Market Tab

**Fetches**:

- fetchAllP2PBuyandSell

Can either:

- Add to provider, OR
- Keep in component (less frequently used)

---

### STEP 6: Apply to Exchange & Swap

**Create**: `features/exchange/components/ExchangeDataProvider.tsx`

**Fetches** (from ExchangeLayout useEffect):

- getFavoriteAssets
- fetchExchangeStatistics

**Create**: `features/swap/components/SwapDataProvider.tsx`

**Fetches** (from SwapWidget useEffect):

- fetchSupportedAssets

---

## 🧪 Testing Checklist

### After Each Step

- [ ] Run `npm run dev` - no errors
- [ ] Navigate to affected page - loads correctly
- [ ] Check browser console - no errors
- [ ] Check Network tab - API calls look correct
- [ ] Navigate away and back - still works
- [ ] Verify data displays correctly

### Full Testing (After All Steps)

- [ ] Navigate P2P → Exchange → Swap → P2P → Dashboard
- [ ] Each navigation < 1 second
- [ ] No duplicate API calls in Network tab
- [ ] No console errors
- [ ] Data displays correctly on all pages
- [ ] Animations work smoothly

---

## 🔒 Safety Measures

### Incremental Approach

1. Make one change at a time
2. Test after each change
3. Only proceed if previous step works
4. Keep git commits small

### Rollback Plan

Each step is a separate commit:

- Step 1: "fix: use pathname key instead of Math.random"
- Step 2: "feat: add P2PDataProvider for centralized fetching"
- Step 3: "refactor: wrap P2PLayout with data provider"
- Step 4: "refactor: remove duplicate P2P data fetches"

If anything breaks: `git revert <commit-hash>`

### Backward Compatibility

- New provider is additive (doesn't break existing code)
- Child components continue to work with Redux data
- Only remove duplicate fetches after provider is verified

---

## 📊 Expected Results

### After Step 1 (Math.random fix)

- Navigation: 2500ms → 1500ms (40% faster)
- Fewer component remounts
- Smoother animations

### After Steps 2-4 (Centralized fetching)

- Navigation: 1500ms → 800ms (additional 47% faster)
- No duplicate API calls
- Parallel loading

### Final Result

- Navigation: 2500ms → 800ms (68% faster!)
- API calls: 10-15 → 3-5 (70% reduction)
- User experience: Sluggish → Snappy ✨

---

## 🚀 Ready to Implement

All steps are planned and safe. Starting with Step 1 now...
