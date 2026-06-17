import { getUserTrades } from "@/features/p2p/api";

const CACHE_TTL_MS = 60_000;
const MAX_PAGES = 100;
const STORE_KEY = "__omaya_user_trades_pages_cache__";

type UserTradesCacheStore = {
  cachedTrades: unknown[] | null;
  cacheTimestamp: number;
  inflight: Promise<unknown[]> | null;
};

function getStore(): UserTradesCacheStore {
  const g = globalThis as typeof globalThis &
    Record<string, UserTradesCacheStore | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      cachedTrades: null,
      cacheTimestamp: 0,
      inflight: null,
    };
  }
  return g[STORE_KEY]!;
}

/** Paginate user-trades once; dedupe concurrent callers and reuse recent results. */
export async function fetchAllUserTradesPages(options?: {
  force?: boolean;
  fetchAll?: boolean;
}): Promise<unknown[]> {
  const store = getStore();
  const now = Date.now();
  const shouldFetchAll = options?.fetchAll === true;

  if (
    !options?.force &&
    store.cachedTrades &&
    now - store.cacheTimestamp < CACHE_TTL_MS
  ) {
    return store.cachedTrades;
  }

  if (store.inflight) {
    return store.inflight;
  }

  store.inflight = (async () => {
    const all: unknown[] = [];
    try {
      const maxPages = shouldFetchAll ? MAX_PAGES : 1;
      for (let page = 1; page <= maxPages; page++) {
        const response = await getUserTrades(`?page=${page}`);
        const results = response?.results || [];
        if (results.length === 0) break;
        all.push(...results);
        if (!shouldFetchAll) break;
        if (!response?.next) break;
      }
      store.cachedTrades = all;
      store.cacheTimestamp = Date.now();
      return all;
    } catch {
      return store.cachedTrades ?? all;
    } finally {
      store.inflight = null;
    }
  })();

  return store.inflight;
}

export function invalidateAllUserTradesCache(): void {
  const store = getStore();
  store.cachedTrades = null;
  store.cacheTimestamp = 0;
}
