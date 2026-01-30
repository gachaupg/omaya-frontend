"use client";
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSwapHistory } from "@/features/swap/hooks/useSwapHistory";
import { SwapTransaction } from "@/features/swap/types";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "finished":
    case "completed":
      return "bg-green-500/10 text-green-500";
    case "waiting":
    case "pending":
      return "bg-yellow-500/10 text-yellow-500";
    case "confirming":
    case "exchanging":
      return "bg-blue-500/10 text-blue-500";
    case "sending":
      return "bg-purple-500/10 text-purple-500";
    case "failed":
    case "refunded":
    case "expired":
      return "bg-red-500/10 text-red-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
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

  if (!data || !data.data || data.data.length === 0) {
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
        {data.data.map((transaction: SwapTransaction) => (
          <div
            key={transaction.id}
            className="bg-transparent border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={transaction.from_currency_image}
                  alt={transaction.from_currency}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "/images/placeholder.svg";
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
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  transaction.status
                )}`}
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
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
                  {formatDistanceToNow(new Date(transaction.created_at), {
                    addSuffix: true,
                  })}
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
                Transaction
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                Amount
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                Status
              </th>
              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-[#788099]">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((transaction: SwapTransaction) => (
              <tr
                key={transaction.id}
                className="border-b border-[#E8EFF5] dark:border-[#35353E] hover:bg-[#F5F5F5] dark:hover:bg-[#23232B] transition-colors"
              >
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <img
                      src={transaction.from_currency_image}
                      alt={transaction.from_currency}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder.svg";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm lg:text-base text-[#0D0D0D] dark:text-white truncate">
                        {transaction.from_currency.toUpperCase()} → {transaction.to_currency.toUpperCase()}
                      </div>
                      <div className="text-xs text-[#788099] truncate">
                        {transaction.from_network.toUpperCase()} → {transaction.to_network.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="text-[#0D0D0D] dark:text-white font-medium text-xs sm:text-sm lg:text-base">
                    {parseFloat(transaction.amount_expected_from).toFixed(6)} {transaction.from_currency.toUpperCase()}
                  </div>
                  <div className="text-xs text-[#788099]">
                    ≈ {parseFloat(transaction.amount_expected_to).toFixed(2)} {transaction.to_currency.toUpperCase()}
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-4">
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-4 border-b border-[#E8EFF5] dark:border-[#35353E] text-xs sm:text-sm text-gray-500 dark:text-[#A0A3BC]">
                  {formatDistanceToNow(new Date(transaction.created_at), {
                    addSuffix: true,
                  })}
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
            Page {data.page} of {data.pages} ({data.total} total)
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
