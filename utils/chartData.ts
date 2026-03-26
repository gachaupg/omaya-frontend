import { TransactionSummary } from "@/components/types";

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
    const status =
      (transactionSummary as any).total_buy_trades_by_status ||
      transactionSummary.total_buy_orders_by_status || {
      pending: 0,
      completed: 0,
      canceled: 0,
      offline: 0,
    };

    return [
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
        label: "Canceled",
        value: getStatusValue(status, "canceled"),
        color: "#ef4444",
      },
      {
        label: "Offline",
        value: getStatusValue(status, "offline"),
        color: "#64748b",
      },
    ];
  }

  if (type === "p2p") {
    const buyStatus = (transactionSummary as any).total_buy_trades_by_status || {};
    const sellStatus = (transactionSummary as any).total_sell_trades_by_status || {};

    return [
      {
        label: "Completed",
        value: Math.abs(
          getStatusValue(buyStatus, "completed") + getStatusValue(sellStatus, "completed")
        ),
        color: "#1D8751",
      },
      {
        label: "Pending",
        value: Math.abs(
          getStatusValue(buyStatus, "pending") + getStatusValue(sellStatus, "pending")
        ),
        color: "#facc15",
      },
      {
        label: "Canceled",
        value: Math.abs(
          getStatusValue(buyStatus, "canceled") + getStatusValue(sellStatus, "canceled")
        ),
        color: "#ef4444",
      },
      {
        label: "Offline",
        value: Math.abs(
          getStatusValue(buyStatus, "offline") + getStatusValue(sellStatus, "offline")
        ),
        color: "#64748b",
      },
    ];
  }
  if (type === "swap") {
    // Dashboard swap: show only completed swaps
    return [
      {
        label: "Completed",
        value: transactionSummary.total_completed_changenow_swaps ?? 0,
        color: "#1D8751",
      },
    ];
  }
  if (type === "moneyx") {
    const moneyxStatus = (transactionSummary as any).total_moneyx_by_status || {};
    const completedLike =
      (moneyxStatus.approved || 0) +
      (moneyxStatus.completed || 0) +
      (moneyxStatus.agent_approved || 0) +
      (moneyxStatus.reviewer_approved || 0);
    const failedAmount = moneyxStatus.failed || 0;

    return [
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
    ];
  }
  return [
    {
      label: "Deposits",
      value: Math.abs(transactionSummary.total_approved_exchange_deposits || 0),
      color: "#1D8751",
    },
    {
      label: "Withdrawals",
      value: Math.abs(transactionSummary.total_approved_exchange_withdrawals || 0),
      color: "#ef4444",
    },
    {
      label: "In Progress",
      value: Math.abs(
        (transactionSummary.total_pending_exchange_deposits || 0) +
        (transactionSummary.total_pending_exchange_withdrawals || 0)
      ),
      color: "#facc15",
    },
    {
      label: "Exchange",
      value: Math.abs(
        transactionSummary.total_approved_exchange_net ??
          transactionSummary.total_approved_exchange_combined ??
          0
      ),
      color: "#386AB5",
    },
  ];
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
    const buyStatus = (transactionSummary as any).total_buy_trades_by_status || {};
    const sellStatus = (transactionSummary as any).total_sell_trades_by_status || {};
    const completed = Number(buyStatus.completed || 0) + Number(sellStatus.completed || 0);
    const pending = Number(buyStatus.pending || 0) + Number(sellStatus.pending || 0);
    const canceled =
      Number(buyStatus.canceled ?? buyStatus.cancelled ?? 0) +
      Number(sellStatus.canceled ?? sellStatus.cancelled ?? 0);
    const offline = Number(buyStatus.offline || 0) + Number(sellStatus.offline || 0);
    const netValue = completed + pending + canceled + offline;
    return {
      total: Math.abs(netValue),
      currency: "USD",
    };
  }
  if (type === "swap") {
    return {
      total: Math.abs(transactionSummary.total_completed_changenow_swaps ?? 0),
      currency: "USD",
    };
  }
  if (type === "buy") {
    const buyStatus =
      (transactionSummary as any).total_buy_trades_by_status ||
      transactionSummary.total_buy_orders_by_status ||
      {};
    const buyTotal =
      Number(buyStatus.completed || 0) +
      Number(buyStatus.pending || 0) +
      Number(buyStatus.canceled ?? buyStatus.cancelled ?? 0) +
      Number(buyStatus.offline || 0);
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
  // For Exchange Overview center value, show the approved exchange net amount from API.
  const exchangeNet = Math.abs(
    transactionSummary.total_approved_exchange_net ??
      transactionSummary.total_approved_exchange_combined ??
      0
  );
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
