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

const extractPaymentInfo = (tx: any) => {
  const paymentDetails = Array.isArray(tx?.payment_details)
    ? tx.payment_details
    : [];

  const detailWithLogo =
    paymentDetails.find(
      (detail: any) => detail?.provider_logo || detail?.logo
    ) || paymentDetails[0];

  // Prefer explicit provider logos for payment method visuals, then fall back to asset image
  const providerLogoFromDetails =
    detailWithLogo?.provider_logo || detailWithLogo?.logo || null;
  const providerLogoFromTransaction = tx?.provider_logo || null;
  const displayImage =
    providerLogoFromDetails ||
    providerLogoFromTransaction ||
    tx?.asset_image ||
    null;

  const providerName =
    detailWithLogo?.provider_name ||
    detailWithLogo?.provider ||
    tx?.payment_provider ||
    tx?.payment_provider_display ||
    null;

  const methodLabel =
    tx?.payment_method ||
    tx?.payment_method_display ||
    detailWithLogo?.payment_method_name ||
    detailWithLogo?.method ||
    null;

  return {
    displayImage,
    providerName,
    methodLabel,
  };
};

const ExchangeTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useDashboardI18n();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.p2pTransactions
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const containerRef = React.useRef<HTMLDivElement>(null);

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
    // Scroll to the top of the container
    if (containerRef.current) {
      // Calculate offset to account for fixed headers if any (approx 100px)
      const yOffset = -100; 
      const element = containerRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
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
          {t("transactions.showing", "Showing")} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allResults.length)} {t("transactions.of", "of")} {allResults.length} {t("transactions.transactions", "transactions")}
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
            disabled={currentPage === totalPages}
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
    <div className="w-full" ref={containerRef}>
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {filteredResults.map((tx: any, index: number) => {
          const paymentInfo = extractPaymentInfo(tx);

          return (
          <div
            key={tx.transaction_id || `tx-${index}`}
            className="bg-transparent border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
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
                    {tx.currency || "USDT"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getAssetName(tx.currency || "USDT")}
                  </div>
                </div>
              </div>
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
                  {tx.amount || tx.requested_amount || tx.total_amount_due || "0.00"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Payment
                </div>
                <div className="flex items-center gap-3">
                  {paymentInfo.displayImage && (
                    <img
                      src={paymentInfo.displayImage}
                      alt={paymentInfo.providerName || "Payment method"}
                      className="w-8 h-8 rounded-full border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#1D1D23]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
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
                  {formatDistanceToNow(new Date(tx.created_at), {
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
        <thead className="bg-transparent">
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
          {filteredResults.map((tx: any, index: number) => {
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
                    {tx.currency || "USDT"}
                  </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {getAssetName(tx.currency || "USDT")}
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
                {tx.amount || tx.requested_amount || tx.total_amount_due || "0.00"}
              </td>

              {/* Payment Method */}
              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div className="flex items-center gap-3 min-w-0">
                  {paymentInfo.displayImage && (
                    <img
                      src={paymentInfo.displayImage}
                      alt={paymentInfo.providerName || "Payment method"}
                      className="w-8 h-8 rounded-full border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#1D1D23] flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
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
                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-200">
                {formatDistanceToNow(new Date(tx.created_at), {
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

export default ExchangeTransactions;
