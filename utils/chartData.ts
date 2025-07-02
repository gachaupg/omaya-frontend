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
  type: "exchange" | "p2p" | "buy" | "swap" = "exchange"
): DonutChartData[] => {
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
  if (type === "buy" || type === "swap") {
    return [];
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
        transactionSummary.total_approved_exchange_deposits +
        transactionSummary.total_approved_exchange_withdrawals,
      color: "#facc15",
    },
  ];
};

// Dummy data for Referral Commissions (Donut)
export const referralCommissionsData = (
  transactionSummary: TransactionSummary,
  walletData?: {
    balance: number;
    total_earned: number;
    total_withdrawn: number;
  }
): DonutChartData[] => {
  if (walletData) {
    return [
      {
        label: "Available Balance",
        value: walletData.balance || 0,
        color: "#22c55e",
      },
      {
        label: "Total Earned",
        value: walletData.total_earned || 0,
        color: "#3b82f6",
      },
      {
        label: "Total Withdrawn",
        value: walletData.total_withdrawn || 0,
        color: "#ef4444",
      },
    ];
  }

  // Fallback to dummy data if no wallet data
  return [
    {
      label: "Deposits",
      value: transactionSummary.total_approved_exchange_deposits,
      color: "#22c55e",
    },
    {
      label: "Withdrawals",
      value: transactionSummary.total_approved_exchange_withdrawals,
      color: "#ef4444",
    },
  ];
};

// Summary values
export const overviewTotalSummary = (
  transactionSummary: TransactionSummary,
  type: "exchange" | "p2p" | "buy" | "swap" = "exchange"
) => {
  if (type === "p2p") {
    return {
      total: transactionSummary.total_approved_p2p_combined,
      currency: "USD",
    };
  }
  if (type === "buy" || type === "swap") {
    return {
      total: 0,
      currency: "USD",
    };
  }
  return {
    total: transactionSummary.total_approved_exchange_combined,
    currency: "USD",
  };
};

export const referralCommissionsSummary = (
  transactionSummary: TransactionSummary,
  walletData?: {
    balance: number;
    total_earned: number;
    total_withdrawn: number;
  }
) => {
  if (walletData) {
    return {
      total: walletData.total_earned || 0,
      currency: "USD",
    };
  }

  return {
    total: transactionSummary.total_approved_exchange_combined || 0,
    currency: "USD",
  };
};
