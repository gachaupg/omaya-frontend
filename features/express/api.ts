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

interface CommissionLookupResponse {
  commission_rate: string;
  is_percentage: boolean;
  calculated_fee: string;
  range_min: string;
  range_max: string;
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
  local_commission: { rate: string; commission_mode: "flat_fee" | "percentage"; fee: string };
  to_amount: string;
}

/** Exchange-lookup assets (no ChangeNow):
 *  - USDT on BSC/BEP20
 *  - USDC on BSC/BEP20
 *  - BNB on BSC/BEP20
 *  - USDT on ETH/ERC20
 *  - FXP / FXPRIMUS (FOREX, no network)
 *  We detect network using either `asset.network` or the first entry in `asset.networks`.
 */
export const isExchangeCommissionLookupAsset = (asset: {
  ticker?: string;
  symbol?: string;
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
  const isFxp = ticker === "fxp" || ticker === "fxprimus";
  const isBscLike = network === "bsc" || network === "bep20";
  const isEthLike = network === "eth" || network === "erc20";

  return (
    (isUsdt && isBscLike) || // USDT BSC/BEP20
    isUsdc ||                // Any USDC (we'll force BSC mapping below)
    (isUsdt && isEthLike) || // USDT ETH/ERC20
    isFxp                    // FXP / FXPRIMUS (FOREX, no network)
  );
};

/** Map frontend asset (ticker + network) to API from_currency and from_network for exchange commission-lookup. Returns null if not one of the first 3 assets. */
export const getExchangeLookupParams = (
  asset: {
    ticker?: string;
    symbol?: string;
    network?: string;
    networks?: Array<{ network_type?: string; network_id?: string }>;
  } | null
): { from_currency: string; from_network: string } | null => {
  if (!asset || !isExchangeCommissionLookupAsset(asset)) return null;

  const ticker = (asset.ticker || asset.symbol || "").toUpperCase();
  const rawNetwork =
    asset.network ||
    asset.networks?.[0]?.network_type ||
    asset.networks?.[0]?.network_id ||
    "";
  const network = rawNetwork.toLowerCase();

  // USDT on BSC/BEP20 → from_currency=USDT, from_network=bsc
  if (ticker === "USDT" && (network === "bsc" || network === "bep20")) {
    return { from_currency: "USDT", from_network: "bsc" };
  }

  // USDC → always treat as BSC for commission-lookup (backend expects bsc)
  if (ticker === "USDC") {
    return { from_currency: "USDC", from_network: "bsc" };
  }

  // BNB on BSC/BEP20 → from_currency=BNB, from_network=bsc
  if (ticker === "BNB" && (network === "bsc" || network === "bep20")) {
    return { from_currency: "BNB", from_network: "bsc" };
  }

  // USDT on ETH/ERC20 → from_currency=USDT, from_network=ETH
  if (ticker === "USDT" && (network === "eth" || network === "erc20")) {
    return { from_currency: "USDT", from_network: "eth" };
  }

  // FXP / FXPRIMUS (FOREX) → from_currency=FOREX, no network
  if (ticker === "FXP" || ticker === "FXPRIMUS") {
    return { from_currency: "FOREX", from_network: "" };
  }

  return null;
};

// Commission lookup API (no auth required) — returns percentage rate (legacy; for non–first-3 assets)
export const fetchCommission = async (
  _asset: string,
  amount: number,
  type: "deposit" | "withdrawal"
): Promise<number> => {
  const url = `${API_BASE_URL}${API_CONFIG.COMMISSION_LOOKUP(amount, type)}`;
  const response = await axios.get<CommissionLookupResponse>(url);
  const rate = response.data?.commission_rate;
  return typeof rate === "number" ? rate : parseFloat(String(rate)) || 0;
};

/** GET exchange estimate — for first 3 assets only (USDT BEP20, BNB BSC, USDT ERC20). Uses to_amount and local_commission. */
export const fetchExchangeCommissionLookup = async (
  amount: number,
  type: "deposit" | "withdrawal",
  from_currency: string,
  to_currency: string = "USD",
  from_network?: string
): Promise<ExchangeCommissionLookupResponse> => {
  const path = API_CONFIG.COMMISSION_LOOKUP_EXCHANGE(amount, type, from_currency, to_currency, from_network);
  const response = await axios.get<ExchangeCommissionLookupResponse>(`${API_BASE_URL}${path}`);
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