import { getAllUserTransactions } from "@/features/transactions/api";
import type { AllTransactionItem } from "@/features/transactions/api";

const CACHE_TTL_MS = 60_000;
const MAX_PAGES = 100;

type CacheKey = string;

const cache = new Map<
  CacheKey,
  { rows: AllTransactionItem[]; timestamp: number; inflight: Promise<AllTransactionItem[]> | null }
>();

function cacheKey(type: string, fetchAll: boolean): CacheKey {
  return `${type}:${fetchAll ? "all" : "page1"}`;
}

/** Paginate unified user transactions; optional type filter (exchange, p2p, etc.). */
export async function fetchAllUserTransactionsPages(options?: {
  type?: string;
  force?: boolean;
  fetchAll?: boolean;
  pageSize?: number;
}): Promise<AllTransactionItem[]> {
  const type = options?.type ?? "all";
  const fetchAll = options?.fetchAll === true;
  const pageSize = options?.pageSize ?? 100;
  const key = cacheKey(type, fetchAll);
  const now = Date.now();

  let entry = cache.get(key);
  if (!entry) {
    entry = { rows: [], timestamp: 0, inflight: null };
    cache.set(key, entry);
  }

  if (
    !options?.force &&
    entry.rows.length > 0 &&
    now - entry.timestamp < CACHE_TTL_MS
  ) {
    return entry.rows;
  }

  if (entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = (async () => {
    const all: AllTransactionItem[] = [];
    try {
      const maxPages = fetchAll ? MAX_PAGES : 1;
      for (let page = 1; page <= maxPages; page++) {
        const response = await getAllUserTransactions({
          type,
          page,
          page_size: pageSize,
        });
        const results = response?.results ?? [];
        if (results.length === 0) break;
        all.push(...results);
        if (!fetchAll) break;
        if (!response?.next) break;
      }
      entry!.rows = all;
      entry!.timestamp = Date.now();
      return all;
    } catch {
      return entry!.rows.length > 0 ? entry!.rows : all;
    } finally {
      entry!.inflight = null;
    }
  })();

  return entry.inflight;
}

export function invalidateAllUserTransactionsCache(): void {
  cache.clear();
}
