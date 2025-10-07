"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchP2PTransactions,
  setCurrentPage,
  loadAllP2PTransactions,
  toggleViewAll,
} from "@/features/p2p/slices/p2pTransactionsSlice";
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
  const [userEmail, setUserEmail] = useState("");
  const { t } = useDashboardI18n();
  const { transactions, loading, error, currentPage, hasLoadedAll } = useSelector(
    (state: RootState) => state.p2pTransactions
  );

  /* ----------------------------- set user ---------------------------- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("profile");
      setUserEmail(user ? JSON.parse(user).user.email : "");
    }
  }, []);

  /* -------------------------- fetch data ----------------------------- */
  useEffect(() => {
    dispatch(fetchP2PTransactions(currentPage));
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

  // Filter results by user email for display
  const filteredResults =
    transactions.results.filter((t) => t.user_email === userEmail) || [];
  
  // Use server-side pagination info
  const totalPages = Math.ceil(transactions.count / 10) || 1;

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
          onClick={() => dispatch(setCurrentPage(i))}
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
        {/* Show total count and current page info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {hasLoadedAll 
            ? t("transactions.showingAll", "Showing all") + " " + filteredResults.length + " " + t("transactions.transactions", "transactions")
            : t("transactions.showing", "Showing") + " " + filteredResults.length + " " + t("transactions.of", "of") + " " + transactions.count + " " + t("transactions.transactions", "transactions")
          }
        </div>
        
        {/* Load All button */}
        {!hasLoadedAll && transactions.count > 10 && (
          <button
            onClick={() => dispatch(loadAllP2PTransactions())}
            disabled={loading}
            className="px-4 py-2 bg-[#1D8751] text-white rounded-md hover:bg-[#1a6b42] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("common.loading", "Loading...") : t("transactions.loadAll", "Load All Transactions")}
          </button>
        )}
        
        {!hasLoadedAll && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(setCurrentPage(currentPage - 1))}
              disabled={!transactions.previous}
              className={`px-3 py-1 rounded-md border transition-colors duration-150
                ${
                  transactions.previous
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
              onClick={() => dispatch(setCurrentPage(currentPage + 1))}
              disabled={!transactions.next}
              className={`px-3 py-1 rounded-md border transition-colors duration-150
                ${
                  transactions.next
                    ? "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed border-transparent"
                }`}
            >
              {t("common.next", "Next")}
            </button>
          </div>
        )}
        
        {/* Back to paginated view button */}
        {hasLoadedAll && (
          <button
            onClick={() => dispatch(fetchP2PTransactions(1))}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-150"
          >
            {t("transactions.backToPages", "Back to Pages")}
          </button>
        )}
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
              t("transactions.paymentMethod", "Payment Method"),
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
          {filteredResults.map((tx) => (
            <tr
              key={tx.transaction_id}
              className="hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors"
            >
              {/* Asset */}
              <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <img
                  src={ASSET_ICON_URL}
                  alt={tx.currency}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-bold">{tx.currency}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">
                  {getAssetName(tx.currency)}
                </span>
              </td>

              {/* Type */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
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
                {tx.amount}
              </td>

              {/* Method */}
              <td className="px-6 py-4 gap-2 flex items-center whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                <img
                  className="h-4"
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt=""
                />{" "}
                {tx.payment_provider}
              </td>

              {/* When */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {formatDistanceToNow(new Date(tx.timestamp), {
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
