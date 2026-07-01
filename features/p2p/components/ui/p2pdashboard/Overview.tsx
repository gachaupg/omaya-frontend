import React, { useEffect, useMemo } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import { formatCurrency } from "@/lib/globalFormatter";
import {
  getP2PApprovedDepositsVolume,
  getP2PApprovedTradeVolume,
  getP2PApprovedWithdrawalsVolume,
  getP2PBuyTradesByStatus,
  getP2PBuyTradesTotal,
  getP2PCombinedVolume,
  getP2PSellTradesByStatus,
  getP2PSellTradesTotal,
  mergeTransactionSummaries,
  parseSummaryNumber,
} from "@/lib/utils/normalizeTransactionSummary";
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

  useEffect(() => {
    if (isAuthenticated) {
      dispatch<any>(fetchTransactionSummary());
    }
  }, [dispatch, isAuthenticated]);

  // REST has full trade/order breakdown; WS may only send balance/volume — merge both.
  const activeSummary = useMemo(
    () => mergeTransactionSummaries(summary, wsWallet.overviewSummary),
    [summary, wsWallet.overviewSummary]
  );

  const p2pTrades = getP2PApprovedTradeVolume(activeSummary);
  const deposits = Math.max(
    getP2PApprovedDepositsVolume(activeSummary),
    wsWallet.summary.total_approved_p2p_deposits ?? 0
  );
  const withdrawals = Math.max(
    getP2PApprovedWithdrawalsVolume(activeSummary),
    wsWallet.summary.total_approved_p2p_withdrawals ?? 0
  );
  const p2pTotal = getP2PCombinedVolume(activeSummary) || p2pTrades + deposits + withdrawals;
  const segmentTotal = p2pTotal;
  const totalVolume =
    parseSummaryNumber(activeSummary?.total_volume) || segmentTotal || 0;
  const chartTotal = segmentTotal > 0 ? segmentTotal : totalVolume || 1;
  const circumference = 2 * Math.PI * 90;
  const depositsDash = (deposits / chartTotal) * circumference;
  const withdrawalsDash = (withdrawals / chartTotal) * circumference;
  const p2pDash = (p2pTrades / chartTotal) * circumference;

  const buyByStatus = getP2PBuyTradesByStatus(activeSummary);
  const sellByStatus = getP2PSellTradesByStatus(activeSummary);

  const buyCompleted = buyByStatus.completed;
  const buyPending = buyByStatus.pending;
  const buyCanceled = buyByStatus.canceled;
  const buyOffline = buyByStatus.offline;
  const sellCompleted = sellByStatus.completed;
  const sellPending = sellByStatus.pending;
  const sellCanceled = sellByStatus.canceled;
  const sellOffline = sellByStatus.offline;

  const buyTotal = getP2PBuyTradesTotal(activeSummary);
  const sellTotal = getP2PSellTradesTotal(activeSummary);

  const buyProgressPercentage =
    buyTotal > 0 ? (buyCompleted / buyTotal) * 100 : 0;
  const sellProgressPercentage =
    sellTotal > 0 ? (sellCompleted / sellTotal) * 100 : 0;

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
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#FFD600"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${depositsDash} ${circumference - depositsDash}`}
                strokeDashoffset="0"
                strokeLinecap="butt"
              />
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#E23D3A"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${withdrawalsDash} ${circumference - withdrawalsDash}`}
                strokeDashoffset={`-${depositsDash}`}
                strokeLinecap="butt"
              />
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="#386AB5"
                strokeWidth="18"
                fill="none"
                strokeDasharray={`${p2pDash} ${circumference - p2pDash}`}
                strokeDashoffset={`-${depositsDash + withdrawalsDash}`}
                strokeLinecap="butt"
              />
            </svg>
          )}
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
            <span className="text-neutral-500 text-xs sm:text-sm md:text-base">Deposit</span>
            <span className="text-right text-[#0D0D0D] dark:text-white/80 text-xs sm:text-sm">
              {formatCurrency(deposits, "USD")}
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
              {formatCurrency(p2pTotal, "USD")}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col mt-3 sm:mt-4">
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
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[13px] sm:text-base md:text-lg text-[#0D0D0D] dark:text-white/90">
                {formatCurrency(buyTotal, "USD")}
              </span>
            </div>

            <div className="mb-2 sm:mb-3">
              <div className="w-full bg-[#2D2D37] rounded-r-full h-2 sm:h-2.5 md:h-3">
                <div
                  className="bg-[#1D8751] h-2 sm:h-2.5 md:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(buyProgressPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#1D8751]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Completed:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {formatCurrency(buyCompleted, "USD")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Pending:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {formatCurrency(buyPending, "USD")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#788099]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Offline:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {formatCurrency(buyOffline, "USD")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#E23D3A]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">Canceled:</span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {formatCurrency(buyCanceled, "USD")}
                </span>
              </div>
            </div>
          </div>
        </Card>

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
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[13px] sm:text-base md:text-lg text-[#0D0D0D] dark:text-white/90">
                {formatCurrency(sellTotal, "USD")}
              </span>
            </div>

            <div className="mb-2 sm:mb-3">
              <div className="w-full bg-[#2D2D37] h-2 sm:h-2.5 md:h-3 rounded-r-full">
                <div
                  className="bg-[#E23D3A] h-2 sm:h-2.5 md:h-3 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.min(sellProgressPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#1D8751]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Completed:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {formatCurrency(sellCompleted, "USD")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-[#FFD600]" />
                  <span className="text-[10px] sm:text-xs dark:text-[#A0A0A0] text-[#788099]">
                    Pending:
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm dark:text-white/80 text-muted-foreground">
                  {formatCurrency(sellPending, "USD")}
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
                  {formatCurrency(sellOffline, "USD")}
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
                  {formatCurrency(sellCanceled, "USD")}
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
