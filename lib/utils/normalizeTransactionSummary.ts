import type { TransactionSummary } from "@/components/types";
import type { OrderStatus } from "@/components/types";
import { normalizeExchangeSubType } from "@/lib/utils/exchangeTransactionDisplay";
import { isFiatTicker } from "@/lib/utils/exchangeCurrencyDisplay";

/** Parse API numeric fields (number, numeric string, or "123.45 USD"). */
export function parseSummaryNumber(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/\b(USD|USDT)\b/gi, "").replace(/,/g, "").trim();
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeOrderStatus(raw: unknown): OrderStatus {
  const src =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    pending: parseSummaryNumber(src.pending),
    completed: parseSummaryNumber(src.completed),
    canceled: parseSummaryNumber(
      src.canceled ?? src.cancelled ?? src.canceled_orders
    ),
    offline: parseSummaryNumber(src.offline),
  };
}

/** Unwrap nested API envelopes (`data`, `summary`, etc.). */
function unwrapSummaryPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  if (obj.summary && typeof obj.summary === "object") {
    return unwrapSummaryPayload(obj.summary);
  }
  if (
    obj.data &&
    typeof obj.data === "object" &&
    !Array.isArray(obj.data)
  ) {
    return unwrapSummaryPayload(obj.data);
  }
  return obj;
}

/**
 * Normalize `/trading_engine/transactionsummaryview/` payload for dashboard charts.
 * Coerces string numbers and maps alternate API field names.
 */
export function normalizeTransactionSummary(
  raw: unknown
): TransactionSummary {
  const s = unwrapSummaryPayload(raw);

  const totalApprovedVolume = parseSummaryNumber(
    s.total_approved_volume ?? s.total_approved_all
  );
  const totalVolumeRaw = s.total_volume;
  const totalVolume =
    typeof totalVolumeRaw === "string" && totalVolumeRaw.trim()
      ? totalVolumeRaw
      : totalApprovedVolume > 0
        ? `${totalApprovedVolume} USD`
        : "0 USD";

  const buyOrdersByStatus = normalizeOrderStatus(
    s.total_buy_orders_by_status ?? s.total_buy_orders_status
  );
  const sellOrdersByStatus = normalizeOrderStatus(
    s.total_sell_orders_by_status ?? s.total_sell_orders_status
  );
  const buyTradesByStatus = normalizeOrderStatus(
    s.total_buy_trades_by_status ?? s.total_buy_trades_status
  );
  const sellTradesByStatus = normalizeOrderStatus(
    s.total_sell_trades_by_status ?? s.total_sell_trades_status
  );

  const exchangeVolume = parseSummaryNumber(
    s.total_approved_exchange_volume ??
      s.total_approved_exchange_net ??
      s.total_approved_exchange_combined
  );
  /** Trade volume only — do not fall back to net/combined (avoids double-counting deposits). */
  const p2pVolume = parseSummaryNumber(s.total_approved_p2p_volume);

  const completedSwaps = parseSummaryNumber(s.total_completed_changenow_swaps);
  const totalSwaps = parseSummaryNumber(s.total_changenow_swaps);

  return {
    total_pending_exchange_deposits: parseSummaryNumber(
      s.total_pending_exchange_deposits
    ),
    total_pending_exchange_withdrawals: parseSummaryNumber(
      s.total_pending_exchange_withdrawals
    ),
    total_approved_exchange_deposits: parseSummaryNumber(
      s.total_approved_exchange_deposits
    ),
    total_approved_exchange_withdrawals: parseSummaryNumber(
      s.total_approved_exchange_withdrawals
    ),
    total_approved_exchange_combined: parseSummaryNumber(
      s.total_approved_exchange_combined
    ),
    total_approved_exchange_net: parseSummaryNumber(
      s.total_approved_exchange_net ?? s.total_approved_exchange_combined
    ),
    total_approved_exchange_volume: exchangeVolume,
    total_pending_p2p_deposits: parseSummaryNumber(s.total_pending_p2p_deposits),
    total_pending_p2p_withdrawals: parseSummaryNumber(
      s.total_pending_p2p_withdrawals
    ),
    total_approved_p2p_deposits: parseSummaryNumber(
      s.total_approved_p2p_deposits
    ),
    total_approved_p2p_withdrawals: parseSummaryNumber(
      s.total_approved_p2p_withdrawals
    ),
    total_approved_p2p_combined: parseSummaryNumber(s.total_approved_p2p_combined),
    total_approved_p2p_net: parseSummaryNumber(
      s.total_p2p_net ?? s.total_approved_p2p_net ?? s.total_approved_p2p_combined
    ),
    total_approved_p2p_volume: p2pVolume,
    total_approved_all: totalApprovedVolume,
    total_approved_volume: totalApprovedVolume,
    total_approved_net: parseSummaryNumber(s.total_approved_net),
    total_pending_changenow_swaps: parseSummaryNumber(
      s.total_pending_changenow_swaps
    ),
    total_completed_changenow_swaps: completedSwaps,
    total_failed_changenow_swaps: parseSummaryNumber(
      s.total_failed_changenow_swaps
    ),
    total_changenow_swaps: totalSwaps || completedSwaps,
    total_buy_orders_by_status: buyOrdersByStatus,
    total_sell_orders_by_status: sellOrdersByStatus,
    total_buy_orders: parseSummaryNumber(
      s.total_buy_orders ??
        buyOrdersByStatus.completed +
          buyOrdersByStatus.pending +
          buyOrdersByStatus.canceled +
          buyOrdersByStatus.offline
    ),
    total_sell_orders: parseSummaryNumber(
      s.total_sell_orders ??
        sellOrdersByStatus.completed +
          sellOrdersByStatus.pending +
          sellOrdersByStatus.canceled +
          sellOrdersByStatus.offline
    ),
    total_p2p_orders: parseSummaryNumber(s.total_p2p_orders ?? s.total_trades),
    total_trades: parseSummaryNumber(s.total_trades),
    avg_release_time: String(s.avg_release_time ?? "0 Min"),
    avg_payment_time: String(s.avg_payment_time ?? "0 Min"),
    rating: String(s.rating ?? "0%"),
    total_volume: totalVolume,
    total_balance: s.total_balance != null ? String(s.total_balance) : undefined,
    available_amount:
      s.available_amount != null ? String(s.available_amount) : undefined,
    escrow: s.escrow != null ? String(s.escrow) : undefined,
    // Extended fields used by dashboard charts (not in base interface)
    ...(s.total_moneyx_by_status
      ? { total_moneyx_by_status: s.total_moneyx_by_status }
      : {}),
    ...(s.total_buy_trades_by_status || s.total_buy_trades_status
      ? {
          total_buy_trades_by_status: buyTradesByStatus,
        }
      : {}),
    ...(s.total_sell_trades_by_status || s.total_sell_trades_status
      ? {
          total_sell_trades_by_status: sellTradesByStatus,
        }
      : {}),
    ...(parseSummaryNumber(s.total_buy_trades) > 0
      ? { total_buy_trades: parseSummaryNumber(s.total_buy_trades) }
      : {}),
    ...(parseSummaryNumber(s.total_sell_trades) > 0
      ? { total_sell_trades: parseSummaryNumber(s.total_sell_trades) }
      : {}),
    ...(parseSummaryNumber(s.total_approved_moneyx_volume) > 0
      ? {
          total_approved_moneyx_volume: parseSummaryNumber(
            s.total_approved_moneyx_volume
          ),
        }
      : {}),
    ...(parseSummaryNumber(s.total_moneyx_volume) > 0
      ? { total_moneyx_volume: parseSummaryNumber(s.total_moneyx_volume) }
      : {}),
    ...(parseSummaryNumber(s.total_approved_changenow_swap_volume) > 0
      ? {
          total_approved_changenow_swap_volume: parseSummaryNumber(
            s.total_approved_changenow_swap_volume
          ),
        }
      : {}),
    ...(parseSummaryNumber(s.total_changenow_swap_volume) > 0
      ? {
          total_changenow_swap_volume: parseSummaryNumber(
            s.total_changenow_swap_volume
          ),
        }
      : {}),
  } as TransactionSummary;
}

/**
 * P2P approved trade volume from API (`total_approved_p2p_volume`).
 */
export function getP2PApprovedTradeVolume(
  summary: TransactionSummary | null | undefined
): number {
  return parseSummaryNumber(summary?.total_approved_p2p_volume);
}

export function getP2PApprovedDepositsVolume(
  summary: TransactionSummary | null | undefined
): number {
  return parseSummaryNumber(summary?.total_approved_p2p_deposits);
}

export function getP2PApprovedWithdrawalsVolume(
  summary: TransactionSummary | null | undefined
): number {
  return parseSummaryNumber(summary?.total_approved_p2p_withdrawals);
}

/** Approved P2P trades + wallet deposits + wallet withdrawals. */
export function getP2PCombinedVolume(
  summary: TransactionSummary | null | undefined
): number {
  return (
    getP2PApprovedTradeVolume(summary) +
    getP2PApprovedDepositsVolume(summary) +
    getP2PApprovedWithdrawalsVolume(summary)
  );
}

/**
 * P2P overview segment for dashboard charts — approved trade volume.
 * Falls back to funding/net only when trade volume is absent.
 */
export function getP2PSegmentVolume(
  summary: TransactionSummary | null | undefined
): number {
  if (!summary) return 0;

  const volume = getP2PApprovedTradeVolume(summary);
  if (volume > 0) return volume;

  const funding = parseSummaryNumber(
    summary.total_approved_p2p_funding_volume ?? summary.total_approved_p2p_deposits
  );
  const combined = parseSummaryNumber(summary.total_approved_p2p_combined);
  const net = parseSummaryNumber(summary.total_approved_p2p_net);

  if (combined > 0) return combined;
  if (net > 0) return net;
  return funding;
}

/** P2P ad orders (not matched trades) — use for dashboard buy/sell breakdowns. */
export function getP2PBuyOrdersByStatus(
  summary: TransactionSummary | null | undefined
): OrderStatus {
  return normalizeOrderStatus(summary?.total_buy_orders_by_status);
}

export function getP2PSellOrdersByStatus(
  summary: TransactionSummary | null | undefined
): OrderStatus {
  return normalizeOrderStatus(summary?.total_sell_orders_by_status);
}

/** Matched P2P trades by status — use for dashboard P2P Buys/Sells cards. */
export function getP2PBuyTradesByStatus(
  summary: TransactionSummary | null | undefined
): OrderStatus {
  return normalizeOrderStatus(summary?.total_buy_trades_by_status);
}

export function getP2PSellTradesByStatus(
  summary: TransactionSummary | null | undefined
): OrderStatus {
  return normalizeOrderStatus(summary?.total_sell_trades_by_status);
}

/** Sum all status buckets (includes canceled). */
export function getOrderStatusTotal(status: OrderStatus): number {
  return status.completed + status.pending + status.canceled + status.offline;
}

/** Sum order/trade volume for charts (excludes canceled). */
export function getChartEligibleOrderTotal(status: OrderStatus): number {
  return status.completed + status.pending + status.offline;
}

/** Full buy trade volume from API or status breakdown. */
export function getP2PBuyTradesTotal(
  summary: TransactionSummary | null | undefined
): number {
  const fromApi = parseSummaryNumber(summary?.total_buy_trades);
  if (fromApi > 0) return fromApi;
  return getOrderStatusTotal(getP2PBuyTradesByStatus(summary));
}

/** Full sell trade volume from API or status breakdown. */
export function getP2PSellTradesTotal(
  summary: TransactionSummary | null | undefined
): number {
  const fromApi = parseSummaryNumber(summary?.total_sell_trades);
  if (fromApi > 0) return fromApi;
  return getOrderStatusTotal(getP2PSellTradesByStatus(summary));
}

function hasP2POrderBreakdown(
  summary: TransactionSummary | null | undefined
): boolean {
  if (!summary) return false;
  const buy = getP2PBuyOrdersByStatus(summary);
  const sell = getP2PSellOrdersByStatus(summary);
  return (
    buy.completed +
      buy.pending +
      buy.offline +
      buy.canceled +
      sell.completed +
      sell.pending +
      sell.offline +
      sell.canceled >
    0
  );
}

function hasP2PTradeBreakdown(
  summary: TransactionSummary | null | undefined
): boolean {
  if (!summary) return false;
  const buy = getP2PBuyTradesByStatus(summary);
  const sell = getP2PSellTradesByStatus(summary);
  return (
    buy.completed +
      buy.pending +
      buy.offline +
      buy.canceled +
      sell.completed +
      sell.pending +
      sell.offline +
      sell.canceled >
    0
  );
}

function mergeSummaryNumber(live: unknown, base: unknown): number {
  const liveN = parseSummaryNumber(live);
  const baseN = parseSummaryNumber(base);
  // Partial WS payloads normalize missing fields to 0; prefer REST unless WS sent a positive value.
  if (liveN > 0) return liveN;
  return baseN;
}

/** Merge REST summary with live wallet WS updates without losing order breakdown fields. */
export function mergeTransactionSummaries(
  base: TransactionSummary | null | undefined,
  live: TransactionSummary | null | undefined
): TransactionSummary | null {
  if (!base && !live) return null;
  if (!base) return live ?? null;
  if (!live) return base;

  const orderSource = hasP2POrderBreakdown(live) ? live : base;
  const tradeSource = hasP2PTradeBreakdown(live) ? live : base;
  const liveVolume = getP2PApprovedTradeVolume(live);
  const baseVolume = getP2PApprovedTradeVolume(base);
  const buyTradesByStatus = getP2PBuyTradesByStatus(tradeSource);
  const sellTradesByStatus = getP2PSellTradesByStatus(tradeSource);

  return {
    ...base,
    ...live,
    total_buy_orders_by_status: orderSource.total_buy_orders_by_status,
    total_sell_orders_by_status: orderSource.total_sell_orders_by_status,
    total_buy_orders: orderSource.total_buy_orders ?? base.total_buy_orders,
    total_sell_orders: orderSource.total_sell_orders ?? base.total_sell_orders,
    total_buy_trades_by_status: buyTradesByStatus,
    total_sell_trades_by_status: sellTradesByStatus,
    total_buy_trades: mergeSummaryNumber(
      live.total_buy_trades ?? tradeSource.total_buy_trades,
      base.total_buy_trades ?? getOrderStatusTotal(buyTradesByStatus)
    ),
    total_sell_trades: mergeSummaryNumber(
      live.total_sell_trades ?? tradeSource.total_sell_trades,
      base.total_sell_trades ?? getOrderStatusTotal(sellTradesByStatus)
    ),
    total_approved_p2p_volume: liveVolume > 0 ? liveVolume : baseVolume,
    total_balance: live.total_balance ?? base.total_balance,
    available_amount: live.available_amount ?? base.available_amount,
    escrow: live.escrow ?? base.escrow,
    total_pending_p2p_deposits: mergeSummaryNumber(
      live.total_pending_p2p_deposits,
      base.total_pending_p2p_deposits
    ),
    total_pending_p2p_withdrawals: mergeSummaryNumber(
      live.total_pending_p2p_withdrawals,
      base.total_pending_p2p_withdrawals
    ),
    total_approved_p2p_deposits: mergeSummaryNumber(
      live.total_approved_p2p_deposits,
      base.total_approved_p2p_deposits
    ),
    total_approved_p2p_withdrawals: mergeSummaryNumber(
      live.total_approved_p2p_withdrawals,
      base.total_approved_p2p_withdrawals
    ),
    total_volume: live.total_volume ?? base.total_volume,
  } as TransactionSummary;
}

function resolveExchangeChartSubType(
  transaction: Record<string, unknown>
): string {
  const subType = normalizeExchangeSubType(
    transaction.sub_type ??
      transaction.transaction_type ??
      transaction.exchange_type ??
      ""
  );
  if (subType) return subType;
  if (transaction.deposit_address && !transaction.withdrawal_address) {
    return "deposit";
  }
  if (transaction.withdrawal_address && !transaction.deposit_address) {
    return "withdrawal";
  }
  return subType;
}

/** Express deposit: `amount` is USD paid; `net_amount` is crypto received (BTC, etc.). */
function exchangeDepositPaidUsd(
  amount: number,
  netAmount: number,
  currency: string
): number | null {
  if (amount <= 0) return null;
  if (isFiatTicker(currency)) return amount;
  if (netAmount > 0 && netAmount >= amount * 0.25) return null;
  if (amount >= 0.01) return amount;
  return null;
}

/** USD volume for dashboard exchange line charts (from user/all-transactions rows). */
export function parseExchangeTransactionUsdVolume(transaction: {
  currency?: string;
  asset?: string;
  to_currency?: string;
  amount?: string | number;
  net_amount?: string | number;
  to_amount?: string | number;
  sub_type?: string;
  price?: string | number | null;
}): number {
  const subType = normalizeExchangeSubType(transaction?.sub_type ?? "");
  const isDeposit = subType === "deposit" || subType.includes("deposit");
  const isWithdrawal =
    subType === "withdrawal" || subType.includes("withdraw");

  const currency = String(transaction?.currency || "").toUpperCase();
  const asset = String(transaction?.asset || "").toUpperCase();
  const toCurrency = String(transaction?.to_currency || "").toUpperCase();
  const netAmount = parseSummaryNumber(transaction?.net_amount);
  const amount = parseSummaryNumber(transaction?.amount);
  const toAmount = parseSummaryNumber(transaction?.to_amount);
  const price = parseSummaryNumber(transaction?.price);

  if (isDeposit) {
    const paidUsd = exchangeDepositPaidUsd(amount, netAmount, currency);
    if (paidUsd != null) return paidUsd;
    if (toCurrency === "USD" && toAmount > 0) return toAmount;
    if (toCurrency === "USDT" && toAmount > 0) return toAmount;
    if (amount > 0 && price > 0) return amount * price;
  }

  if (isWithdrawal) {
    if (toCurrency === "USD" && toAmount > 0) return toAmount;
    if (currency === "USD" && amount > 0) return amount;
    if (toCurrency === "USDT" && toAmount > 0) return toAmount;
    if (currency === "USDT" && amount > 0) return amount;
    if (toAmount > 0 && price > 0) return toAmount * price;
  }

  if (currency === "USD" && amount > 0) return amount;
  if (toCurrency === "USD" && toAmount > 0) return toAmount;
  if (currency === "USDT" && amount > 0) return amount;
  if (asset === "USDT" && amount > 0) return amount;
  if (toCurrency === "USDT" && toAmount > 0) return toAmount;
  if (amount > 0 && price > 0) return amount * price;
  if (netAmount > 0 && isFiatTicker(currency)) return netAmount;
  if (amount > 0) return amount;

  return 0;
}

const TERMINAL_EXCHANGE_STATUSES = new Set([
  "approved",
  "completed",
  "rejected",
  "failed",
  "cancelled",
  "canceled",
  "error",
]);

const PENDING_EXCHANGE_STATUSES = new Set([
  "pending",
  "processing",
  "pending_approval",
  "admin_approval_required",
  "otp_pending",
  "pending_address",
  "waiting",
  "new",
]);

export function isPendingExchangeTransaction(status: unknown): boolean {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!normalized) return false;
  if (TERMINAL_EXCHANGE_STATUSES.has(normalized)) return false;
  return PENDING_EXCHANGE_STATUSES.has(normalized);
}

/** Sum USD value of in-flight exchange rows (dashboard “In Progress”). */
export function sumPendingExchangeUsdFromTransactions(
  transactions: unknown,
  referenceUsd = 0
): number {
  if (!Array.isArray(transactions)) return 0;

  const ref = Math.max(referenceUsd, 1);
  const totalCap = Math.max(ref * 50, 25_000);

  let total = 0;
  for (const row of transactions) {
    const tx = row as Record<string, unknown>;
    if (String(tx?.type ?? "").toLowerCase() !== "exchange") continue;
    if (!isPendingExchangeTransaction(tx?.status)) continue;

    const amount = parseExchangeTransactionUsdVolume({
      currency: tx.currency as string,
      asset: tx.asset as string,
      to_currency: tx.to_currency as string,
      amount: tx.amount as string | number,
      net_amount: tx.net_amount as string | number,
      to_amount: tx.to_amount as string | number,
      sub_type: tx.sub_type as string,
      price: tx.price as string | number | null,
    });

    if (!Number.isFinite(amount) || amount <= 0 || amount > totalCap) continue;
    total += amount;
  }

  const rounded = Math.round(total * 100) / 100;
  return rounded > totalCap ? 0 : rounded;
}

/** Sum of pending exchange fields from transaction summary API (capped). */
export function exchangeInProgressUsdFromSummary(
  transactionSummary: TransactionSummary
): number {
  return (
    sanitizeExchangeSummaryUsd(transactionSummary.total_pending_exchange_deposits) +
    sanitizeExchangeSummaryUsd(transactionSummary.total_pending_exchange_withdrawals)
  );
}

/** Max plausible USD for one dashboard summary field (guards bad API rows). */
export const MAX_REASONABLE_EXCHANGE_SUMMARY_USD = 25_000_000;

export function sanitizeExchangeSummaryUsd(value: unknown): number {
  const n = parseSummaryNumber(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > MAX_REASONABLE_EXCHANGE_SUMMARY_USD) return 0;
  return n;
}

const APPROVED_EXCHANGE_CHART_STATUSES = new Set(["approved", "completed"]);

/** Line chart: approved + completed rows (same basis as summary API totals). */
export function shouldIncludeExchangeTransactionInChart(status: unknown): boolean {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return APPROVED_EXCHANGE_CHART_STATUSES.has(normalized);
}

/** Approved-only USD totals from summary (chart fallback). */
export function exchangeChartApprovedTotalsFromSummary(
  transactionSummary: TransactionSummary | null | undefined
): { deposits: number; withdrawals: number } {
  if (!transactionSummary) return { deposits: 0, withdrawals: 0 };
  return {
    deposits: sanitizeExchangeSummaryUsd(
      transactionSummary.total_approved_exchange_deposits
    ),
    withdrawals: sanitizeExchangeSummaryUsd(
      transactionSummary.total_approved_exchange_withdrawals
    ),
  };
}

/** @deprecated Use exchangeChartApprovedTotalsFromSummary */
export function exchangeChartUsdTotalsFromSummary(
  transactionSummary: TransactionSummary | null | undefined
): { deposits: number; withdrawals: number } {
  return exchangeChartApprovedTotalsFromSummary(transactionSummary);
}

const CHART_MONTH_BUCKETS = 12;

/** Roll exchange transactions into 12 monthly buckets (newest month = last index). */
export function buildExchangeMonthlyChartBuckets(
  transactions: unknown[]
): { deposits: number[]; withdrawals: number[] } {
  const depositData = Array(CHART_MONTH_BUCKETS).fill(0);
  const withdrawalData = Array(CHART_MONTH_BUCKETS).fill(0);
  const currentDate = new Date();

  for (const row of transactions) {
    const transaction = row as Record<string, unknown>;
    if (String(transaction?.type ?? "").toLowerCase() !== "exchange") continue;
    if (!shouldIncludeExchangeTransactionInChart(transaction?.status)) continue;

    const transactionDate = new Date(
      String(transaction.created_at ?? transaction.timestamp ?? "")
    );
    if (Number.isNaN(transactionDate.getTime())) continue;

    const monthDiff =
      (currentDate.getFullYear() - transactionDate.getFullYear()) * 12 +
      (currentDate.getMonth() - transactionDate.getMonth());
    if (monthDiff < 0 || monthDiff >= CHART_MONTH_BUCKETS) continue;

    const monthIndex = CHART_MONTH_BUCKETS - 1 - monthDiff;
    const subType = resolveExchangeChartSubType(transaction);
    const amount = parseExchangeTransactionUsdVolume({
      currency: transaction.currency as string,
      asset: transaction.asset as string,
      to_currency: transaction.to_currency as string,
      amount: transaction.amount as string | number,
      net_amount: transaction.net_amount as string | number,
      to_amount: transaction.to_amount as string | number,
      sub_type: subType,
      price: transaction.price as string | number | null,
    });
    if (!amount || Number.isNaN(amount) || amount > 10_000_000) continue;

    if (subType === "deposit" || subType.includes("deposit")) {
      depositData[monthIndex] += amount;
    } else if (
      subType === "withdrawal" ||
      subType.includes("withdraw")
    ) {
      withdrawalData[monthIndex] += amount;
    }
  }

  return { deposits: depositData, withdrawals: withdrawalData };
}

function pickReconcileBucketIndex(values: number[], fallback: number): number {
  if (!values.length) return fallback;
  const peak = values.reduce(
    (best, value, i) => (value > (values[best] ?? 0) ? i : best),
    fallback
  );
  return values.reduce(
    (best, value, i) => {
      const bestValue = values[best] ?? 0;
      if (value > bestValue) return i;
      if (value === bestValue && i > best) return i;
      return best;
    },
    peak
  );
}

/** Scale monthly buckets so their sum equals the summary target (preserves shape). */
function scaleExchangeBucketsToSummaryTarget(
  values: number[],
  target: number,
  fallbackIndex: number
): number[] {
  const sum = values.reduce((s, v) => s + v, 0);
  if (target <= 0) return values.map(() => 0);
  if (sum <= 0) return values;

  if (Math.abs(sum - target) <= 0.005) return values;

  const factor = target / sum;
  const scaled = values.map((v) => Math.round(v * factor * 100) / 100);
  const scaledSum = scaled.reduce((s, v) => s + v, 0);
  const drift = Math.round((target - scaledSum) * 100) / 100;
  if (Math.abs(drift) >= 0.005) {
    const idx = pickReconcileBucketIndex(scaled, fallbackIndex);
    scaled[idx] = Math.round(((scaled[idx] ?? 0) + drift) * 100) / 100;
  }
  return scaled;
}

function topUpExchangeBucketsToSummaryTarget(
  values: number[],
  target: number,
  fallbackIndex: number
): number[] {
  const sum = values.reduce((s, v) => s + v, 0);
  if (target <= sum + 0.005) return values;
  const out = [...values];
  const idx = pickReconcileBucketIndex(out, fallbackIndex);
  out[idx] = Math.round(((out[idx] ?? 0) + (target - sum)) * 100) / 100;
  return out;
}

function alignExchangeSeriesToSummaryTarget(
  values: number[],
  target: number,
  fallbackIndex: number
): number[] {
  if (target <= 0) return values.map(() => 0);
  const sum = values.reduce((s, v) => s + v, 0);
  if (sum <= 0) {
    const out = [...values];
    out[fallbackIndex] = target;
    return out;
  }
  if (target > sum + 0.005) {
    return topUpExchangeBucketsToSummaryTarget(values, target, fallbackIndex);
  }
  if (sum > target + 0.005) {
    return scaleExchangeBucketsToSummaryTarget(values, target, fallbackIndex);
  }
  return values;
}

function ensurePeakShowsSummaryTotal(
  values: number[],
  target: number,
  fallbackIndex: number
): number[] {
  const sum = values.reduce((s, v) => s + v, 0);
  if (target <= 0) return values.map(() => 0);
  if (sum <= 0) return values;
  if (Math.abs(sum - target) > 0.01) return values;
  const peak = Math.max(...values, 0);
  if (peak >= target - 0.01) return values;
  const idx = pickReconcileBucketIndex(values, fallbackIndex);
  const out = Array(values.length).fill(0);
  out[idx] = target;
  return out;
}

/**
 * Align chart buckets with approved exchange summary totals.
 * When syncFullApprovedTotals is true, bucket sums match summary deposits/withdrawals.
 */
export function reconcileExchangeChartBucketsWithSummary(
  deposits: number[],
  withdrawals: number[],
  transactionSummary: TransactionSummary | null | undefined,
  options?: {
    syncFullApprovedTotals?: boolean;
    /** True once /user/all-transactions/?type=exchange fetch has finished. */
    transactionsLoaded?: boolean;
  }
): { deposits: number[]; withdrawals: number[] } {
  let dep = [...deposits];
  let wd = [...withdrawals];
  const totals = exchangeChartApprovedTotalsFromSummary(transactionSummary);
  const depSum = dep.reduce((s, v) => s + v, 0);
  const wdSum = wd.reduce((s, v) => s + v, 0);
  const idx = CHART_MONTH_BUCKETS - 1;
  const hasBucketData = depSum > 0 || wdSum > 0;
  const transactionsLoaded = options?.transactionsLoaded === true;

  if (!options?.syncFullApprovedTotals) {
    if (hasBucketData) return { deposits: dep, withdrawals: wd };
    if (
      !transactionsLoaded ||
      (totals.deposits <= 0 && totals.withdrawals <= 0)
    ) {
      return { deposits: dep, withdrawals: wd };
    }
    dep[idx] = totals.deposits;
    wd[idx] = totals.withdrawals;
    return { deposits: dep, withdrawals: wd };
  }

  if (!transactionsLoaded) {
    return { deposits: dep, withdrawals: wd };
  }

  if (totals.deposits > 0) {
    dep = alignExchangeSeriesToSummaryTarget(dep, totals.deposits, idx);
    dep = ensurePeakShowsSummaryTotal(dep, totals.deposits, idx);
  }
  if (totals.withdrawals > 0) {
    wd = alignExchangeSeriesToSummaryTarget(wd, totals.withdrawals, idx);
    wd = ensurePeakShowsSummaryTotal(wd, totals.withdrawals, idx);
  }

  return { deposits: dep, withdrawals: wd };
}

/** If buckets are empty, place summary totals in the current month bucket. */
export function applyExchangeChartSummaryFallback(
  deposits: number[],
  withdrawals: number[],
  transactionSummary: TransactionSummary | null | undefined
): { deposits: number[]; withdrawals: number[] } {
  return reconcileExchangeChartBucketsWithSummary(
    deposits,
    withdrawals,
    transactionSummary
  );
}
