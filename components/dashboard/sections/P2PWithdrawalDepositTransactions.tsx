"use client";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchMyTransactions, setCurrentPage } from "@/features/p2p/slices/p2pWithdrawalDepositSlice";
import { getMyTransactions } from "@/features/p2p/api";
import { formatDistanceToNow } from "date-fns";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import { getHighResAssetIcon } from "@/features/express/utils/imageHelpers";

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

type TransactionTypeFilter = "deposit" | "withdrawal" | "all";

interface P2PWithdrawalDepositTransactionsProps {
  /** Filter by transaction type - "deposit" | "withdrawal" | "all" */
  filterByType?: TransactionTypeFilter;
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

/** Display first 5 chars ... last 5 chars (full id in title for copy/hover) */
const formatTransactionId = (id: string | null | undefined): string => {
  if (!id) return "";
  if (id.length <= 12) return id;
  return `${id.slice(0, 5)}...${id.slice(-5)}`;
};

const P2PWithdrawalDepositTransactions = ({ filterByType = "all" }: P2PWithdrawalDepositTransactionsProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useDashboardI18n();
  const { transactions, loading, error, currentPage } = useSelector(
    (state: RootState) => state.p2pWithdrawalDeposit
  );
  const itemsPerPage = 10;
  const tableRef = useRef<HTMLDivElement>(null);
  const [allFilteredData, setAllFilteredData] = useState<any[] | null>(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const prevFilterRef = useRef(filterByType);

  /* When filter is deposit/withdrawal: fetch all pages and filter client-side for correct pagination */
  useEffect(() => {
    if (filterByType === "all") {
      setAllFilteredData(null);
      return;
    }
    let cancelled = false;
    setLoadingFiltered(true);
    const loadAllFiltered = async () => {
      const all: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 100) {
        const resp = await getMyTransactions(page);
        const results = resp?.results || [];
        if (results.length === 0) break;
        const filtered = results.filter(
          (tx: any) => (tx.transaction_type || "").toLowerCase() === filterByType
        );
        all.push(...filtered);
        hasMore = !!resp?.next;
        page++;
      }
      if (!cancelled) {
        setAllFilteredData(all);
      }
      setLoadingFiltered(false);
    };
    loadAllFiltered();
    return () => { cancelled = true; };
  }, [filterByType]);

  /* Fetch data: when "all" use API pagination; when filter use allFilteredData (client-side) */
  useEffect(() => {
    const filterChanged = prevFilterRef.current !== filterByType;
    if (filterChanged) {
      prevFilterRef.current = filterByType;
      dispatch(setCurrentPage(1));
    }
    if (filterByType === "all") {
      const pageToFetch = filterChanged ? 1 : currentPage;
      dispatch(fetchMyTransactions({ page: pageToFetch, transactionType: undefined }));
    }
  }, [dispatch, currentPage, filterByType]);

  /* --------------------------- loading / error ----------------------- */
  if (loading || (filterByType !== "all" && loadingFiltered)) {
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

  const useFilteredMode = filterByType !== "all" && allFilteredData !== null;

  if (!useFilteredMode && (!transactions || !transactions.results)) {
    return (
      <NoDataFound
        title={t(
          "transactions.noWithdrawalDepositFound",
          "No P2P Withdrawal/Deposit Transactions Found"
        )}
        message={t(
          "transactions.noWithdrawalDepositMessage",
          "There are currently no P2P withdrawal/deposit transactions to display. Please check back later or try adjusting your filters."
        )}
      />
    );
  }

  const baseResults = useFilteredMode
    ? allFilteredData
    : (transactions?.results || []);

  const sortedResults = [...baseResults].sort((a: any, b: any) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA;
  });

  const filteredCount = useFilteredMode ? sortedResults.length : transactions!.count;
  const totalPages = Math.ceil(filteredCount / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedResults = sortedResults.slice(startIdx, startIdx + itemsPerPage);

  // Show no data when filtered results are empty
  if (paginatedResults.length === 0) {
    return (
      <NoDataFound
        title={t(
          "transactions.noWithdrawalDepositFound",
          "No P2P Withdrawal/Deposit Transactions Found"
        )}
        message={
          filterByType !== "all"
            ? `No ${filterByType} transactions found.`
            : t(
                "transactions.noWithdrawalDepositMessage",
                "There are currently no P2P withdrawal/deposit transactions to display. Please check back later or try adjusting your filters."
              )
        }
      />
    );
  }

  const handlePageChange = (pageNumber: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    dispatch(setCurrentPage(pageNumber));

    if (tableRef.current) {
      // Scroll to the table top with a small offset for better visibility
      const topOffset = 180;
      const elementPosition = tableRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
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
          {t("transactions.showing", "Showing")} {filteredCount === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCount)} {t("transactions.of", "of")} {filteredCount} {t("transactions.transactions", "transactions")}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          <button
            onClick={(e) => handlePageChange(currentPage - 1, e)}
            disabled={currentPage === 1}
            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
              ${currentPage > 1
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
              onClick={(e) => handlePageChange(pageNum, e)}
              className={`mx-0.5 sm:mx-1 px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
                ${pageNum === currentPage
                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                  : "bg-transparent text-gray-600 dark:text-gray-400 border-[#d1d5db] dark:border-[#35353E] hover:bg-[#1D8751] hover:text-white"
                }`}
            >
              {pageNum}
            </button>
          ))}
          {endPage < totalPages && <span className="text-gray-500 text-xs sm:text-sm">…</span>}

          <button
            onClick={(e) => handlePageChange(currentPage + 1, e)}
            disabled={currentPage >= totalPages}
            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md border transition-colors duration-150 text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0
              ${currentPage < totalPages
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
    <div className="w-full" ref={tableRef}>
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3 px-4 pt-4 pb-2">
        {paginatedResults.map((tx: any, index: number) => {
          return (
            <div
              key={tx.transaction_id || `tx-${index}`}
              className="bg-transparent border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={getHighResAssetIcon({ ticker: tx.currency || tx.asset_symbol })}
                    alt={tx.currency || tx.asset_symbol || "Asset"}
                    className="w-10 h-10 rounded-full shadow-sm flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
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
                  className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "completed" || tx.status === "approved"
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
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Transaction ID</div>
                  <div className="font-mono font-medium text-xs text-gray-900 dark:text-white break-all" title={tx.transaction_id || ""}>
                    {tx.transaction_id ? formatTransactionId(tx.transaction_id) : t("transactions.notAvailable", "N/A")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Type</div>
                  <div className="font-medium text-sm sm:text-base text-gray-500 dark:text-[#A0A3BC] capitalize">
                    {tx.transaction_type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</div>
                  <div
                    className={`font-semibold ${tx.transaction_type === "deposit"
                      ? "text-[#1D8751]"
                      : "text-red-500 dark:text-red-400"
                      }`}
                  >
                    {tx.amount || tx.total_amount || "0.00"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">When</div>
                  <div className="font-medium text-sm text-gray-500 dark:text-[#A0A3BC]">
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
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2A2A35]">
          <thead className="bg-gray-50 dark:bg-[#35353E] rounded-t-[24px]">
            <tr className="border-b border-gray-200 dark:border-[#35353E]">
              {[
                t("transactions.asset", "Asset"),
                t("transactions.transactionId", "Transaction ID"),
                t("transactions.transactionType", "Transaction Type"),
                t("transactions.amount", "Amount"),
                t("transactions.status", "Status"),
                t("transactions.when", "When"),
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <span className="inline-flex items-center">
                    {h}
                    <SortArrowsIcon />
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-[#2A2A35]">
            {paginatedResults.map((tx: any, index: number) => {
              return (
                <tr
                  key={tx.transaction_id || `tx-${index}`}
                  className="hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors"
                >
                  {/* Asset */}
                  <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <img
                        src={getHighResAssetIcon({ ticker: tx.currency || tx.asset_symbol })}
                        alt={tx.currency || tx.asset_symbol || "Asset"}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="font-semibold uppercase tracking-wide text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate">
                          {tx.currency || tx.asset_symbol || "USDT"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {getAssetName(tx.currency || tx.asset_symbol || "USDT")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Transaction ID (second after Asset) */}
                  <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                    <span className="font-mono text-xs sm:text-sm text-gray-700 dark:text-gray-200 inline-block" title={tx.transaction_id || ""}>
                      {tx.transaction_id ? formatTransactionId(tx.transaction_id) : t("transactions.notAvailable", "N/A")}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-[#A0A3BC] capitalize">
                    {tx.transaction_type}
                  </td>

                  {/* Amount */}
                  <td
                    className={`px-3 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold ${tx.transaction_type === "deposit"
                      ? "text-[#1D8751]"
                      : "text-red-500 dark:text-red-400"
                      }`}
                  >
                    {tx.amount || tx.total_amount || "0.00"}
                  </td>

                  {/* Status */}
                  <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "completed" || tx.status === "approved"
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
                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-[#A0A3BC]">
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
      <div className="mt-4 px-4 pb-4">{renderPagination()}</div>
    </div>
  );
};

export default P2PWithdrawalDepositTransactions;

