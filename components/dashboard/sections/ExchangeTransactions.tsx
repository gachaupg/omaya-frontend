"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { loadAllP2PTransactions } from "@/features/p2p/slices/p2pTransactionsSlice";
import { formatDistanceToNow } from "date-fns";
import { P2PTransaction } from "@/features/p2p/types";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

interface RootState {
  p2pTransactions: {
    transactions: {
      results: P2PTransaction[];
      count: number;
      next: string | null;
      previous: string | null;
    } | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    allTransactions: any[];
    hasLoadedAll: boolean;
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

const ASSET_ICON_URL =
  "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png";

const P2PTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useDashboardI18n();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.p2pTransactions
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* -------------------------- fetch data ----------------------------- */
  useEffect(() => {
    // Load all transactions immediately
    dispatch(loadAllP2PTransactions());
  }, [dispatch]);

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
  if (!transactions?.results?.length) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        {t("transactions.noTransactions", "No transactions found")}
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
          "No Exchange Transactions Found"
        )}
        message={t(
          "transactions.noTransactions",
          "There are currently no exchange transactions to display. Please check back later or try adjusting your filters."
        )}
      />
    );
  }

  // Show all transactions without filtering by user, sorted by created_at (newest first)
  // Ensure transactions.results is an array before spreading
  const resultsArray = Array.isArray(transactions.results) ? transactions.results : [];
  const allResults = [...resultsArray].sort((a: any, b: any) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Sort in descending order (newest first)
  });
  const totalPages = Math.ceil(allResults.length / itemsPerPage);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredResults = allResults.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageButtons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 rounded-md border transition-colors duration-150
            ${
              i === currentPage
                ? "bg-[#1D8751] text-white border-[#1D8751]"
                : "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
            }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        {/* Show count info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t("transactions.showing", "Showing")} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allResults.length)} {t("transactions.of", "of")} {allResults.length} {t("transactions.transactions", "transactions")}
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md border transition-colors duration-150
              ${
                currentPage > 1
                  ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
              }`}
          >
            {t("common.previous", "Previous")}
          </button>
          
          {startPage > 1 && <span className="text-gray-500">…</span>}
          {pageButtons}
          {endPage < totalPages && <span className="text-gray-500">…</span>}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md border transition-colors duration-150
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#d1d5db] dark:divide-[#35353E]">
        <thead className="bg-gray-50 dark:bg-transparent">
          <tr>
            {[
              t("transactions.asset", "Asset"),
              t("transactions.transactionType", "Transaction Type"),
              t("transactions.amount", "Amount"),
              t("transactions.status", "Status"),
              t("transactions.when", "When"),
            ].map((h) => (
              <th
                key={h}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                    text-gray-600 dark:text-gray-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#d1d5db] dark:divide-[#35353E]">
          {filteredResults.map((tx: any, index: number) => (
            <tr
              key={tx.transaction_id || `tx-${index}`}
              className="hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors"
            >
              {/* Asset */}
              <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <img
                  src={ASSET_ICON_URL}
                  alt={tx.currency || "Asset"}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-bold">{tx.currency || "USDT"}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">
                  {getAssetName(tx.currency || "USDT")}
                </span>
              </td>

              {/* Type */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">
                {tx.transaction_type}
              </td>

              {/* Amount */}
              <td
                className={`px-6 py-4 whitespace-nowrap text-sm ${
                  tx.transaction_type === "deposit"
                    ? "text-[#1D8751]"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {tx.amount || tx.requested_amount || tx.total_amount_due || "0.00"}
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tx.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : tx.status === "pending" || tx.status === "pending_address" || tx.status === "pending_approval"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : tx.status === "rejected" || tx.status === "error"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : tx.status === "waiting" || tx.status === "awaiting_payment"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {tx.status?.replace(/_/g, " ").toUpperCase() || "N/A"}
                </span>
              </td>

              {/* When */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {formatDistanceToNow(new Date(tx.created_at), {
                  addSuffix: true,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* pagination */}
      <div className="mt-4">{renderPagination()}</div>
    </div>
  );
};

export default P2PTransactions;
