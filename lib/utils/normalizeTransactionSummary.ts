import type { TransactionSummary } from "@/components/types";
import type { OrderStatus } from "@/components/types";

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

  const buyByStatus = normalizeOrderStatus(
    s.total_buy_trades_by_status ??
      s.total_buy_orders_by_status ??
      s.total_buy_trades_status
  );
  const sellByStatus = normalizeOrderStatus(
    s.total_sell_trades_by_status ??
      s.total_sell_orders_by_status ??
      s.total_sell_trades_status
  );

  const exchangeVolume = parseSummaryNumber(
    s.total_approved_exchange_volume ??
      s.total_approved_exchange_net ??
      s.total_approved_exchange_combined
  );
  const p2pVolume = parseSummaryNumber(
    s.total_approved_p2p_volume ??
      s.total_approved_p2p_net ??
      s.total_approved_p2p_combined
  );

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
    total_buy_orders_by_status: buyByStatus,
    total_sell_orders_by_status: sellByStatus,
    total_buy_orders: parseSummaryNumber(
      s.total_buy_orders ??
        buyByStatus.completed +
          buyByStatus.pending +
          buyByStatus.canceled +
          buyByStatus.offline
    ),
    total_sell_orders: parseSummaryNumber(
      s.total_sell_orders ??
        sellByStatus.completed +
          sellByStatus.pending +
          sellByStatus.canceled +
          sellByStatus.offline
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
    ...(s.total_buy_trades_by_status
      ? { total_buy_trades_by_status: s.total_buy_trades_by_status }
      : { total_buy_trades_by_status: buyByStatus }),
    ...(s.total_sell_trades_by_status
      ? { total_sell_trades_by_status: s.total_sell_trades_by_status }
      : { total_sell_trades_by_status: sellByStatus }),
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
  } as TransactionSummary;
}

/** USD volume for dashboard exchange line charts (from all-transactions rows). */
export function parseExchangeTransactionUsdVolume(transaction: {
  currency?: string;
  asset?: string;
  to_currency?: string;
  amount?: string | number;
  net_amount?: string | number;
  to_amount?: string | number;
}): number {
  const currency = String(transaction?.currency || "").toUpperCase();
  const asset = String(transaction?.asset || "").toUpperCase();
  const toCurrency = String(transaction?.to_currency || "").toUpperCase();
  const netAmount = parseFloat(String(transaction?.net_amount ?? ""));
  const amount = parseFloat(String(transaction?.amount ?? ""));
  const toAmount = parseFloat(String(transaction?.to_amount ?? ""));

  if (Number.isFinite(netAmount) && netAmount > 0) {
    return netAmount;
  }
  if (currency === "USD" && Number.isFinite(amount)) return amount;
  if (toCurrency === "USD" && Number.isFinite(toAmount)) return toAmount;
  if (currency === "USDT" && Number.isFinite(amount)) return amount;
  if (asset === "USDT" && Number.isFinite(amount)) return amount;
  if (toCurrency === "USDT" && Number.isFinite(toAmount)) return toAmount;
  if (Number.isFinite(amount) && amount > 0) return amount;

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

/** Line chart: approved / completed exchange rows only. */
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
    const amount = parseExchangeTransactionUsdVolume({
      currency: transaction.currency as string,
      asset: transaction.asset as string,
      to_currency: transaction.to_currency as string,
      amount: transaction.amount as string | number,
      net_amount: transaction.net_amount as string | number,
      to_amount: transaction.to_amount as string | number,
    });
    if (!amount || Number.isNaN(amount) || amount > 10_000_000) continue;

    const subType = String(
      transaction.sub_type ??
        transaction.transaction_type ??
        transaction.exchange_type ??
        ""
    )
      .toLowerCase()
      .trim();

    if (subType.includes("deposit")) {
      depositData[monthIndex] += amount;
    } else if (subType.includes("withdraw")) {
      withdrawalData[monthIndex] += amount;
    }
  }

  return { deposits: depositData, withdrawals: withdrawalData };
}

/** If buckets are empty, place summary totals in the current month bucket. */
export function applyExchangeChartSummaryFallback(
  deposits: number[],
  withdrawals: number[],
  transactionSummary: TransactionSummary | null | undefined
): { deposits: number[]; withdrawals: number[] } {
  const dep = [...deposits];
  const wd = [...withdrawals];
  const depSum = dep.reduce((s, v) => s + v, 0);
  const wdSum = wd.reduce((s, v) => s + v, 0);
  if (depSum > 0 || wdSum > 0) return { deposits: dep, withdrawals: wd };

  const totals = exchangeChartApprovedTotalsFromSummary(transactionSummary);
  if (totals.deposits <= 0 && totals.withdrawals <= 0) {
    return { deposits: dep, withdrawals: wd };
  }

  const idx = CHART_MONTH_BUCKETS - 1;
  dep[idx] = totals.deposits;
  wd[idx] = totals.withdrawals;
  return { deposits: dep, withdrawals: wd };
}
