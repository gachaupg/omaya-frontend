"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import {
  fetchTransactions,
  prependTransaction,
  setTransactionsFromWebSocket,
} from "../slices/transactionSlice";
import { AllSystemTransactionsWebSocket } from "@/features/markets/services/allSystemTransactionsWebSocket";
import { Transaction } from "../types";
import {
  formatTransactionType,
  formatAmount,
  formatTimeAgo,
  getStatusColor,
} from "../utils/transactionUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Pagination constant
const ITEMS_PER_PAGE = 10;

// Get initials from a name (e.g. "USDT" -> "US", "Sahaal Golis" -> "SG", "Equity Bank" -> "EB")
function getInitials(name: string): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

// Avatar: show image when src is valid, otherwise initials (no dummy image)
function Avatar({
  src,
  name,
  className = "w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0",
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  const [useInitials, setUseInitials] = React.useState(!src || !src.startsWith("http"));
  const initials = getInitials(name);

  if (useInitials || !src || !src.startsWith("http")) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-[#2D2D37] text-gray-300 dark:text-gray-400 text-xs font-semibold overflow-hidden`}
        title={name}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={className}
      onError={() => setUseInitials(true)}
    />
  );
}

// Map WebSocket message data to Transaction format
const mapWsDataToTransaction = (data: any): Transaction => {
  const id = data.id || data.transaction_id || `tx-${Date.now()}-${Math.random()}`;
  const amount = data.amount || data.total_amount || data.total_amount_due || "0";
  const timestamp = data.timestamp || data.created_at || new Date().toISOString();
  
  // Get the payment provider name from various possible fields
  const providerName = data.payment_provider || data.from_provider || data.from_bank || data.bank_name || data.provider_name || "";
  
  // Get the provider logo from various possible fields
  const providerLogo = data.payment_provider_logo || data.provider_logo || data.bank_logo || data.from_logo || null;
  
  return {
    transaction_type: data.transaction_type || data.type || "transaction",
    transaction_id: id,
    user: {
      id: data.user_id || 0,
      name: data.user_name || data.from || data.from_bank || providerName || "User",
      email: "",
      photo: providerLogo,
    },
    amount,
    currency: data.currency || "USD",
    asset_image: data.asset_image || data.currency_logo || data.to_logo || null,
    total_amount_due: amount,
    payment_provider: providerName,
    status: data.status || "completed",
    stages: "",
    timestamp,
    // Store additional fields for logo usage
    photo: providerLogo,
  };
};

// Logo type: use actual URL or null (null => show initials, no dummy image)
// Helper function to determine From and To based on transaction type
const getFromTo = (tx: Transaction): { from: { name: string; logo: string | null }; to: { name: string; logo: string | null } } => {
  const transactionType = tx.transaction_type?.toLowerCase() || "";
  
  // Helper to check if a name is likely a crypto asset (USDT, BTC, ETH, etc.)
  const isCryptoAsset = (name: string) => {
    const cryptoAssets = ['usdt', 'btc', 'eth', 'usd', 'usdc', 'bnb', 'trx', 'aurora_eth'];
    return cryptoAssets.some(crypto => name.toLowerCase().includes(crypto));
  };
  
  // Get the actual provider name - try multiple sources
  const getProviderName = (): string => {
    if (tx.payment_provider && tx.payment_provider.trim()) return tx.payment_provider;
    if (tx.user?.name && tx.user.name !== "User" && tx.user.name.trim()) return tx.user.name;
    return tx.currency || "Unknown";
  };
  
  // Get the provider logo - actual URL or null (no dummy)
  const getProviderLogo = (): string | null => {
    if (tx.photo && tx.photo.startsWith('http')) return tx.photo;
    if (tx.user?.photo && tx.user.photo.startsWith('http')) return tx.user.photo;
    return null;
  };
  
  const assetLogo = tx.asset_image && tx.asset_image.startsWith("http") ? tx.asset_image : null;
  
  // For deposits: From = payment provider (bank), To = crypto asset
  if (transactionType === "deposit" || transactionType === "moneyx") {
    const providerName = getProviderName();
    const assetName = tx.currency || "USD";
    
    return {
      from: { name: providerName, logo: getProviderLogo() },
      to: { name: assetName, logo: assetLogo },
    };
  }
  
  // For withdrawals: From = crypto asset, To = payment provider (bank)
  if (transactionType === "withdrawal") {
    const assetName = tx.currency || "USD";
    const providerName = getProviderName();
    
    return {
      from: { name: assetName, logo: assetLogo },
      to: { name: providerName, logo: getProviderLogo() },
    };
  }
  
  // For P2P: From = seller/buyer (counterparty), To = crypto asset
  if (transactionType.includes("p2p")) {
    const providerName = getProviderName();
    const assetName = tx.currency || "USD";
    
    return {
      from: { name: providerName, logo: getProviderLogo() },
      to: { name: assetName, logo: assetLogo },
    };
  }
  
  // Default: Determine based on names
  const firstName = getProviderName();
  const secondName = tx.currency || "Destination";
  
  if (isCryptoAsset(firstName)) {
    return {
      from: { name: firstName, logo: assetLogo },
      to: { name: secondName, logo: getProviderLogo() },
    };
  }
  
  return {
    from: { name: firstName, logo: getProviderLogo() },
    to: { name: secondName, logo: assetLogo },
  };
};

const RatesTransactionHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading, error, count } = useSelector(
    (state: RootState) => state.transaction
  );
  const [isConnected, setIsConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const wsRef = useRef<AllSystemTransactionsWebSocket | null>(null);

  const getAmountColor = useMemo(
    () => (type: string) => (type === "withdrawal" ? "text-red-500" : "text-[#1D8751]"),
    []
  );

  // Calculate pagination values
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
  // With server-side pagination, transactions in store are already for the current page
  const paginatedTransactions = transactions;

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    dispatch(fetchTransactions(newPage));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  useEffect(() => {
    dispatch(fetchTransactions(1));
  }, [dispatch]);

  useEffect(() => {
    wsRef.current = new AllSystemTransactionsWebSocket();

    const unsubMessage = wsRef.current.onMessage((message) => {
      try {
        if (message.type === "initial" && Array.isArray(message.data?.transactions)) {
          const mapped = (message.data.transactions as any[]).map(mapWsDataToTransaction);
          dispatch(setTransactionsFromWebSocket(mapped.slice(0, 100)));
          return;
        }
        if (message.type === "transaction" || message.type === "new_transaction") {
          const tx = mapWsDataToTransaction(message.data || message);
          dispatch(prependTransaction(tx));
        }
      } catch (err) {
        console.error("RatesTransactionHistory: WebSocket message error", err);
      }
    });

    const unsubOpen = wsRef.current.onOpen(() => setIsConnected(true));
    const unsubClose = wsRef.current.onClose(() => setIsConnected(false));
    const unsubError = wsRef.current.onError(() => setIsConnected(false));

    wsRef.current.connect();

    return () => {
      unsubMessage();
      unsubOpen();
      unsubClose();
      unsubError();
      wsRef.current?.disconnect();
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1D1D23] p-6 rounded-lg">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#1D1D23] p-6 rounded-lg">
        <div className="text-red-500 text-center">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1D1D23] p-3 sm:p-4 lg:p-6 rounded-lg">
      {/* Connection status indicator */}
      <div className="flex items-center justify-end mb-3 sm:mb-4">
        <div
          className={`flex items-center gap-1.5 text-sm font-medium ${
            isConnected ? "text-[#13B562]" : "text-red-500"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-[#13B562] animate-pulse" : "bg-red-500"
            }`}
          />
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      {/* Mobile: Card-based layout */}
      <div className="block sm:hidden space-y-4">
        {paginatedTransactions.map((tx: Transaction, index: number) => {
          const { from, to } = getFromTo(tx);
          const amountColor = index % 2 === 0 ? "text-[#13B562]" : "text-red-500";
          
          return (
          <div key={tx.transaction_id} className="border border-gray-200 dark:border-[#35353E] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                <Avatar src={from.logo} name={from.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white font-medium">{from.name}</span>
                  <span className="text-gray-500">→</span>
                  <Avatar src={to.logo} name={to.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white font-medium">{to.name}</span>
                </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#788099]">Amount:</span>
                  <span className={`font-semibold ${amountColor}`}>
                  {formatAmount(tx.total_amount_due, tx.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#788099]">When:</span>
                <span className="text-gray-600 dark:text-[#788099]">{formatTimeAgo(tx.timestamp)}</span>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden sm:block w-full overflow-x-auto border border-gray-200 dark:border-[#35353E] rounded-lg">
        <table className="min-w-max w-full text-left">
        <thead>
          <tr className="bg-gray-50 dark:bg-[#23232B] border-b-2 border-gray-300 dark:border-[#35353E]">
            <th className="px-4 sm:px-6 py-4 sm:py-5 font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
              From
            </th>
            <th className="px-4 sm:px-6 py-4 sm:py-5 font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
              To
            </th>
            <th className="px-4 sm:px-6 py-4 sm:py-5 font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
              Amount
            </th>
            <th className="px-4 sm:px-6 py-4 sm:py-5 font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
              When
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedTransactions.map((tx: Transaction, index: number) => {
            const { from, to } = getFromTo(tx);
            // Alternate colors for amount (green/red)
            const amountColor = index % 2 === 0 ? "text-[#13B562]" : "text-red-500";
            
            return (
            <tr
              key={tx.transaction_id}
                className="border-b border-gray-200 dark:border-[#35353E] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors"
            >
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar src={from.logo} name={from.name} />
                    <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      {from.name}
                  </span>
                </div>
              </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar src={to.logo} name={to.name} />
                    <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      {to.name}
                    </span>
                </div>
              </td>
                <td className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base ${amountColor}`}>
                  {formatAmount(tx.total_amount_due, tx.currency)}
              </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-gray-600 dark:text-[#788099]">
                {formatTimeAgo(tx.timestamp)}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
        
      </div>

      {/* Pagination UI - Always show, but disable buttons when not applicable */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-[#E8EFF5] dark:border-[#35353E] mt-4">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-[#788099]">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, count)} of {count} transactions
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentPage === 1
                ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#1D1D23] text-gray-400 dark:text-gray-500"
                : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B]"
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {count > ITEMS_PER_PAGE && (
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const showEllipsisBefore = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <span className="px-2 text-gray-500 dark:text-[#788099]">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentPage === page
                            ? "bg-[#1D8751] text-white border-[#1D8751]"
                            : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B]"
                          }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>
          )}

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentPage === totalPages || totalPages === 0
                ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#1D1D23] text-gray-400 dark:text-gray-500"
                : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B]"
              }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatesTransactionHistory;
