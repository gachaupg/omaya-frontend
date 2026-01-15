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
  type: "exchange" | "p2p" | "swap" | "buy" = "exchange"
): DonutChartData[] => {
  if (type === "buy") {
    const status = transactionSummary.total_buy_orders_by_status || {
      pending: 0,
      completed: 0,
      canceled: 0,
      offline: 0,
    };

    return [
      {
        label: "Completed",
        value: status.completed || 0,
        color: "#1D8751",
      },
      {
        label: "Pending",
        value: status.pending || 0,
        color: "#facc15",
      },
      {
        label: "Canceled",
        value: status.canceled || 0,
        color: "#ef4444",
      },
      {
        label: "Offline",
        value: status.offline || 0,
        color: "#64748b",
      },
    ];
  }

  if (type === "p2p") {
    return [
      {
        label: "Deposits",
        value: transactionSummary.total_approved_p2p_deposits,
        color: "#1D8751",
      },
      {
        label: "Withdrawals",
        value: transactionSummary.total_approved_p2p_withdrawals,
        color: "#ef4444",
      },
      {
        label: "In Progress",
        value:
          transactionSummary.total_pending_p2p_deposits +
          transactionSummary.total_pending_p2p_withdrawals,
        color: "#facc15",
      },
    ];
  }
  if (type === "swap") {
    return [
      {
        label: "Completed",
        value: transactionSummary.total_completed_changenow_swaps,
        color: "#1D8751",
      },
      {
        label: "Pending",
        value: transactionSummary.total_pending_changenow_swaps,
        color: "#facc15",
      },
      {
        label: "Failed",
        value: transactionSummary.total_failed_changenow_swaps,
        color: "#ef4444",
      },
    ];
  }
  return [
    {
      label: "Deposits",
      value: transactionSummary.total_approved_exchange_deposits,
      color: "#1D8751",
    },
    {
      label: "Withdrawals",
      value: transactionSummary.total_approved_exchange_withdrawals,
      color: "#ef4444",
    },
    {
      label: "In Progress",
      value:
        transactionSummary.total_pending_exchange_deposits +
        transactionSummary.total_pending_exchange_withdrawals,
      color: "#facc15",
    },
    {
      label: "Exchange",
      value: transactionSummary.total_approved_exchange_net || transactionSummary.total_approved_exchange_combined || 0,
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
  type: "exchange" | "p2p" | "swap" | "buy" = "exchange"
) => {
  if (type === "p2p") {
    return {
      total: transactionSummary.total_approved_p2p_net || transactionSummary.total_approved_p2p_combined || 0,
      currency: "USD",
    };
  }
  if (type === "swap") {
    return {
      total: transactionSummary.total_changenow_swaps,
      currency: "USD",
    };
  }
  if (type === "buy") {
    return {
      total: transactionSummary.total_buy_orders,
      currency: "USD",
    };
  }
  return {
    total:
      (transactionSummary.total_approved_exchange_net || transactionSummary.total_approved_exchange_combined || 0) +
      transactionSummary.total_approved_exchange_deposits +
      transactionSummary.total_approved_exchange_withdrawals +
      transactionSummary.total_pending_exchange_deposits +
      transactionSummary.total_pending_exchange_withdrawals,
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
