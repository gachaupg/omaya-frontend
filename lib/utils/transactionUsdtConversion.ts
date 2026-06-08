import type { AllTransactionItem } from "@/features/transactions/api";
import { fetchExchangeCommissionLookup } from "@/features/express/api";
import { getPublicEstimateSwap } from "@/features/swap/api";
import {
  getExchangeCryptoTicker,
  isStablecoinTicker,
  parseExchangeAssetSlug,
  parseExchangeTicker,
} from "@/lib/utils/exchangeCurrencyDisplay";
import { normalizeExchangeSubType } from "@/lib/utils/exchangeTransactionDisplay";

const parseAmount = (value: string | number | undefined | null): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  return Number.isFinite(n) ? n : null;
};

const normalizeSymbol = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const isUsdtSymbol = (symbol: string): boolean =>
  normalizeSymbol(symbol) === "USDT" || normalizeSymbol(symbol) === "USD";

const TICKER_ALIASES: Record<string, string> = {
  BITCOIN: "BTC",
  ETHEREUM: "ETH",
  DOGECOIN: "DOGE",
};

/** Map API network / asset slug → commission-lookup `from_network`. */
export function normalizeCommissionNetwork(
  networkRaw: string | null | undefined,
  assetSlug?: string | null
): string {
  const network = String(networkRaw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+network$/i, "");

  if (network === "bep20" || network === "bsc") return "bsc";
  if (network === "eth" || network === "erc20" || network === "ethereum") return "eth";
  if (network === "btc" || network === "bitcoin") return "btc";
  if (network === "doge" || network === "dogecoin") return "doge";
  if (network) return network;

  const asset = String(assetSlug ?? "").toLowerCase();
  if (asset.includes("_bsc_") || asset.includes("bsc")) return "bsc";
  if (asset.includes("_eth_") || asset.endsWith("_eth")) return "eth";
  if (asset.includes("_btc_") || asset === "btc") return "btc";
  if (asset === "doge") return "doge";
  if (asset === "eth") return "eth";

  return "bsc";
}

export function resolveTransactionFromNetwork(tx: AllTransactionItem): string {
  return normalizeCommissionNetwork(tx.network, tx.asset);
}

function normalizeCommissionCurrency(...candidates: unknown[]): string {
  for (const value of candidates) {
    const parsed =
      parseExchangeTicker(value) ||
      parseExchangeAssetSlug(value) ||
      normalizeSymbol(value);
    if (!parsed) continue;
    return TICKER_ALIASES[parsed] ?? parsed;
  }
  return "";
}

export type ExchangeUsdtLookupParams = {
  amount: number;
  type: "deposit" | "withdrawal";
  from_currency: string;
  from_network: string;
  from_asset_id?: string;
};

/** Params for commission-lookup: crypto amount → USDT (BSC peg ≈ USD). */
export function resolveExchangeUsdtLookupParams(
  tx: AllTransactionItem
): ExchangeUsdtLookupParams | null {
  if (tx.type !== "exchange") return null;

  const sub = normalizeExchangeSubType(tx.sub_type);
  const type: "deposit" | "withdrawal" =
    sub === "withdrawal" ? "withdrawal" : "deposit";

  const from_currency =
    getExchangeCryptoTicker(tx) ||
    parseExchangeAssetSlug(tx.asset) ||
    parseExchangeAssetSlug(tx.currency) ||
    normalizeSymbol(tx.currency);

  if (!from_currency || isUsdtSymbol(from_currency) || isStablecoinTicker(from_currency)) {
    return null;
  }

  const amount =
    type === "deposit"
      ? parseAmount(tx.amount)
      : parseAmount(tx.to_amount) ?? parseAmount(tx.amount);

  if (amount == null || amount <= 0) return null;

  const from_asset_id = String(tx.asset ?? "").trim() || undefined;

  return {
    amount,
    type,
    from_currency,
    from_network: resolveTransactionFromNetwork(tx),
    from_asset_id,
  };
}

/** Swap rows: value the sent (from) leg in USDT. */
export function resolveSwapUsdtLookupParams(
  tx: AllTransactionItem
): ExchangeUsdtLookupParams | null {
  if (tx.type !== "swap") return null;

  const from_currency = normalizeCommissionCurrency(
    tx.from_asset,
    tx.asset,
    tx.from_currency,
    tx.currency
  );

  if (!from_currency || isUsdtSymbol(from_currency) || isStablecoinTicker(from_currency)) {
    return null;
  }

  const amount = parseAmount(tx.amount);
  if (amount == null || amount <= 0) return null;

  const from_asset_id = String(tx.asset ?? "").trim() || undefined;

  return {
    amount,
    type: "deposit",
    from_currency,
    from_network: normalizeCommissionNetwork(
      tx.from_network || tx.network,
      tx.asset || tx.from_asset
    ),
    from_asset_id,
  };
}

/** Exchange + swap transactions that need a USDT equivalent lookup. */
export function resolveUsdtLookupParams(
  tx: AllTransactionItem
): ExchangeUsdtLookupParams | null {
  return resolveExchangeUsdtLookupParams(tx) ?? resolveSwapUsdtLookupParams(tx);
}

async function fetchSwapUsdtViaEstimate(
  params: ExchangeUsdtLookupParams
): Promise<number | null> {
  try {
    const estimate = await getPublicEstimateSwap(
      params.from_currency,
      params.from_network,
      "USDT",
      "bsc",
      params.amount
    );
    const usdt = parseAmount(estimate.toAmount ?? estimate.estimated_amount ?? estimate.user_amount);
    return usdt != null && usdt > 0 ? usdt : null;
  } catch {
    return null;
  }
}

function parseUsdtFromLookupResponse(data: {
  usdt_amount?: string | null;
  gross_usdt?: string | null;
  to_amount?: string | null;
}): number | null {
  for (const field of [data.usdt_amount, data.gross_usdt, data.to_amount]) {
    const n = parseAmount(field);
    if (n != null && n > 0) return n;
  }
  return null;
}

const lookupCache = new Map<string, { value: number; at: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const inflight = new Map<string, Promise<number | null>>();

function lookupCacheKey(tx: AllTransactionItem, params: ExchangeUsdtLookupParams): string {
  return [
    tx.id,
    params.type,
    params.from_currency,
    params.from_network,
    params.amount,
    params.from_asset_id ?? "",
  ].join("|");
}

/**
 * Convert a transaction's crypto leg to USDT via platform commission-lookup.
 * 1 USDT (BSC) ≈ 1 USD for dashboard display.
 */
export async function fetchTransactionUsdtEquivalent(
  tx: AllTransactionItem
): Promise<number | null> {
  const params = resolveUsdtLookupParams(tx);
  if (!params) return null;

  const key = lookupCacheKey(tx, params);
  const cached = lookupCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      for (const toCurrency of ["USDT", "USD"] as const) {
        const res = await fetchExchangeCommissionLookup(
          params.amount,
          params.type,
          params.from_currency,
          toCurrency,
          params.from_network,
          params.from_asset_id
        );
        const usdt = parseUsdtFromLookupResponse(res);
        if (usdt != null && usdt > 0) {
          lookupCache.set(key, { value: usdt, at: Date.now() });
          return usdt;
        }
      }

      if (tx.type === "swap") {
        const estimateUsdt = await fetchSwapUsdtViaEstimate(params);
        if (estimateUsdt != null && estimateUsdt > 0) {
          lookupCache.set(key, { value: estimateUsdt, at: Date.now() });
          return estimateUsdt;
        }
      }
    } catch {
      return null;
    }
    return null;
  })();

  inflight.set(key, request);
  try {
    return await request;
  } finally {
    inflight.delete(key);
  }
}

export async function fetchTransactionUsdtEquivalents(
  transactions: AllTransactionItem[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};

  await Promise.all(
    transactions.map(async (tx) => {
      const usdt = await fetchTransactionUsdtEquivalent(tx);
      if (usdt != null && usdt > 0 && tx.id) {
        out[tx.id] = usdt;
      }
    })
  );

  return out;
}
