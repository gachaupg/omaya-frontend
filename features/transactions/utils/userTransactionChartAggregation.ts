import { normalizeExchangeSubType } from "@/lib/utils/exchangeTransactionDisplay";
import { isFiatTicker } from "@/lib/utils/exchangeCurrencyDisplay";
import { parseSummaryNumber } from "@/lib/utils/normalizeTransactionSummary";

const CHART_MONTH_BUCKETS = 12;

function normalizeChartStatus(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

const SUCCESS_CHART_STATUSES = new Set([
  "approved",
  "completed",
  "agent_approved",
  "reviewer_approved",
  "verified",
]);

const FAILED_CHART_STATUSES = new Set([
  "failed",
  "rejected",
  "cancelled",
  "canceled",
  "error",
]);

const PENDING_CHART_STATUSES = new Set([
  "pending",
  "processing",
  "pending_approval",
  "waiting",
  "new",
]);

export function parseUserTransactionChartUsd(
  row: Record<string, unknown>
): number {
  const amount = parseSummaryNumber(row.amount);
  const netAmount = parseSummaryNumber(row.net_amount);
  const toAmount = parseSummaryNumber(row.to_amount);
  const currency = String(row.currency ?? "").toUpperCase();
  const toCurrency = String(row.to_currency ?? "").toUpperCase();

  if (isFiatTicker(currency) && amount > 0) return amount;
  if (isFiatTicker(toCurrency) && toAmount > 0) return toAmount;
  if (amount > 0) return amount;
  if (netAmount > 0) return netAmount;
  if (toAmount > 0) return toAmount;
  return 0;
}

function buildDualSeriesMonthlyBuckets(
  transactions: unknown[],
  options: {
    rowType: string;
    series1: (row: Record<string, unknown>) => boolean;
    series2: (row: Record<string, unknown>) => boolean;
    includeRow?: (row: Record<string, unknown>) => boolean;
  }
): { series1: number[]; series2: number[] } {
  const s1 = Array(CHART_MONTH_BUCKETS).fill(0);
  const s2 = Array(CHART_MONTH_BUCKETS).fill(0);
  const currentDate = new Date();

  for (const raw of transactions) {
    const row = raw as Record<string, unknown>;
    if (String(row.type ?? "").toLowerCase() !== options.rowType) continue;
    if (options.includeRow && !options.includeRow(row)) continue;

    const date = new Date(String(row.created_at ?? row.timestamp ?? ""));
    if (Number.isNaN(date.getTime())) continue;

    const monthDiff =
      (currentDate.getFullYear() - date.getFullYear()) * 12 +
      (currentDate.getMonth() - date.getMonth());
    if (monthDiff < 0 || monthDiff >= CHART_MONTH_BUCKETS) continue;

    const monthIndex = CHART_MONTH_BUCKETS - 1 - monthDiff;
    const amount = parseUserTransactionChartUsd(row);
    if (!amount || amount > 10_000_000) continue;

    if (options.series1(row)) s1[monthIndex] += amount;
    else if (options.series2(row)) s2[monthIndex] += amount;
  }

  return { series1: s1, series2: s2 };
}

function isP2pDeposit(row: Record<string, unknown>): boolean {
  const sub = normalizeExchangeSubType(String(row.sub_type ?? ""));
  return sub === "deposit" || sub.includes("deposit");
}

function isP2pWithdrawal(row: Record<string, unknown>): boolean {
  const sub = normalizeExchangeSubType(String(row.sub_type ?? ""));
  return sub === "withdrawal" || sub.includes("withdraw");
}

/** P2P wallet deposit / withdrawal rows only (excludes buy/sell trades). */
export function buildP2PFundingMonthlyChartBuckets(
  transactions: unknown[]
): { deposits: number[]; withdrawals: number[] } {
  const buckets = buildDualSeriesMonthlyBuckets(transactions, {
    rowType: "p2p",
    includeRow: (row) => {
      if (!SUCCESS_CHART_STATUSES.has(normalizeChartStatus(row.status))) return false;
      return isP2pDeposit(row) || isP2pWithdrawal(row);
    },
    series1: isP2pDeposit,
    series2: isP2pWithdrawal,
  });
  return { deposits: buckets.series1, withdrawals: buckets.series2 };
}

export function buildSwapMonthlyChartBuckets(
  transactions: unknown[]
): { completed: number[]; pending: number[] } {
  const statusOf = (row: Record<string, unknown>) => normalizeChartStatus(row.status);

  const buckets = buildDualSeriesMonthlyBuckets(transactions, {
    rowType: "swap",
    series1: (row) =>
      statusOf(row) === "completed" ||
      SUCCESS_CHART_STATUSES.has(statusOf(row)),
    series2: (row) =>
      PENDING_CHART_STATUSES.has(statusOf(row)) ||
      FAILED_CHART_STATUSES.has(statusOf(row)),
  });

  return { completed: buckets.series1, pending: buckets.series2 };
}

export function buildMoneyXMonthlyChartBuckets(
  transactions: unknown[]
): { completed: number[]; failed: number[] } {
  const statusOf = (row: Record<string, unknown>) => normalizeChartStatus(row.status);

  const buckets = buildDualSeriesMonthlyBuckets(transactions, {
    rowType: "moneyx",
    series1: (row) => SUCCESS_CHART_STATUSES.has(statusOf(row)),
    series2: (row) => FAILED_CHART_STATUSES.has(statusOf(row)),
  });

  return { completed: buckets.series1, failed: buckets.series2 };
}
