import { TransactionSummary } from "@/components/types";
import {
  getP2PApprovedTradeVolume,
  getP2PApprovedDepositsVolume,
  getP2PApprovedWithdrawalsVolume,
  getP2PBuyOrdersByStatus,
  getP2PCombinedVolume,
  getP2PSellOrdersByStatus,
  parseSummaryNumber,
  sanitizeExchangeSummaryUsd,
} from "@/lib/utils/normalizeTransactionSummary";

// Types for chart data
export type LineChartData = {
  label: string;
  data: number[];
};

export type DonutChartData = {
  label: string;
  value: number;
  color: string;
};

function normalizeDonutNumber(n: unknown): number {
  const v = typeof n === "number" ? n : Number.parseFloat(String(n ?? 0));
  return Number.isFinite(v) ? v : 0;
}

/**
 * Merge duplicate labels (case-insensitive) by summing their values.
 * Keeps the first-seen color for a label.
 */
function dedupeDonutData(data: DonutChartData[]): DonutChartData[] {
  const map = new Map<string, DonutChartData>();
  for (const item of data) {
    const label = String(item.label ?? "").trim();
    if (!label) continue;
    const key = label.toLowerCase();
    const value = Math.abs(normalizeDonutNumber(item.value));
    if (!map.has(key)) {
      map.set(key, { label, value, color: item.color });
      continue;
    }
    const prev = map.get(key)!;
    map.set(key, { ...prev, value: prev.value + value });
  }
  return Array.from(map.values());
}

/** Approved P2P wallet deposits / funding (part of P2P volume, not exchange). */
function getApprovedP2pDepositsVolume(
  transactionSummary: TransactionSummary
): number {
  return getP2PApprovedDepositsVolume(transactionSummary);
}

function getExchangeOverviewLegendAmounts(
  transactionSummary: TransactionSummary
) {
  const deposits = sanitizeExchangeSummaryUsd(
    transactionSummary.total_approved_exchange_deposits
  );
  const withdrawals = sanitizeExchangeSummaryUsd(
    transactionSummary.total_approved_exchange_withdrawals
  );
  const pendingDeposits = sanitizeExchangeSummaryUsd(
    transactionSummary.total_pending_exchange_deposits
  );
  const pendingWithdrawals = sanitizeExchangeSummaryUsd(
    transactionSummary.total_pending_exchange_withdrawals
  );
  const exchangeNet = sanitizeExchangeSummaryUsd(
    transactionSummary.total_approved_exchange_volume ??
      transactionSummary.total_approved_exchange_net ??
      transactionSummary.total_approved_exchange_combined
  );

  return {
    deposits,
    withdrawals,
    pendingDeposits,
    pendingWithdrawals,
    exchangeNet: exchangeNet > 0 ? exchangeNet : deposits + withdrawals,
  };
}

// Dummy data for Exchange Overview (USD)
export const exchangeOverviewData: LineChartData = {
  label: "Deposits",
  data: [
    5000, 7000, 3000, 4000, 6000, 2000, 2500, 3000, 4500, 8000, 10000, 9000,
  ],
};

// Dummy data for P2P Overview (USD)
export const p2pOverviewData: LineChartData = {
  label: "Sells",
  data: [
    4000, 6000, 2000, 3500, 5000, 1500, 2000, 2500, 4000, 7000, 11000, 9500,
  ],
};

// Dummy data for Overview Total (Donut)
export const overviewTotalData = (
  transactionSummary: TransactionSummary,
  type: "exchange" | "p2p" | "swap" | "buy" | "moneyx" = "exchange"
): DonutChartData[] => {
  const getStatusValue = (obj: any, key: "completed" | "pending" | "canceled" | "offline") => {
    if (!obj) return 0;
    if (key === "canceled") {
      return Number(obj.canceled ?? obj.cancelled) || 0;
    }
    return Number(obj[key]) || 0;
  };

  if (type === "buy") {
    const status = getP2PBuyOrdersByStatus(transactionSummary);

    return dedupeDonutData([
      {
        label: "Completed",
        value: getStatusValue(status, "completed"),
        color: "#1D8751",
      },
      {
        label: "Pending",
        value: getStatusValue(status, "pending"),
        color: "#facc15",
      },
      {
        label: "Offline",
        value: getStatusValue(status, "offline"),
        color: "#64748b",
      },
    ]);
  }

  if (type === "p2p") {
    const p2pTrades = getP2PApprovedTradeVolume(transactionSummary);
    const p2pDeposits = getApprovedP2pDepositsVolume(transactionSummary);
    const p2pWithdrawals = getP2PApprovedWithdrawalsVolume(transactionSummary);

    return dedupeDonutData([
      {
        label: "Deposit",
        value: Math.abs(p2pDeposits),
        color: "#FFD600",
      },
      {
        label: "Withdrawals",
        value: Math.abs(p2pWithdrawals),
        color: "#E23D3A",
      },
      {
        label: "P2P",
        value: Math.abs(p2pTrades),
        color: "#386AB5",
      },
    ]);
  }
  if (type === "swap") {
    return dedupeDonutData([
      {
        label: "Completed",
        value: parseSummaryNumber(
          transactionSummary.total_completed_changenow_swaps
        ),
        color: "#1D8751",
      },
      {
        label: "Pending",
        value: parseSummaryNumber(
          transactionSummary.total_pending_changenow_swaps
        ),
        color: "#facc15",
      },
      {
        label: "Failed",
        value: parseSummaryNumber(transactionSummary.total_failed_changenow_swaps),
        color: "#ef4444",
      },
    ]);
  }
  if (type === "moneyx") {
    const moneyxStatus = (transactionSummary as any).total_moneyx_by_status || {};
    const completedLike =
      (moneyxStatus.approved || 0) +
      (moneyxStatus.completed || 0) +
      (moneyxStatus.agent_approved || 0) +
      (moneyxStatus.reviewer_approved || 0);
    const failedAmount = moneyxStatus.failed || 0;

    return dedupeDonutData([
      {
        label: "Completed",
        value: Math.abs(completedLike),
        color: "#1D8751",
      },
      {
        label: "Failed",
        value: Math.abs(failedAmount),
        color: "#ef4444",
      },
    ]);
  }
  const { deposits, withdrawals, pendingDeposits, pendingWithdrawals, exchangeNet } =
    getExchangeOverviewLegendAmounts(transactionSummary);

  return dedupeDonutData([
    {
      label: "Deposits",
      value: deposits,
      color: "#1D8751",
    },
    {
      label: "Withdrawals",
      value: withdrawals,
      color: "#ef4444",
    },
    {
      label: "In Progress",
      value: pendingDeposits + pendingWithdrawals,
      color: "#facc15",
    },
    {
      label: "Exchange",
      value: exchangeNet,
      color: "#386AB5",
    },
  ]);
};

// Helper function to calculate time period multiplier
const getTimePeriodMultiplier = (timePeriod: string): number => {
  switch (timePeriod) {
    case "Last Week":
      return 0.25; // ~1 week out of a month
    case "Month":
      return 1; // Full month
    case "One Year":
      return 12; // Full year
    case "All":
    default:
      return 1; // Default to full amount
  }
};

// Dummy data for Referral Commissions (Donut)
export const referralCommissionsData = (
  transactionSummary: TransactionSummary,
  walletData?: {
    balance: number;
    total_earned: number;
    total_withdrawn: number;
  },
  timePeriod: string = "All"
): DonutChartData[] => {
  const multiplier = getTimePeriodMultiplier(timePeriod);
  
  if (walletData) {
    // For "All", show full amounts; for other periods, show proportional amounts
    const balanceValue = timePeriod === "All" ? walletData.balance : walletData.balance * multiplier;
    const earnedValue = timePeriod === "All" ? walletData.total_earned : walletData.total_earned * multiplier;
    const withdrawnValue = timePeriod === "All" ? walletData.total_withdrawn : walletData.total_withdrawn * multiplier;
    
    return [
      {
        label: "Available Balance",
        value: Math.round(balanceValue * 100) / 100 || 0,
        color: "#22c55e",
      },
      {
        label: "Total Earned",
        value: Math.round(earnedValue * 100) / 100 || 0,
        color: "#3b82f6",
      },
      {
        label: "Total Withdrawals",
        value: Math.round(withdrawnValue * 100) / 100 || 0,
        color: "#ef4444",
      },
    ];
  }

  // Fallback to dummy data if no wallet data
  const depositsValue = timePeriod === "All" 
    ? transactionSummary.total_approved_exchange_deposits 
    : transactionSummary.total_approved_exchange_deposits * multiplier;
  const withdrawalsValue = timePeriod === "All" 
    ? transactionSummary.total_approved_exchange_withdrawals 
    : transactionSummary.total_approved_exchange_withdrawals * multiplier;
    
  return [
    {
      label: "Deposits",
      value: Math.round(depositsValue * 100) / 100,
      color: "#22c55e",
    },
    {
      label: "Withdrawals",
      value: Math.round(withdrawalsValue * 100) / 100,
      color: "#ef4444",
    },
  ];
};

// Summary values
export const overviewTotalSummary = (
  transactionSummary: TransactionSummary,
  type: "exchange" | "p2p" | "swap" | "buy" | "moneyx" = "exchange"
) => {
  if (type === "p2p") {
    const totalFromApi = parseSummaryNumber(transactionSummary.total_volume);
    const combined = getP2PCombinedVolume(transactionSummary);
    return {
      total: Math.abs(totalFromApi > 0 ? totalFromApi : combined),
      currency: "USD",
    };
  }
  if (type === "swap") {
    const completed = parseSummaryNumber(
      transactionSummary.total_completed_changenow_swaps
    );
    const pending = parseSummaryNumber(
      transactionSummary.total_pending_changenow_swaps
    );
    const failed = parseSummaryNumber(transactionSummary.total_failed_changenow_swaps);
    const total =
      parseSummaryNumber(transactionSummary.total_changenow_swaps) ||
      completed + pending + failed;
    return {
      total: Math.abs(total),
      currency: "USD",
    };
  }
  if (type === "buy") {
    const buyStatus = getP2PBuyOrdersByStatus(transactionSummary);
    const buyTotal =
      buyStatus.completed + buyStatus.pending + buyStatus.offline;
    return {
      total: Math.abs(buyTotal || transactionSummary.total_buy_orders || 0),
      currency: "USD",
    };
  }
  if (type === "moneyx") {
    const moneyxStatus = (transactionSummary as any).total_moneyx_by_status || {};
    const completed = Math.abs(
      (moneyxStatus.approved || 0) +
        (moneyxStatus.completed || 0) +
        (moneyxStatus.agent_approved || 0) +
        (moneyxStatus.reviewer_approved || 0)
    );
    const failed = Math.abs(moneyxStatus.failed || 0);
    return {
      // Pending/rejected intentionally excluded from center total per UX requirement.
      total: completed + failed,
      currency: "USD",
    };
  }
  const { exchangeNet } = getExchangeOverviewLegendAmounts(transactionSummary);
  return {
    total: exchangeNet,
    currency: "USD",
  };
};

export const referralCommissionsSummary = (
  transactionSummary: TransactionSummary,
  walletData?: {
    balance: number;
    total_earned: number;
    total_withdrawn: number;
  },
  timePeriod: string = "All"
) => {
  const multiplier = getTimePeriodMultiplier(timePeriod);
  
  if (walletData) {
    const total = timePeriod === "All" 
      ? walletData.total_earned 
      : walletData.total_earned * multiplier;
    return {
      total: Math.round((total || 0) * 100) / 100,
      currency: "USD",
    };
  }

  const baseTotal = transactionSummary.total_approved_exchange_net || transactionSummary.total_approved_exchange_combined || 0;
  const total = timePeriod === "All" ? baseTotal : baseTotal * multiplier;
  
  return {
    total: Math.round(total * 100) / 100,
    currency: "USD",
  };
};
