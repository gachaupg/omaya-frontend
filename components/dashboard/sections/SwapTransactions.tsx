"use client";
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSwapHistory } from "@/features/swap/hooks/useSwapHistory";
import { SwapTransaction } from "@/features/swap/types";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import { getDefaultAssetIcon, getHighResAssetIcon } from "@/features/express/utils/imageHelpers";
import { StatusBadge } from "@/components/ui/StatusBadge";

const formatRecentTime = (dateValue: string) => {
  const v = formatDistanceToNow(new Date(dateValue), { addSuffix: true });
  return /less than (a|1) minute ago/i.test(v) ? "now" : v;
};

const formatShortId = (value: unknown): string => {
  const s = String(value || "").trim();
  if (!s) return "-";
  if (s.length <= 6) return s;
  return `${s.slice(0, 3)}...${s.slice(-3)}`;
};

const safeImgUrl = (value: unknown): string | undefined => {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
};

const assetImgSrc = (ticker: unknown, remoteUrl: unknown): string => {
  return safeImgUrl(remoteUrl) || getHighResAssetIcon({ ticker: String(ticker ?? "") }) || getDefaultAssetIcon();
};

const SwapTransactions = () => {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useSwapHistory({ page, limit: 10 });
  const { t } = useDashboardI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D8751]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  // Show only completed swaps in the dashboard
  const completedSwaps = (data?.data ?? []).filter((t: SwapTransaction) =>
    ["completed", "finished"].includes((t.status || "").toLowerCase())
  );

  if (!data || !data.data || completedSwaps.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="w-full text-center py-8">
          <div className="flex flex-col items-center justify-center border border-[#35353E] rounded-[24px] p-8 bg-transparent">
            <div className="w-16 h-16 mb-4 rounded-full dark:bg-[#35353E] bg-white flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#788099]"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16H12.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold dark:text-[#788099] mb-2">
              {t("swapTransactions.noTransactionsFound", "No Swap Transactions Found")}
            </h3>
            <p className="text-sm text-[#8C8CA1] text-center max-w-md">
              {t("swapTransactions.noTransactionsDescription", "There are currently no swap transactions to display. Please check back later or try adjusting your filters.")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {completedSwaps.map((transaction: SwapTransaction) => (
          <div
            key={transaction.id}
            className="bg-transparent border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={assetImgSrc(transaction.from_currency, (transaction as any).from_currency_image)}
                  alt={transaction.from_currency}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied === "1") return;
                    img.dataset.fallbackApplied = "1";
                    img.src = getDefaultAssetIcon();
                  }}
                />
                <div>
                  <div className="font-medium text-sm text-[#0D0D0D] dark:text-white">
                    {transaction.from_currency.toUpperCase()} → {transaction.to_currency.toUpperCase()}
                  </div>
                  <div className="text-xs text-[#788099]">
                    {transaction.from_network.toUpperCase()} → {transaction.to_network.toUpperCase()}
                  </div>
                </div>
              </div>
              <StatusBadge status={transaction.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[#788099] mb-1">From Amount</div>
                <div className="text-[#0D0D0D] dark:text-white font-medium">
                  {parseFloat(transaction.amount_expected_from).toFixed(6)} {transaction.from_currency.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#788099] mb-1">To Amount</div>
                <div className="text-[#0D0D0D] dark:text-white font-medium">
                  ≈ {parseFloat(transaction.amount_expected_to).toFixed(2)} {transaction.to_currency.toUpperCase()}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-[#788099] mb-1">Date</div>
                <div className="text-sm text-[#788099]">
                  {formatRecentTime(transaction.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8EFF5] dark:border-[#35353E]">
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                <span className="inline-flex items-center">Asset<SortArrowsIcon /></span>
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                <span className="inline-flex items-center">From<SortArrowsIcon /></span>
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                <span className="inline-flex items-center">To<SortArrowsIcon /></span>
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                <span className="inline-flex items-center">Amount<SortArrowsIcon /></span>
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                <span className="inline-flex items-center">Status<SortArrowsIcon /></span>
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                <span className="inline-flex items-center">When<SortArrowsIcon /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {completedSwaps.map((transaction: SwapTransaction) => (
              <tr
                key={transaction.id}
                className="border-b border-[#E8EFF5] dark:border-[#35353E] hover:bg-[#F5F5F5] dark:hover:bg-[#23232B] transition-colors"
              >
                {/* Asset (show only short id) */}
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm lg:text-base text-[#0D0D0D] dark:text-white truncate">
                        {formatShortId(transaction.id)}
                      </div>
                    </div>
                  </div>
                </td>

                {/* From */}
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={assetImgSrc(transaction.from_currency, (transaction as any).from_currency_image)}
                      alt={transaction.from_currency}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallbackApplied === "1") return;
                        img.dataset.fallbackApplied = "1";
                        img.src = getDefaultAssetIcon();
                      }}
                    />
                    <div className="text-[#0D0D0D] dark:text-white font-medium text-xs sm:text-sm lg:text-base truncate">
                      {transaction.from_currency.toUpperCase()} ({transaction.from_network.toUpperCase()})
                    </div>
                  </div>
                </td>

                {/* To */}
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={assetImgSrc(transaction.to_currency, (transaction as any).to_currency_image)}
                      alt={transaction.to_currency}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallbackApplied === "1") return;
                        img.dataset.fallbackApplied = "1";
                        img.src = getDefaultAssetIcon();
                      }}
                    />
                    <div className="text-[#0D0D0D] dark:text-white font-medium text-xs sm:text-sm lg:text-base truncate">
                      {transaction.to_currency.toUpperCase()} ({transaction.to_network.toUpperCase()})
                    </div>
                  </div>
                </td>

                {/* Amount */}
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="text-[#0D0D0D] dark:text-white font-medium text-xs sm:text-sm lg:text-base">
                    {parseFloat(transaction.amount_expected_from).toFixed(6)} {transaction.from_currency.toUpperCase()}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <StatusBadge status={transaction.status} />
                </td>

                {/* When */}
                <td className="py-3 sm:py-4 px-3 sm:px-4 border-b border-[#E8EFF5] dark:border-[#35353E] text-xs sm:text-sm text-gray-500 dark:text-[#A0A3BC]">
                  {formatRecentTime(transaction.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-[#E8EFF5] dark:border-[#35353E] gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-[#788099] text-center sm:text-left">
            Page {data.page} of {data.pages} ({completedSwaps.length} completed)
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={page === 1}
              className="px-3 sm:px-4 py-2 rounded-lg border border-[#E8EFF5] dark:border-[#35353E] text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5F5F5] dark:hover:bg-[#23232B] transition-colors min-h-[44px] sm:min-h-0 lg:min-h-0"
            >
              Previous
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPage((prev) => Math.min(data.pages, prev + 1));
              }}
              disabled={page === data.pages}
              className="px-3 sm:px-4 py-2 rounded-lg border border-[#E8EFF5] dark:border-[#35353E] text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5F5F5] dark:hover:bg-[#23232B] transition-colors min-h-[44px] sm:min-h-0 lg:min-h-0"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapTransactions;
