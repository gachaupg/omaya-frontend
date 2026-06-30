import { getConfirmOrder } from "@/features/p2p/api";
import type { MatchedTrade } from "@/features/p2p/types";
import { logTradePreview } from "./tradePreviewDebug";

type CacheEntry = {
  data?: MatchedTrade;
  promise?: Promise<MatchedTrade>;
  fetchedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function cacheKey(id: string): string {
  return String(id ?? "").trim();
}

function storeInCache(confirm: MatchedTrade): void {
  const id = cacheKey(confirm.id);
  if (!id) return;
  const entry: CacheEntry = { data: confirm, fetchedAt: Date.now() };
  cache.set(id, entry);
}

/** Seed cache after the single post-match confirm fetch (preview flow). */
export function primeP2PConfirmCache(confirm: MatchedTrade): void {
  storeInCache(confirm);
  logTradePreview("confirm cache primed", {
    tradeId: confirm.id,
    status: confirm.status,
    sell_order: confirm.sell_order,
    buy_order: confirm.buy_order,
  });
}

export function clearP2PConfirmCache(tradeId?: string): void {
  if (tradeId) {
    cache.delete(cacheKey(tradeId));
    return;
  }
  cache.clear();
}

/**
 * Deduped GET `/trading_engine/p2p/trades/{id}/confirm/`.
 * Returns the same in-flight promise for concurrent callers; reuses fresh cache unless `force`.
 */
export async function getConfirmOrderCached(
  idHint: string,
  options?: { force?: boolean }
): Promise<MatchedTrade> {
  const key = cacheKey(idHint);
  if (!key) {
    throw new Error("Trade id is required for confirm");
  }

  const existing = cache.get(key);
  const age = existing?.fetchedAt ? Date.now() - existing.fetchedAt : Infinity;

  if (!options?.force && existing?.data && age < CACHE_TTL_MS) {
    logTradePreview("confirm cache HIT", { tradeId: key, status: existing.data.status });
    return existing.data;
  }

  if (!options?.force && existing?.promise) {
    logTradePreview("confirm cache in-flight reuse", { tradeId: key });
    return existing.promise;
  }

  logTradePreview("confirm cache MISS → network", { tradeId: key, force: !!options?.force });

  const promise = getConfirmOrder(key)
    .then((confirm) => {
      storeInCache(confirm);
      const resolvedId = cacheKey(confirm.id);
      if (resolvedId && resolvedId !== key) {
        cache.set(resolvedId, { data: confirm, fetchedAt: Date.now() });
      }
      const entry = cache.get(key);
      if (entry) entry.promise = undefined;
      return confirm;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, { promise, fetchedAt: Date.now() });
  return promise;
}

/** Single GET `/trading_engine/p2p/trades/{id}/confirm/` — use `confirm.id` as the trade key. */
export async function fetchP2PTradeConfirmOnce(
  idHint: string,
  options?: { force?: boolean }
): Promise<MatchedTrade | null> {
  const hint = String(idHint ?? "").trim();
  if (!hint) return null;
  try {
    const confirm = await getConfirmOrderCached(hint, options);
    primeP2PConfirmCache(confirm);
    return confirm;
  } catch {
    return null;
  }
}
