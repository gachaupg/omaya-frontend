import { getAllP2PBuyandSell } from "@/features/p2p/api";

export const MARKET_TABLE_PAGE_SIZE = 10;

/** When a client-side currency filter yields fewer than this many rows, use a single page. */
export const MARKET_CLIENT_FILTER_SINGLE_PAGE_MAX = 10;

export type MarketOrderSide = {
  next: string | null;
  previous: string | null;
  total_orders_count: number;
  results: any[];
};

const EMPTY_MARKET_ORDER_SIDE: MarketOrderSide = {
  next: null,
  previous: null,
  total_orders_count: 0,
  results: [],
};

/** API may return `{ results, total_orders_count }` or a plain array. */
export function normalizeMarketOrderSide(raw: unknown): MarketOrderSide {
  if (Array.isArray(raw)) {
    return {
      next: null,
      previous: null,
      total_orders_count: raw.length,
      results: raw,
    };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const results = Array.isArray(obj.results) ? obj.results : [];
    const total =
      typeof obj.total_orders_count === "number"
        ? obj.total_orders_count
        : results.length;

    return {
      next: typeof obj.next === "string" ? obj.next : null,
      previous: typeof obj.previous === "string" ? obj.previous : null,
      total_orders_count: total,
      results,
    };
  }

  return EMPTY_MARKET_ORDER_SIDE;
}

export function normalizeMarketOrdersResponse(response: {
  buy_orders?: unknown;
  sell_orders?: unknown;
}): { buy_orders: MarketOrderSide; sell_orders: MarketOrderSide } {
  return {
    buy_orders: normalizeMarketOrderSide(response.buy_orders),
    sell_orders: normalizeMarketOrderSide(response.sell_orders),
  };
}

export function getMarketTabOrderCount(
  buyOrders: MarketOrderSide,
  sellOrders: MarketOrderSide,
  activeTab: string
): number {
  if (activeTab === "buy") return sellOrders.total_orders_count || 0;
  if (activeTab === "sell") return buyOrders.total_orders_count || 0;
  return Math.max(
    buyOrders.total_orders_count || 0,
    sellOrders.total_orders_count || 0
  );
}

export function orderMatchesMarketCurrencyFilter(
  order: { range_currency?: string | null },
  selectedCurrency: string
): boolean {
  const sel = selectedCurrency.toUpperCase();
  if (sel === "KES") {
    return (order.range_currency || "").toUpperCase() === "KES";
  }
  if (sel === "USD") {
    return (order.range_currency || "").toUpperCase() !== "KES";
  }
  return true;
}

function extractTabOrdersFromApiResponse(
  response: {
    buy_orders?: { results?: unknown[] } | unknown[];
    sell_orders?: { results?: unknown[] } | unknown[];
  },
  activeTab: string
): any[] {
  const buyRaw = response.buy_orders;
  const sellRaw = response.sell_orders;
  const buyResults = Array.isArray(buyRaw)
    ? buyRaw
    : Array.isArray(buyRaw?.results)
      ? buyRaw.results
      : [];
  const sellResults = Array.isArray(sellRaw)
    ? sellRaw
    : Array.isArray(sellRaw?.results)
      ? sellRaw.results
      : [];

  if (activeTab === "buy") return sellResults as any[];
  if (activeTab === "sell") return buyResults as any[];
  return [...(buyResults as any[]), ...(sellResults as any[])];
}

function getActiveMarketOrderSide(
  normalized: { buy_orders: MarketOrderSide; sell_orders: MarketOrderSide },
  activeTab: string
): MarketOrderSide {
  if (activeTab === "buy") return normalized.sell_orders;
  if (activeTab === "sell") return normalized.buy_orders;
  return normalized.sell_orders.total_orders_count >= normalized.buy_orders.total_orders_count
    ? normalized.sell_orders
    : normalized.buy_orders;
}

/** Fetch and merge market orders from every server page (for client-side currency filtering). */
export async function fetchAllMarketOrdersForTab(
  activeTab: string,
  serverPageCountHint = 1
): Promise<any[]> {
  const merged: any[] = [];
  const seen = new Set<string>();
  let page = 1;
  let expectedPages = Math.max(1, serverPageCountHint);

  for (;;) {
    const response = await getAllP2PBuyandSell(page);
    const normalized = normalizeMarketOrdersResponse(response);

    const activeTotal = getMarketTabOrderCount(
      normalized.buy_orders,
      normalized.sell_orders,
      activeTab
    );
    expectedPages = Math.max(
      expectedPages,
      Math.ceil(activeTotal / MARKET_TABLE_PAGE_SIZE)
    );

    for (const order of extractTabOrdersFromApiResponse(response, activeTab)) {
      const id = String(order?.id ?? "");
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      merged.push(order);
    }

    const activeSide = getActiveMarketOrderSide(normalized, activeTab);
    const hasNextPage = Boolean(activeSide.next);

    if (page >= expectedPages && !hasNextPage) break;
    if (page >= 200) break;

    page += 1;
  }

  return merged;
}

export function getClientFilteredPageCount(filteredCount: number): number {
  if (filteredCount <= 0) return 0;
  return Math.ceil(filteredCount / MARKET_TABLE_PAGE_SIZE);
}

export function sliceMarketPage<T>(
  items: T[],
  page: number,
  singlePage: boolean
): T[] {
  if (singlePage) {
    return items;
  }
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * MARKET_TABLE_PAGE_SIZE;
  return items.slice(start, start + MARKET_TABLE_PAGE_SIZE);
}
