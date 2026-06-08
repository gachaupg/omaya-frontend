import React, { useEffect, useState } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import { formatCurrency } from "@/lib/globalFormatter";
import { parseSummaryNumber } from "@/lib/utils/normalizeTransactionSummary";
import { useDispatch, useSelector } from "react-redux";
import { selectTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { RootState } from "@/store/rootReducer";
import { useP2PWalletBalanceContext } from "@/features/p2p/context/P2PWalletBalanceProvider";

const Overview = () => {
  const dispatch = useDispatch();
  const summary = useSelector(selectTransactionSummary);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const wsWallet = useP2PWalletBalanceContext();
  const [buyDateFilter, setBuyDateFilter] = useState("ALL");
  const [sellDateFilter, setSellDateFilter] = useState("ALL");

  useEffect(() => {
    if (isAuthenticated) {
      dispatch<any>(fetchTransactionSummary());
    }
  }, [dispatch, isAuthenticated]);

  // Prefer live wallet-balance WebSocket; fall back to REST until first WS message
  const activeSummary = wsWallet.overviewSummary ?? summary;

  const p2pDeposits = parseSummaryNumber(
    activeSummary?.total_approved_p2p_deposits
  );
  const p2pTradeVolume = parseSummaryNumber(
    activeSummary?.total_approved_p2p_volume
  );
  /** Trades + approved P2P deposits (funding); matches API total_volume */
  const p2p = p2pTradeVolume + p2pDeposits;
  const withdrawals = parseSummaryNumber(
    activeSummary?.total_approved_p2p_withdrawals
  );
  const inProgress =
    parseSummaryNumber(activeSummary?.total_pending_p2p_deposits) +
    parseSummaryNumber(activeSummary?.total_pending_p2p_withdrawals);
  const segmentTotal = withdrawals + inProgress + p2p;
  /** API `total_volume` (e.g. "91.09 USD") is the canonical dashboard total. */
  const totalVolume =
    parseSummaryNumber(activeSummary?.total_volume) || segmentTotal || 0;
  const chartTotal = segmentTotal > 0 ? segmentTotal : totalVolume || 1;
  const circumference = 2 * Math.PI * 90;
  // Order: Pending, Withdrawals, P2P (deposits included in P2P)
  const pendingDash = (inProgress / chartTotal) * circumference;
  const withdrawalsDash = (withdrawals / chartTotal) * circumference;
  const p2pDash = (p2p / chartTotal) * circumference;

  // Calculate safe values to prevent NaN
  const safeTotal = chartTotal || 1; // Prevent division by zero
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

  const buyByStatus =
    (activeSummary as any)?.total_buy_trades_by_status ||
    activeSummary?.total_buy_orders_by_status ||
    {};
  const buyCompleted = Number(buyByStatus.completed) || 0;
  const buyPending = Number(buyByStatus.pending) || 0;
  const buyCanceled = Number(buyByStatus.canceled ?? buyByStatus.cancelled) || 0;
  const buyOffline = Number(buyByStatus.offline) || 0;
  const buyTotal = buyCompleted + buyPending + buyCanceled + buyOffline;

  const sellByStatus =
    (activeSummary as any)?.total_sell_trades_by_status ||
    activeSummary?.total_sell_orders_by_status ||
    {};
  const sellCompleted = Number(sellByStatus.completed) || 0;
  const sellPending = Number(sellByStatus.pending) || 0;
  const sellCanceled = Number(sellByStatus.canceled ?? sellByStatus.cancelled) || 0;
  const sellOffline = Number(sellByStatus.offline) || 0;
  const sellTotal = sellCompleted + sellPending + sellCanceled + sellOffline;

  const buyProgressPercentage = buyTotal > 0 ? (buyCompleted / buyTotal) * 100 : 0;
  const sellProgressPercentage = sellTotal > 0 ? (sellCompleted / sellTotal) * 100 : 0;

  // Check if there's no data (chartTotal includes pending, withdrawals, p2p)
  const hasNoData = chartTotal === 0;

  return (
    <div className="w-full">

      <h3 className="dark:text-white text-[#0D0D0D] mb-2 text-xs sm:text-sm font-medium">
        Overview Total
      </h3>
      <Card
        borderColor="border-[#E8EFF5] dark:border-[#35353E]"
        width="w-full"
        bgColor="dark:bg-[var(--card-color)] bg-white"
        borderRadius="rounded-[20px]"
        className="p-2 md:p-4 flex flex-col items-stretch justify-center border"
      >
        <div className="relative w-full max-w-[220px] aspect-square mx-auto flex items-center justify-center">
          {hasNoData ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#35353E"
                strokeWidth="18"
                fill="none"
              />
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#35353E"
                strokeWidth="18"
                fill="none"
                strokeDasharray="565.48 565.48"
                strokeDashoffset="0"
                strokeLinecap="butt"
              />
            </svg>
          ) : (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#2D2D37"
                strokeWidth="18"
                fill="none"
              />
              {/* Pending - Yellow */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#FFD600"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${pendingDash} ${circumference - pendingDash}`}
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
                strokeDasharray={`${withdrawalsDash} ${circumference - withdrawalsDash}`}
                strokeDashoffset={`-${pendingDash}`}
                strokeLinecap="butt"
              />
              {/* P2P - Blue (trades + approved P2P deposits / funding) */}
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#386AB5"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${p2pDash} ${circumference - p2pDash}`}
                strokeDashoffset={`-${pendingDash + withdrawalsDash}`}
                strokeLinecap="butt"
              />
            </svg>
          )}
          {/* Center totals (matches deposits/withdrawals/p2p values below). */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-0.5 px-2">
            <div className="text-[10px] sm:text-xs md:text-[13px] leading-tight text-neutral-500 dark:text-gray-400">
              <span className="text-[#0D0D0D] dark:text-white/80 font-semibold">
                {formatCurrency(totalVolume, "USD")}
              </span>
            </div>
            <div className="text-[10px] sm:text-xs md:text-[13px] leading-tight text-neutral-500 dark:text-gray-400">
              <span className="text-[#0D0D0D] dark:text-white/80 font-semibold">
                Total Volume
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 md:mt-6 w-full flex flex-col gap-1.5 sm:gap-2">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600] inline-block flex-shrink-0" />
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base">Pending</span>
            <span className="text-right text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {formatCurrency(inProgress, "USD")}
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#E23D3A] inline-block flex-shrink-0" />
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base truncate max-w-20 sm:max-w-[120px]">Withdrawals</span>
            <span className="text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {formatCurrency(withdrawals, "USD")}
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#386AB5] inline-block flex-shrink-0" />
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base">P2P</span>
            <span className="text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {formatCurrency(p2p, "USD")}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex  flex-col mt-3 sm:mt-4">
        {/* P2P Buys Card */}
        <h3 className="mb-3 font-medium text-sm sm:text-base dark:text-white text-[#0D0D0D]">
          P2P Buys
        </h3>
        <Card
          borderColor="border-[#E8EFF5] dark:border-[#35353E]"
          width="w-full"
          bgColor="dark:bg-[var(--card-color)] bg-white"
          borderRadius="rounded-[14px]"
          className="p-2 md:p-4 mb-2 sm:mb-4 border"
        >
          <div className="flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[13px] sm:text-base md:text-lg text-[#0D0D0D] dark:text-white/90">
                {buyTotal.toLocaleString()} <span className="text-xs text-gray-500">USD</span>
              </span>
            </div>

            {/* Progress */}
            <div className="mb-2 sm:mb-3">
              <div className="w-full bg-[#2D2D37] rounded-r-full h-2 sm:h-2.5 md:h-3">
                <div
                  className="bg-[#1D8751] h-2 sm:h-2.5 md:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(buyProgressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5 sm:gap-2">

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#1D8751]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Completed:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {buyCompleted.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Pending:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {buyPending.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#E23D3A]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Canceled:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {buyCanceled.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#788099]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Offline:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {buyOffline.toLocaleString()}
                </span>
              </div>

            </div>

          </div>
        </Card>


        {/* P2P Sells Card */}
        <h3 className="mb-3 font-medium text-sm sm:text-base dark:text-white text-[#0D0D0D]">
          P2P Sells
        </h3>
        <Card
          borderColor="border-[#E8EFF5] dark:border-[#35353E]"
          width="w-full"
          bgColor="dark:bg-[var(--card-color)] bg-white"
          borderRadius="rounded-[14px]"
          className="p-2 sm:p-3 md:p-4 border"
        >
          <div className="flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[13px] sm:text-base md:text-lg text-[#0D0D0D] dark:text-white/90">
                {sellTotal.toLocaleString()} <span className="text-xs text-gray-500">USD</span>
              </span>

              <div className="relative flex-shrink-0">
                <select
                  className="
            px-2 sm:px-3 
            py-1 sm:py-1.5 
            rounded 
            text-[10px] sm:text-xs md:text-sm 
            appearance-none 
            pr-5 sm:pr-7 
            dark:bg-[var(--card-color)] bg-white 
            dark:text-[#A0A0A0] text-[#788099]
          "
                  value={sellDateFilter}
                  onChange={(e) => setSellDateFilter(e.target.value)}
                >
                  <option value="ALL">ALL</option>
                  <option value="Today">Today</option>
                  <option value="Week">Week</option>
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                </select>

                <div className="absolute inset-y-0 right-0 flex items-center pr-1 sm:pr-2 pointer-events-none">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 dark:text-white text-[#0D0D0D]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-2 sm:mb-3">
              <div className="w-full bg-[#2D2D37] h-2 sm:h-2.5 md:h-3 rounded-r-full">
                <div
                  className="bg-[#E23D3A] h-2 sm:h-2.5 md:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(sellProgressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5 sm:gap-2">

              {/* Completed */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#1D8751]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Completed:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {sellCompleted.toLocaleString()}
                </span>
              </div>

              {/* Pending */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Pending:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {sellPending.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#E23D3A]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Canceled:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {sellCanceled.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#788099]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Offline:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {sellOffline.toLocaleString()}
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
