"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchP2PTransactions,
  setCurrentPage,
} from "@/features/p2p/slices/p2pTransactionsSlice";
import { format, formatDistanceToNow } from "date-fns";
import { P2PTransaction } from "@/features/p2p/types";

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
  };
}

// Helper to map currency symbol to asset name
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
  const { transactions, loading, error, currentPage } = useSelector(
    (state: RootState) => state.p2pTransactions
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("profile");
      setUserEmail(user ? JSON.parse(user).user.email : "");
    }
  }, []);

  useEffect(() => {
    console.log("Fetching transactions for page:", currentPage);
    dispatch(fetchP2PTransactions(currentPage));
  }, [dispatch, currentPage]);

  useEffect(() => {
    console.log("Transactions state:", { transactions, loading, error });
  }, [transactions, loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D8751]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  if (
    !transactions ||
    !transactions.results ||
    transactions.results.length === 0
  ) {
    return (
      <div className="text-center p-8 text-gray-400">No transactions found</div>
    );
  }

  // Pagination logic for 10 items per page
  const itemsPerPage = 10;

  const filteredResults =
    transactions?.results.filter(
      (t: P2PTransaction) => t.user_email === userEmail
    ) || [];
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage) || 1;
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper to render pagination buttons
  const renderPagination = () => {
    if (!transactions || totalPages <= 1) return null;
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
          className={`mx-1 px-3 py-1 rounded-md border transition-colors duration-150 ${
            i === currentPage
              ? "bg-[#1D8751] text-white border-[#1D8751]"
              : "bg-transparent text-gray-400 border-[#35353E] hover:bg-[#1D8751] hover:text-white"
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(setCurrentPage(currentPage - 1))}
          disabled={!transactions.previous}
          className={`px-3 py-1 rounded-md border border-[#35353E] transition-colors duration-150 ${
            transactions.previous
              ? "bg-transparent text-gray-400 hover:bg-[#1D8751] hover:text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          Previous
        </button>
        {startPage > 1 && <span className="text-gray-400">...</span>}
        {pageButtons}
        {endPage < totalPages && <span className="text-gray-400">...</span>}
        <button
          onClick={() => dispatch(setCurrentPage(currentPage + 1))}
          disabled={!transactions.next}
          className={`px-3 py-1 rounded-md border border-[#35353E] transition-colors duration-150 ${
            transactions.next
              ? "bg-transparent text-gray-400 hover:bg-[#1D8751] hover:text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#35353E]">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-400 uppercase tracking-wider">
              Asset
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-400 uppercase tracking-wider">
              Transaction Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-400 uppercase tracking-wider">
              Payment Method
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-400 uppercase tracking-wider">
              When
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#35353E]">
          {paginatedResults.map((transaction: P2PTransaction) => (
            <tr
              key={transaction.transaction_id}
              className="hover:bg-[#23232A] transition-colors duration-150"
            >
              <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2 text-sm text-gray-300">
                <img
                  src={ASSET_ICON_URL}
                  alt={transaction.currency}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-bold">{transaction.currency}</span>
                <span className="ml-1 text-gray-400">
                  {getAssetName(transaction.currency)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {transaction.transaction_type}
              </td>
              <td
                className={`px-6 py-4 whitespace-nowrap text-sm ${
                  transaction.amount > 0 ? "text-[#1D8751]" : "text-red-500"
                }`}
              >
                {transaction.amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {transaction.payment_provider}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {formatDistanceToNow(new Date(transaction.timestamp), {
                  addSuffix: true,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </div>
  );
};

export default P2PTransactions;
