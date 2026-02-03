"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchMoneyXTransactions } from "@/features/moneyX/slices/moneyXSlice";
import { formatDistanceToNow } from "date-fns";
import { NoDataFound } from "../ui/Transactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import { formatCurrency } from "@/lib/globalFormatter";

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "approved":
    case "success":
      return "bg-[#E0F2E8] text-[#1D8751] dark:bg-[#1D8751]/20 dark:text-[#1D8751]";
    case "pending":
    case "processing":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "failed":
    case "rejected":
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const MoneyXTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useDashboardI18n();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.moneyX
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchMoneyXTransactions());
  }, [dispatch]);

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

  const transactionsList = transactions || [];

  if (!transactionsList || transactionsList.length === 0) {
    return (
      <NoDataFound
        title={t("transactions.noMoneyXTransactions", "No MoneyX Transactions Found")}
        message={t(
          "transactions.noMoneyXTransactionsMessage",
          "There are currently no MoneyX transactions to display. Please check back later or try adjusting your filters."
        )}
      />
    );
  }

  // Paginate
  const totalPages = Math.ceil(transactionsList.length / itemsPerPage);
  const paginatedTransactions = transactionsList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#35353E]">
              <th className="py-3 px-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Transaction ID<SortArrowsIcon /></span></th>
              <th className="py-3 px-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">From<SortArrowsIcon /></span></th>
              <th className="py-3 px-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">To<SortArrowsIcon /></span></th>
              <th className="py-3 px-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Amount Sent<SortArrowsIcon /></span></th>
              <th className="py-3 px-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Amount Received<SortArrowsIcon /></span></th>
              <th className="py-3 px-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Status<SortArrowsIcon /></span></th>
              <th className="py-3 px-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]"><span className="inline-flex items-center">Date<SortArrowsIcon /></span></th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((tx: any, index: number) => (
              <tr
                key={tx.moneyx_transaction_id || index}
                className="border-b dark:border-[#35353E] border-gray-100 hover:bg-gray-50 dark:hover:bg-[#1D1D23] transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="text-sm font-medium dark:text-white text-gray-900">
                    {tx.moneyx_transaction_id?.slice(0, 8) || "-"}...
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {tx.sender_provider?.logo && (
                      <img
                        src={tx.sender_provider.logo}
                        alt={tx.sender_provider.provider_name || ""}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm dark:text-[#788099] text-gray-600">
                      {tx.sender_provider?.provider_name || tx.from_payment_provider || tx.from_provider || "-"}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {tx.receiver_provider?.logo && (
                      <img
                        src={tx.receiver_provider.logo}
                        alt={tx.receiver_provider.provider_name || ""}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm dark:text-[#788099] text-gray-600">
                      {tx.receiver_provider?.provider_name || tx.to_payment_provider || tx.to_provider || "-"}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-medium dark:text-white text-gray-900">
                    {formatCurrency(tx.send_amount || tx.amount || 0, tx.from_currency || tx.currency || "USDT")}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-[#1D8751]">
                    {formatCurrency(tx.receive_amount || tx.net_amount || 0, tx.to_currency || tx.currency || "USDT")}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      tx.status
                    )}`}
                  >
                    {tx.status || "Pending"}
                  </span>
                </td>
                <td className="py-4 px-4 border-b border-gray-200 dark:border-[#35353E]">
                  <span className="text-sm sm:text-base text-gray-500 dark:text-[#A0A3BC]">
                    {tx.created_at
                      ? formatDistanceToNow(new Date(tx.created_at), {
                        addSuffix: true,
                      })
                      : "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-3">
        {paginatedTransactions.map((tx: any, index: number) => (
          <div
            key={tx.moneyx_transaction_id || index}
            className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl p-4 border dark:border-[#35353E] border-gray-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs dark:text-[#788099] text-gray-500">Transaction ID</p>
                <p className="text-sm font-medium dark:text-white text-gray-900">
                  {tx.moneyx_transaction_id?.slice(0, 12) || "-"}...
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  tx.status
                )}`}
              >
                {tx.status || "Pending"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs dark:text-[#788099] text-gray-500">From</p>
                <div className="flex items-center gap-2">
                  {tx.sender_provider?.logo && (
                    <img
                      src={tx.sender_provider.logo}
                      alt={tx.sender_provider.provider_name || ""}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  )}
                  <p className="text-sm dark:text-white text-gray-900">
                    {tx.sender_provider?.provider_name || tx.from_payment_provider || tx.from_provider || "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs dark:text-[#788099] text-gray-500">To</p>
                <div className="flex items-center gap-2">
                  {tx.receiver_provider?.logo && (
                    <img
                      src={tx.receiver_provider.logo}
                      alt={tx.receiver_provider.provider_name || ""}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  )}
                  <p className="text-sm dark:text-white text-gray-900">
                    {tx.receiver_provider?.provider_name || tx.to_payment_provider || tx.to_provider || "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs dark:text-[#788099] text-gray-500">Sent</p>
                <p className="text-sm font-medium dark:text-white text-gray-900">
                  {formatCurrency(tx.send_amount || tx.amount || 0, tx.from_currency || tx.currency || "USD")}
                </p>
              </div>
              <div>
                <p className="text-xs dark:text-[#788099] text-gray-500">Received</p>
                <p className="text-sm font-medium text-[#1D8751]">
                  {formatCurrency(tx.receive_amount || tx.net_amount || 0, tx.to_currency || tx.currency || "USD")}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t dark:border-[#35353E] border-gray-200">
              <p className="text-xs dark:text-[#788099] text-gray-500">
                {tx.created_at
                  ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })
                  : "-"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentPage((p) => Math.max(1, p - 1));
            }}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm dark:text-[#788099] text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentPage((p) => Math.min(totalPages, p + 1));
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-[#35353E] text-gray-700 dark:text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MoneyXTransactions;
