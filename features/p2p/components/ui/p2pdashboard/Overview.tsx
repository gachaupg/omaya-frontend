import React, { useEffect } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import { useDispatch, useSelector } from "react-redux";
import { selectTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { RootState } from "@/store/rootReducer";

const Overview = () => {
  const dispatch = useDispatch();
  const summary = useSelector(selectTransactionSummary);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch<any>(fetchTransactionSummary());
    }
  }, [dispatch, isAuthenticated]);

  // Calculate totals for the pie chart using API data
  const deposits = summary?.total_approved_p2p_deposits || 0;
  const withdrawals = summary?.total_approved_p2p_withdrawals || 0;
  const inProgress =
    (summary?.total_pending_p2p_deposits || 0) +
    (summary?.total_pending_p2p_withdrawals || 0);
  const p2p = summary?.total_p2p_orders || 0;
  const chartTotal = deposits + withdrawals + inProgress + p2p;
  const transactionTotal = deposits + withdrawals + p2p;
  const circumference = 2 * Math.PI * 90;
  const depositsDash = (deposits / chartTotal) * circumference;
  const withdrawalsDash = (withdrawals / chartTotal) * circumference;
  const inProgressDash = (inProgress / chartTotal) * circumference;
  const p2pDash = (p2p / chartTotal) * circumference;

  // Calculate safe values to prevent NaN
  const safeTotal = chartTotal || 1; // Prevent division by zero
  const safeDeposits = deposits || 0;
  const safeInProgress = inProgress || 0;
  const safeWithdrawals = withdrawals || 0;

  // Calculate stroke dash values safely
  const calculateStrokeDash = (value: number) => {
    const percentage = (value / safeTotal) * 691;
    return `${Math.max(0, percentage)} ${Math.max(0, 691 - percentage)}`;
  };

  // Calculate stroke dash offset safely
  const calculateStrokeDashOffset = (value: number) => {
    return Math.max(0, 173 - (value / safeTotal) * 691);
  };

  // Calculate progress percentages for buy/sell
  const buyProgressPercentage =
    summary?.total_buy_orders && summary?.total_p2p_orders
      ? (summary.total_buy_orders / summary.total_p2p_orders) * 100
      : 0;

  const sellProgressPercentage =
    summary?.total_sell_orders && summary?.total_p2p_orders
      ? (summary.total_sell_orders / summary.total_p2p_orders) * 100
      : 0;

  return (
    <div>
      <h3 className={`text-[${tokens.colors.dark.textTitle}] mb-2 text-sm`}>
        Overview Total
      </h3>
      <Card
        borderColor="border-[#35353E]"
        width="w-full"
        bgColor="bg-[#23232B]"
        borderRadius="rounded-[20px]"
        className="p-6 flex flex-col items-center justify-center"
      >
        <div className="relative w-60 h-60 flex items-center justify-center">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle
              cx="110"
              cy="110"
              r="90"
              stroke="#2D2D37"
              strokeWidth="18"
              fill="none"
            />
            {/* Deposits - Green */}
            <circle
              cx="110"
              cy="110"
              r="90"
              stroke="#1D8751"
              strokeWidth="18"
              fill="none"
              strokeDasharray={`${depositsDash} ${
                circumference - depositsDash
              }`}
              strokeDashoffset="0"
              strokeLinecap="butt"
            />
            {/* Withdrawals - Red */}
            <circle
              cx="110"
              cy="110"
              r="90"
              stroke="#E23D3A"
              strokeWidth="18"
              fill="none"
              strokeDasharray={`${withdrawalsDash} ${
                circumference - withdrawalsDash
              }`}
              strokeDashoffset={`-${depositsDash}`}
              strokeLinecap="butt"
            />
            {/* In Progress - Yellow */}
            <circle
              cx="110"
              cy="110"
              r="90"
              stroke="#FFD600"
              strokeWidth="18"
              fill="none"
              strokeDasharray={`${inProgressDash} ${
                circumference - inProgressDash
              }`}
              strokeDashoffset={`-${depositsDash + withdrawalsDash}`}
              strokeLinecap="butt"
            />
            {/* P2P - Blue */}
            <circle
              cx="110"
              cy="110"
              r="90"
              stroke="#386AB5"
              strokeWidth="18"
              fill="none"
              strokeDasharray={`${p2pDash} ${circumference - p2pDash}`}
              strokeDashoffset={`-${
                depositsDash + withdrawalsDash + inProgressDash
              }`}
              strokeLinecap="butt"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[15px] font-bold text-white">
              {transactionTotal.toLocaleString()} USD
            </span>
            <span className="text-[#A0A0A0] text-base">Transactions</span>
          </div>
        </div>
        <div className="mt-6 w-full flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#1D8751] inline-block" />
            <span className="text-white">Deposits</span>
            <span className="ml-auto text-white">
              {deposits.toLocaleString()} USD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#E23D3A] inline-block" />
            <span className="text-white">Withdrawals</span>
            <span className="ml-auto text-white">
              {withdrawals.toLocaleString()} USD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#FFD600] inline-block" />
            <span className="text-white">In Progress</span>
            <span className="ml-auto text-white">
              {inProgress.toLocaleString()} USD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#386AB5] inline-block" />
            <span className="text-white">P2P</span>
            <span className="ml-auto text-white">
              {p2p.toLocaleString()} USD
            </span>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 flex-col mt-4">
        {/* P2P Buys Card */}
        <Card
          borderColor="border-[#35353E]"
          width="w-full"
          bgColor={`bg-[${tokens.colors.dark.card}]`}
          borderRadius="rounded-[14px]"
          className="p-3"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3
                className={`font-medium text-sm text-[${tokens.colors.dark.textTitle}]`}
              >
                P2P Buys
              </h3>
              <div className="relative">
                <select className="px-2 py-1 rounded text-xs appearance-none pr-8 bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] text-[${tokens.colors.dark.textTitle}]">
                  <option>ALL</option>
                  <option>Today</option>
                  <option>Week</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[${tokens.colors.dark.textTitle}]">
                  ▼
                </span>
              </div>
            </div>

            <div className="text-xl font-bold mb-3 text-[${tokens.colors.dark.textTitle}]">
              {summary?.total_buy_orders.toLocaleString()} USD
            </div>

            <div className="mb-2 w-full">
              <div className="relative w-full h-4 rounded-full bg-[#35353E] overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-4 rounded-full"
                  style={{
                    width: `${Math.min(buyProgressPercentage, 100)}%`,
                    backgroundColor: tokens.colors.brand.primary,
                    transition: "width 0.3s ease-in-out",
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[${tokens.colors.brand.primary}]" />
                  <span className="text-sm text-[${tokens.colors.dark.textBody}]">
                    Completed
                  </span>
                </div>
                <span className="text-[${tokens.colors.dark.textTitle}]">
                  {summary?.total_buy_orders_by_status.completed.toLocaleString()}{" "}
                  USD
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[${tokens.colors.brand.secondary}]" />
                  <span className="text-sm text-[${tokens.colors.dark.textBody}]">
                    In Progress
                  </span>
                </div>
                <span className="text-[${tokens.colors.dark.textTitle}]">
                  {summary?.total_buy_orders_by_status.pending.toLocaleString()}{" "}
                  USD
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* P2P Sells Card */}
        <Card
          borderColor="border-[#35353E]"
          width="w-full"
          bgColor="bg-[${tokens.colors.dark.card}]"
          borderRadius="rounded-[14px]"
          className="p-3"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-[${tokens.colors.dark.textTitle}]">
                P2P Sells
              </h3>
              <div className="relative">
                <select className="px-2 py-1 rounded text-xs appearance-none pr-8 bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] text-[${tokens.colors.dark.textTitle}]">
                  <option>ALL</option>
                  <option>Today</option>
                  <option>Week</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[${tokens.colors.dark.textTitle}]">
                  ▼
                </span>
              </div>
            </div>

            <div className="text-xl font-bold mb-3 text-[${tokens.colors.dark.textTitle}]">
              {summary?.total_sell_orders.toLocaleString()} USD
            </div>

            <div className="mb-2 w-full">
              <div className="relative w-full h-4 rounded-full bg-[#35353E] overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-4 rounded-full"
                  style={{
                    width: `${Math.min(sellProgressPercentage, 100)}%`,
                    backgroundColor: tokens.colors.brand.secondary,
                    transition: "width 0.3s ease-in-out",
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[${tokens.colors.brand.secondary}]" />
                  <span className="text-sm text-[${tokens.colors.dark.textBody}]">
                    Completed
                  </span>
                </div>
                <span className="text-[${tokens.colors.dark.textTitle}]">
                  {summary?.total_sell_orders_by_status.completed.toLocaleString()}{" "}
                  USD
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[${tokens.colors.brand.primary}]" />
                  <span className="text-sm text-[${tokens.colors.dark.textBody}]">
                    In Progress
                  </span>
                </div>
                <span className="text-[${tokens.colors.dark.textTitle}]">
                  {summary?.total_sell_orders_by_status.pending.toLocaleString()}{" "}
                  USD
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
