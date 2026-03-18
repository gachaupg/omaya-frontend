# What Makes the Website Freeze (and What We Did About It)

## Root causes of the freeze

### 1. **Route protection blocking the whole page**
- **Where:** Dashboard pages (P2P, Exchange, Swap, Account, etc.) use `useRouteProtection()` and run `checkKYCStatus()` on load.
- **What happens:** While `isChecking === true`, the page **only** renders a full-screen loader. Nothing else is visible and no other UI is interactive.
- **Why it freezes:** If the KYC API is slow or hangs (e.g. during maintenance), `isChecking` never becomes false, so the user stays on the loader and cannot click anything or navigate.
- **Fix applied:** A **12s timeout** was added in `useRouteProtection`. After 12s we set `isChecking = false` and allow the page to render so the user can use the app even if the API never responds.

### 2. **Slow or hanging API calls with no timeout**
- **Where:** Requests to:
  - `/payments/user-payment-details/` (payment methods)
  - `/api/changenow/estimate/` (swap/asset estimates when choosing BNB, BTC, etc.)
  - `api/changenow/supported-tokens/` (asset list)
  - `/api/kyc/status/` (KYC check)
- **What happens:** The default API client timeout was 30s. If the backend is slow or stuck, the request hangs and the UI often waits on that request (e.g. “Calculating…”, disabled buttons).
- **Why it freezes:** The user sees loading forever and cannot use other parts of the app because the UI is waiting on that request (or the whole page is blocked by route protection as above).
- **Fix applied:** In `lib/apiClient.ts`:
  - **Default timeout** reduced to **20s**.
  - **Endpoint-specific timeouts** added (15s or 10s) for the paths above so they fail fast instead of hanging.
  - Request interceptor matches by **path prefix** so URLs with query params get the right timeout.

### 3. **Full-screen loaders that block interaction**
- **Where:**
  - **P2P/Exchange/Swap/Account pages:** `if (isChecking) return <Loader />` — full-page loader until KYC check finishes (now limited by 12s timeout).
  - **Loader component** (`features/p2p/components/Common/Loader.tsx`): When `fullPage={true}` it uses `fixed inset-0 ... z-50`, which covers the whole viewport and blocks clicks.
- **What happens:** Any code that shows a full-page loader and never hides it (e.g. because an API never returns) makes the app look frozen: user cannot click anything.
- **Fix applied:** Route protection timeout (above) prevents indefinite full-page blocking on dashboard. Avoid using `fullPage={true}` for long-running or unguarded loading states.

### 4. **Refetching assets too often**
- **Where:** Many components dispatch `fetchAssets()` or `fetchSupportedAssets()` on mount. Before caching, every visit or tab could trigger new API calls. When the API was slow, multiple calls made the app feel stuck and increased load.
- **Fix applied:** **1 hour cache** for:
  - Swap supported assets (`fetchSupportedAssets`)
  - Exchange assets (`fetchAssets`)
  - P2P assets (slice cache added with 1h TTL)
  So we **serve from cache** for 1 hour and only refetch after TTL or explicit refresh, reducing both freeze risk and unnecessary load.

---

## Summary table

| Cause | Effect | Fix |
|-------|--------|-----|
| Route protection waits forever on KYC API | Full-page loader until API responds; app “frozen” | 12s timeout in `useRouteProtection`; page renders after timeout |
| No/short timeouts on heavy APIs | Requests hang; UI waits; buttons/forms stuck | 15–20s timeouts in `apiClient` for payment-details, changenow, KYC |
| Full-page loader with no timeout | Entire screen is loader; no interaction | Same route-protection timeout; avoid indefinite full-page loaders |
| Frequent asset refetches | More slow calls; more chances to block UI | 1h cache for all asset fetches; cache-first, refetch after TTL |

---

## What you can still do

1. **Avoid full-page loaders for non-critical data**  
   Prefer inline/section loaders (e.g. spinner in the form) so the rest of the page (nav, other buttons) stays clickable.

2. **Use timeouts or AbortController for heavy UI-blocking calls**  
   For any new flow that must finish before the user can continue, add a timeout (or abort on navigation) so the UI never waits indefinitely.

3. **Keep using cache-first for assets**  
   We already use 1h cache; keep refetch only on explicit “Refresh” or after TTL so slow APIs don’t trigger constant refetches and freezes.
