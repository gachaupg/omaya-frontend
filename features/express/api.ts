import { post, get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { API_BASE_URL } from "@/config/api";
import axios from "axios";
import { ForexExchangePayload, ForexExchangeResponse, ExpressWithdrawalPayload } from "./types";

// Map asset ticker to commission API asset name (usdt, usdc, fxprimus)
export const getCommissionApiAsset = (ticker: string): string | null => {
  const t = (ticker || "").toLowerCase();
  if (t === "usdt") return "usdt";
  if (t === "usdc") return "usdc";
  if (t === "fxp" || t === "fxprimus") return "fxprimus";
  return null;
};

/** FX Primus: backend may expose ticker/symbol/name only, or variants like "FX Primus" / FXPRIMUS — must match commission-lookup + forex UI */
export const isForexPrimusAsset = (asset: {
  ticker?: string;
  symbol?: string;
  name?: string;
} | null): boolean => {
  if (!asset) return false;
  const parts = [
    asset.ticker,
    asset.symbol,
    asset.name,
    (asset as { legacyTicker?: string }).legacyTicker,
    (asset as { legacy_ticker?: string }).legacy_ticker,
    (asset as { original_ticker?: string }).original_ticker,
    (asset as { change_now_ticker?: string }).change_now_ticker,
  ]
    .filter((x): x is string => x != null && String(x).trim() !== "")
    .map((x) => String(x).toLowerCase().trim());
  for (const raw of parts) {
    const compact = raw.replace(/\s+/g, "");
    if (compact === "fxp" || compact === "fxprimus") return true;
    if (compact.includes("fxprimus")) return true;
    if (/\bfxp\b/.test(raw)) return true;
  }
  return false;
};

export interface CommissionLookupResponse {
  commission_rate: string;
  is_percentage: boolean;
  calculated_fee: string;
  range_min: string;
  range_max: string;
  commission_mode?: "flat_fee" | "percentage" | string;
  fee?: string;
  from_amount?: string;
  to_amount?: string;
}

/** Exchange commission-lookup response (GET /administration/commission-lookup/ with from_currency, to_currency, from_network). Used for first 3 assets only. */
export interface ExchangeCommissionLookupResponse {
  feature: string;
  commission_type: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  market_rate: string | null;
  gross_usdt: string | null;
  source: string;
  crypto_commission: { rate: string; commission_mode: string; fee?: string; asset_specific?: boolean } | null;
  changenow_fees: { omaya_fee?: number; gas_fee?: number; total_fee?: number; min_amount?: number } | null;
  usdt_amount: string;
  local_commission: { rate: string; commission_mode: "flat_fee" | "percentage"; fee: string } | null;
  to_amount: string;
}

/** Exchange-lookup assets (no ChangeNow):
 *  - USDT on BSC/BEP20
 *  - USDC on BSC/BEP20
 *  - BNB on BSC/BEP20
 *  - USDT on ETH/ERC20
 *  NOTE: FXP / FXPRIMUS is intentionally excluded.
 *  FXP must use legacy commission API (`fetchCommissionDetails` / `getCommissionApiAsset`)
 *  and must not go through exchange commission-lookup.
 *  We detect network using either `asset.network` or the first entry in `asset.networks`.
 */
export const isExchangeCommissionLookupAsset = (asset: {
  ticker?: string;
  symbol?: string;
  name?: string;
  network?: string;
  networks?: Array<{ network_type?: string; network_id?: string }>;
} | null): boolean => {
  if (!asset) return false;
  const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
  // Prefer explicit `network`, fall back to first networks entry
  const rawNetwork =
    asset.network ||
    asset.networks?.[0]?.network_type ||
    asset.networks?.[0]?.network_id ||
    "";
  const network = rawNetwork.toLowerCase();

  const isUsdt = ticker === "usdt";
  const isUsdc = ticker === "usdc";
  const isBscLike = network === "bsc" || network === "bep20";
  const isEthLike = network === "eth" || network === "erc20";

  return (
    (isUsdt && isBscLike) || // USDT BSC/BEP20
    isUsdc ||                // Any USDC (we'll force BSC mapping below)
    (isUsdt && isEthLike)    // USDT ETH/ERC20
  );
};

/** Map frontend asset (ticker + network) to API from_currency and from_network for exchange commission-lookup. Returns null if not one of the first 3 assets. */
export const getExchangeLookupParams = (
  asset: {
    ticker?: string;
    symbol?: string;
    name?: string;
    asset_id?: string;
    network?: string;
    networks?: Array<{ network_type?: string; network_id?: string }>;
  } | null
): { from_currency: string; from_network: string; from_asset_id?: string } | null => {
  if (!asset || !isExchangeCommissionLookupAsset(asset)) return null;

  const ticker = (asset.ticker || asset.symbol || asset.name || "").toUpperCase();
  const rawNetwork =
    asset.network ||
    asset.networks?.[0]?.network_type ||
    asset.networks?.[0]?.network_id ||
    "";
  const network = rawNetwork.toLowerCase();
  const rawAssetId = String(asset.asset_id || "").trim();

  // USDT on BSC/BEP20 → from_currency=USDT, from_network=bsc
  if (ticker === "USDT" && (network === "bsc" || network === "bep20")) {
    return { from_currency: "USDT", from_network: "bsc", from_asset_id: rawAssetId || undefined };
  }

  // USDC → always treat as BSC for commission-lookup (backend expects bsc)
  if (ticker === "USDC") {
    return { from_currency: "USDC", from_network: "bsc", from_asset_id: rawAssetId || undefined };
  }

  // BNB on BSC/BEP20 → from_currency=BNB, from_network=bsc
  if (ticker === "BNB" && (network === "bsc" || network === "bep20")) {
    return { from_currency: "BNB", from_network: "bsc", from_asset_id: rawAssetId || undefined };
  }

  // USDT on ETH/ERC20 → from_currency=USDT, from_network=ETH
  if (ticker === "USDT" && (network === "eth" || network === "erc20")) {
    return { from_currency: "USDT", from_network: "eth", from_asset_id: rawAssetId || undefined };
  }

  return null;
};

// Commission lookup API (no auth required) — returns percentage rate (legacy; for non–first-3 assets)
export const fetchCommission = async (
  _asset: string,
  amount: number,
  type: "deposit" | "withdrawal"
): Promise<number> => {
  const details = await fetchCommissionDetails(_asset, amount, type);
  const rate = details?.commission_rate;
  return typeof rate === "number" ? rate : parseFloat(String(rate)) || 0;
};

export const fetchCommissionDetails = async (
  _asset: string,
  amount: number,
  type: "deposit" | "withdrawal",
  from_asset_id?: string
): Promise<CommissionLookupResponse> => {
  const normalizedAsset = String(_asset || "").toLowerCase().trim();
  const isFxPrimus = normalizedAsset === "fxprimus" || normalizedAsset === "fxp";
  const effectiveAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (isFxPrimus) {
    const baseUrl = `${API_BASE_URL}${API_CONFIG.COMMISSION_LOOKUP_EXCHANGE(
      effectiveAmount,
      type,
      "USD",
      "FXPRIMUS"
    )}`;
    const rawAssetId = String(from_asset_id || "").trim();
    const url = rawAssetId
      ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}from_asset_id=${encodeURIComponent(rawAssetId)}`
      : baseUrl;

    // Simple short-lived cache to avoid refetching FXP commission when user toggles assets.
    const FXP_CACHE_TTL_MS = 60 * 1000;
    const key = `fxp:${type}:${effectiveAmount.toFixed(4)}:${rawAssetId || "no_asset_id"}`;
    const g = globalThis as unknown as { __omayaFxpCommissionCache?: Map<string, { ts: number; data: CommissionLookupResponse }> };
    if (!g.__omayaFxpCommissionCache) g.__omayaFxpCommissionCache = new Map();
    const hit = g.__omayaFxpCommissionCache.get(key);
    if (hit && Date.now() - hit.ts < FXP_CACHE_TTL_MS) {
      return hit.data;
    }

    const response = await axios.get<ExchangeCommissionLookupResponse>(url);
    const payload = response.data;

    const commissionMode = payload?.crypto_commission?.commission_mode || "percentage";
    const mapped: CommissionLookupResponse = {
      commission_rate: String(payload?.crypto_commission?.rate ?? "0"),
      is_percentage: String(commissionMode).toLowerCase() !== "flat_fee",
      calculated_fee: String(payload?.crypto_commission?.fee ?? "0"),
      range_min: "0",
      range_max: "0",
      commission_mode: commissionMode,
      fee: String(payload?.crypto_commission?.fee ?? "0"),
      from_amount: String(payload?.from_amount ?? ""),
      to_amount: String(payload?.to_amount ?? ""),
    };
    g.__omayaFxpCommissionCache.set(key, { ts: Date.now(), data: mapped });
    return mapped;
  }

  const url = `${API_BASE_URL}${API_CONFIG.COMMISSION_LOOKUP(effectiveAmount, type)}`;
  const response = await axios.get<CommissionLookupResponse>(url);
  return response.data;
};

/** GET exchange estimate — for first 3 assets only (USDT BEP20, BNB BSC, USDT ERC20). Uses to_amount and local_commission. */
export const fetchExchangeCommissionLookup = async (
  amount: number,
  type: "deposit" | "withdrawal",
  from_currency: string,
  to_currency: string = "USD",
  from_network?: string,
  from_asset_id?: string
): Promise<ExchangeCommissionLookupResponse> => {
  const path = API_CONFIG.COMMISSION_LOOKUP_EXCHANGE(amount, type, from_currency, to_currency, from_network);
  const queryJoiner = path.includes("?") ? "&" : "?";
  const withAssetId =
    from_asset_id && from_asset_id.trim()
      ? `${path}${queryJoiner}from_asset_id=${encodeURIComponent(from_asset_id.trim())}`
      : path;
  const response = await axios.get<ExchangeCommissionLookupResponse>(`${API_BASE_URL}${withAssetId}`);
  return response.data;
};

// Express withdrawal API
export const createExpressWithdrawal = async (data: ExpressWithdrawalPayload) => {
  return post(API_CONFIG.EXPRESS.WITHDRAW, data);
};

// Express withdrawal status via websocket
export const getExpressWithdrawalStatus = (transactionId: string) => {
  return API_CONFIG.EXPRESS.SOCKETS.WITHDRAWAL_STATUS(transactionId);
};

// Cancel deposit transaction
export const cancelDepositTransaction = async (transactionId: string) => {
  return post(API_CONFIG.EXPRESS.CANCEL_DEPOSIT(transactionId), {});
};

// Cancel withdrawal transaction
export const cancelWithdrawalTransaction = async (transactionId: string) => {
  return post(API_CONFIG.EXPRESS.CANCEL_WITHDRAWAL(transactionId), {});
};

// Cancel P2P deposit transaction
export const cancelP2PDepositTransaction = async (transactionId: string) => {
  return post(API_CONFIG.EXPRESS.CANCEL_P2P_DEPOSIT(transactionId), {});
};

// Forex exchange API
export const createForexExchange = async (
  data: ForexExchangePayload
): Promise<ForexExchangeResponse> => {
  const response = await post(API_CONFIG.FOREX.CREATE_EXCHANGE, data);
  return response.data as ForexExchangeResponse;
};