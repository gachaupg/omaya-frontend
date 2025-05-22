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
export const overviewTotalData: DonutChartData[] = [
  { label: "Deposits", value: 25000, color: "#22c55e" },
  { label: "Withdrawals", value: 8000, color: "#ef4444" },
  { label: "In Progress", value: 4000, color: "#facc15" },
  { label: "Exchange", value: 1400, color: "#3b82f6" },
];

// Dummy data for Referral Commissions (Donut)
export const referralCommissionsData: DonutChartData[] = [
  { label: "Deposits", value: 30000, color: "#22c55e" },
  { label: "Withdrawals", value: 5000, color: "#ef4444" },
];

// Summary values
export const overviewTotalSummary = {
  total: 35000,
  currency: "USD",
};

export const referralCommissionsSummary = {
  total: 3400,
  currency: "USD",
};
