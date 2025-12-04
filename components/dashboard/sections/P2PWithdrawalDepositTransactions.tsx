"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchMyTransactions, setCurrentPage } from "@/features/p2p/slices/p2pWithdrawalDepositSlice";
import { formatDistanceToNow } from "date-fns";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

interface RootState {
  p2pWithdrawalDeposit: {
    transactions: {
      results: any[];
      count: number;
      next: string | null;
      previous: string | null;
    } | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
  };
}

const getAssetName = (symbol: string) => {
  switch (symbol) {
    case "BTC":
      return "Bitcoin";
    case "ETH":
      return "Ethereum";
    case "USDT":
      return "Tether";
    default:
      return symbol;
  }
};

const getPaymentMethodInitials = (method: string | null): string => {
  if (!method) return "PM";
  const words = method.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return method.substring(0, 2).toUpperCase();
};

const extractPaymentInfo = (tx: any) => {
  const providerName = tx?.payment_provider || null;
  const methodLabel = tx?.payment_method || null;
  // Try to get provider logo from transaction data
  // If not available, we'll use initials
  const providerLogo = tx?.provider_logo || tx?.logo || null;
  const displayImage = providerLogo;
  const initials = getPaymentMethodInitials(methodLabel);

  return {
    displayImage,
    providerName,
    methodLabel,
    initials,
  };
};

const P2PWithdrawalDepositTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useDashboardI18n();
  const { transactions, loading, error, currentPage } = useSelector(
    (state: RootState) => state.p2pWithdrawalDeposit
  );
  const itemsPerPage = 10;

  /* -------------------------- fetch data ----------------------------- */
  useEffect(() => {
    dispatch(fetchMyTransactions(currentPage));
  }, [dispatch, currentPage]);

  /* --------------------------- loading / error ----------------------- */
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
        {t("common.error", "Error")}: {error}
      </div>
    );
  }

  if (
    !transactions ||
    !transactions.results ||
    transactions.results.length === 0
  ) {
    return (
      <NoDataFound
        title={t(
          "transactions.noTransactions",
          "No P2P Withdrawal/Deposit Transactions Found"
        )}
        message={t(
          "transactions.noTransactions",
          "There are currently no P2P withdrawal/deposit transactions to display. Please check back later or try adjusting your filters."
        )}
      />
    );
  }

  // Sort transactions by timestamp (newest first)
  const sortedResults = [...transactions.results].sort((a: any, b: any) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA; // Sort in descending order (newest first)
  });

  const totalPages = Math.ceil(transactions.count / itemsPerPage);
  
  // Use the results directly from API (already paginated)
  const paginatedResults = sortedResults;

  const handlePageChange = (pageNumber: number) => {
    dispatch(setCurrentPage(pageNumber));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {/* Show count info */}
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center px-2">
          {t("transactions.showing", "Showing")} {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, transactions.count)} {t("transactions.of", "of")} {transactions.count} {t("transactions.transactions", "transactions")}
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
              ${
                currentPage > 1
                  ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
              }`}
          >
            {t("common.previous", "Previous")}
          </button>
          
          {startPage > 1 && <span className="text-gray-500 text-xs sm:text-sm">…</span>}
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`mx-0.5 sm:mx-1 px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
                ${
                  pageNum === currentPage
                    ? "bg-[#1D8751] text-white border-[#1D8751]"
                    : "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                }`}
            >
              {pageNum}
            </button>
          ))}
          {endPage < totalPages && <span className="text-gray-500 text-xs sm:text-sm">…</span>}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
              ${
                currentPage < totalPages
                  ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
              }`}
          >
            {t("common.next", "Next")}
          </button>
        </div>
      </div>
    );
  };

  /* ------------------------------ table ------------------------------ */
  return (
    <div className="w-full">
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {paginatedResults.map((tx: any, index: number) => {
          const paymentInfo = extractPaymentInfo(tx);

          return (
          <div
            key={tx.transaction_id || `tx-${index}`}
            className="bg-white dark:bg-[#23232A] border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {tx.asset_image && (
                  <img
                    src={tx.asset_image}
                    alt={tx.currency || "Asset"}
                    className="w-10 h-10 rounded-full shadow-sm flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <div className="font-semibold text-sm uppercase tracking-wide text-gray-900 dark:text-white">
                    {tx.currency || tx.asset_symbol || "USDT"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getAssetName(tx.currency || tx.asset_symbol || "USDT")}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tx.status === "completed" || tx.status === "approved"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : tx.status === "pending" || tx.stages === "pending_review"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : tx.status === "rejected" || tx.status === "error"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                }`}
              >
                {tx.status?.replace(/_/g, " ").toUpperCase() || tx.stages?.replace(/_/g, " ").toUpperCase() || "N/A"}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</div>
                <div className="font-medium text-gray-900 dark:text-white capitalize">
                  {tx.transaction_type}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</div>
                <div
                  className={`font-semibold ${
                    tx.transaction_type === "deposit"
                      ? "text-[#1D8751]"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {tx.amount || tx.total_amount || "0.00"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Payment
                </div>
                <div className="flex items-center gap-3">
                  {paymentInfo.displayImage ? (
                    <img
                      src={paymentInfo.displayImage}
                      alt={paymentInfo.providerName || "Payment method"}
                      className="w-8 h-8 rounded-full border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#1D1D23]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-[#E8EFF5] dark:border-[#35353E] bg-[#1D8751] dark:bg-[#1D8751] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {paymentInfo.initials}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {paymentInfo.methodLabel ||
                        t("transactions.notAvailable", "N/A")}
                    </div>
                    {paymentInfo.providerName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {paymentInfo.providerName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">When</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDistanceToNow(new Date(tx.timestamp), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
      <table className="min-w-full divide-y divide-[#d1d5db] dark:divide-[#35353E]">
        <thead className="bg-gray-50 dark:bg-transparent">
          <tr>
            {[
              t("transactions.asset", "Asset"),
              t("transactions.transactionType", "Transaction Type"),
              t("transactions.amount", "Amount"),
              t("transactions.paymentMethod", "Payment Method"),
              t("transactions.status", "Status"),
              t("transactions.when", "When"),
            ].map((h) => (
              <th
                key={h}
                  className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#d1d5db] dark:divide-[#35353E]">
          {paginatedResults.map((tx: any, index: number) => {
            const paymentInfo = extractPaymentInfo(tx);

            return (
            <tr
              key={tx.transaction_id || `tx-${index}`}
              className="hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors"
            >
              {/* Asset */}
                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 sm:gap-3">
                {tx.asset_image && (
                  <img
                    src={tx.asset_image}
                    alt={tx.currency || "Asset"}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold uppercase tracking-wide text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate">
                    {tx.currency || tx.asset_symbol || "USDT"}
                  </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {getAssetName(tx.currency || tx.asset_symbol || "USDT")}
                  </span>
                    </div>
                </div>
              </td>

              {/* Type */}
                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-200 capitalize font-medium">
                {tx.transaction_type}
              </td>

              {/* Amount */}
              <td
                  className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm lg:text-base font-semibold ${
                  tx.transaction_type === "deposit"
                    ? "text-[#1D8751]"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {tx.amount || tx.total_amount || "0.00"}
              </td>

              {/* Payment Method */}
              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div className="flex items-center gap-3 min-w-0">
                  {paymentInfo.displayImage ? (
                    <img
                      src={paymentInfo.displayImage}
                      alt={paymentInfo.providerName || "Payment method"}
                      className="w-8 h-8 rounded-full border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#1D1D23] flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-[#E8EFF5] dark:border-[#35353E] bg-[#1D8751] dark:bg-[#1D8751] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {paymentInfo.initials}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-200 truncate">
                      {paymentInfo.methodLabel ||
                        t("transactions.notAvailable", "N/A")}
                    </span>
                    {paymentInfo.providerName && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {paymentInfo.providerName}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Status */}
                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tx.status === "completed" || tx.status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : tx.status === "pending" || tx.stages === "pending_review"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : tx.status === "rejected" || tx.status === "error"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {tx.status?.replace(/_/g, " ").toUpperCase() || tx.stages?.replace(/_/g, " ").toUpperCase() || "N/A"}
                </span>
              </td>

              {/* When */}
                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-200">
                {formatDistanceToNow(new Date(tx.timestamp), {
                  addSuffix: true,
                })}
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
      </div>

      {/* pagination */}
      <div className="mt-4">{renderPagination()}</div>
    </div>
  );
};

export default P2PWithdrawalDepositTransactions;

