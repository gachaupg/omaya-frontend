"use client";

import React, { useEffect, useState, useRef } from "react";
import { AllSystemTransactionsWebSocket } from "@/features/markets/services/allSystemTransactionsWebSocket";
import {
  getHighResAssetIcon,
  getHighResPaymentLogo,
  getDefaultProviderLogo,
} from "@/features/express/utils/imageHelpers";
import { transactionApi } from "@/features/rates/api";


interface Transaction {
  id: string;
  from: {
    name: string;
    logo?: string;
  };
  to: {
    name: string;
    logo?: string;
  };
  amount: string;
  currency: string;
  timestamp: string;
  when: string;
}

// Helper function to format time ago
const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

// Helper to get logo URL: use asset icon for currencies, provider logo for banks/providers
const getLogoUrl = (name: string, isCurrency: boolean, logoFromData?: string | null): string => {
  if (logoFromData) {
    return getHighResPaymentLogo(logoFromData, null, 48);
  }
  if (isCurrency) {
    return getHighResAssetIcon({ ticker: name }, 48);
  }
  return getDefaultProviderLogo();
};

// Helper function to check if name is a currency
const isCurrency = (name: string): boolean => {
  const currencies = ["usdt", "usd", "btc", "bitcoin", "eth", "ethereum"];
  return currencies.includes((name || "").toLowerCase());
};

// Return API logo URL when valid (http/https or relative path)
const resolveLogoUrl = (url: string | null | undefined): string | null => {
  if (url && (url.startsWith("http") || url.startsWith("/"))) return url;
  return null;
};

// Map API/WebSocket data to display Transaction (matches REST API structure)
const mapApiDataToTransaction = (data: any): Transaction => {
  const type = String(data.transaction_type || "").toLowerCase();
  const currency = data.currency || data.asset || "USDT";
  const ts = data.timestamp || data.created_at || new Date().toISOString();

  let fromName = "";
  let fromLogo: string | null = null;
  let toName = "";
  let toLogo: string | null = null;

  // p2p_trade: buyer → seller (buyer bought from seller), use nested or flat fields
  if (type === "p2p_trade") {
    fromName = data.buyer?.name || data.buyer_name || "Buyer";
    fromLogo = resolveLogoUrl(data.buyer?.photo) || resolveLogoUrl(data.buyer_photo);
    toName = data.seller?.name || data.seller_name || "Seller";
    toLogo = resolveLogoUrl(data.seller?.photo) || resolveLogoUrl(data.seller_photo);
  }
  // moneyx: from_provider → to_provider
  else if (type === "moneyx") {
    fromName = data.from_provider || data.user?.name || "MoneyX";
    fromLogo = resolveLogoUrl(data.from_provider_logo) || resolveLogoUrl(data.user?.photo);
    toName = data.to_provider || currency;
    toLogo = resolveLogoUrl(data.to_provider_logo);
  }
  // p2p_deposit, p2p_withdraw, exchange, swap, etc.
  else {
    const userName = data.user_name || data.user?.name || data.account_name || data.sender_name || data.from_name || "";
    const receiverName = data.receiver_name || data.to_name || data.recipient_name || "";
    const paymentProvider = data.payment_provider || data.provider || data.bank_name || "";

    if (type === "p2p_deposit") {
      fromName = userName || paymentProvider || "P2P Deposit";
      fromLogo = resolveLogoUrl(data.payment_provider_logo) || resolveLogoUrl(data.from_logo);
      toName = currency;
      toLogo = resolveLogoUrl(data.asset_image) || getLogoUrl(currency, true, data.asset_image);
    } else if (type === "p2p_withdraw") {
      fromName = currency;
      fromLogo = resolveLogoUrl(data.asset_image) || getLogoUrl(currency, true, data.asset_image);
      toName = userName || receiverName || "P2P Withdraw";
      toLogo = resolveLogoUrl(data.payment_provider_logo) || resolveLogoUrl(data.to_logo);
    } else if (type === "exchange" || type === "swap") {
      fromName = userName || paymentProvider || currency;
      fromLogo = resolveLogoUrl(data.from_logo) || resolveLogoUrl(data.asset_image);
      toName = receiverName || currency;
      toLogo = resolveLogoUrl(data.to_logo) || resolveLogoUrl(data.asset_image);
    } else {
      fromName = userName || paymentProvider || currency;
      fromLogo = resolveLogoUrl(data.from_provider_logo) || resolveLogoUrl(data.payment_provider_logo) || resolveLogoUrl(data.from_logo);
      toName = receiverName || paymentProvider || currency;
      toLogo = resolveLogoUrl(data.to_provider_logo) || resolveLogoUrl(data.to_logo) || resolveLogoUrl(data.asset_image);
    }
    // Fallback for logos when API didn't provide URLs
    if (!fromLogo) fromLogo = getLogoUrl(fromName, isCurrency(fromName), null);
    if (!toLogo) toLogo = getLogoUrl(toName, isCurrency(toName), null);
  }

  return {
    id: data.id || data.transaction_id || `tx-${Date.now()}-${Math.random()}`,
    from: { name: fromName, logo: fromLogo || undefined },
    to: { name: toName, logo: toLogo || undefined },
    amount: data.total_amount_due || data.total_amount || data.amount || "0",
    currency,
    timestamp: ts,
    when: formatTimeAgo(ts),
  };
};

// Avatar: show image when src is valid, otherwise initials (matches RatesTransactionHistory)
function getInitials(name: string): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

function Avatar({
  src,
  name,
  className = "w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0",
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  const isValidImgSrc = src && (src.startsWith("http") || src.startsWith("/"));
  const [useInitials, setUseInitials] = React.useState(!isValidImgSrc);
  const initials = getInitials(name);

  if (useInitials || !isValidImgSrc) {
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

const LiveTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const wsRef = useRef<AllSystemTransactionsWebSocket | null>(null);

  // Fetch from REST API (has full buyer/seller/from_provider/to_provider data)
  const fetchPage = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionApi.fetchTransactions(page);
      const mapped = (res.results || []).map(mapApiDataToTransaction);
      setTransactions(mapped);
      setTotalCount(res.count ?? 0);
      const size = res.results?.length ?? 10;
      setPageSize(size);
      setTotalPages(Math.max(1, (res as any).summary?.page_count ?? Math.ceil((res.count ?? 0) / size)));
    } catch (err: any) {
      setError(err?.message || "Failed to load transactions");
      setTransactions([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage]);

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  // WebSocket for real-time updates (prepend new transactions when on page 1)
  useEffect(() => {
    wsRef.current = new AllSystemTransactionsWebSocket();

    const unsubscribeMessage = wsRef.current.onMessage((message) => {
      try {
        if (message.type === "transaction" || message.type === "new_transaction") {
          const tx = mapApiDataToTransaction(message.data);
          setTransactions((prev) => {
            if (currentPageRef.current !== 1) return prev;
            return [tx, ...prev].slice(0, 100);
          });
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    });

    const unsubscribeOpen = wsRef.current.onOpen(() => setIsConnected(true));
    const unsubscribeClose = wsRef.current.onClose(() => setIsConnected(false));
    const unsubscribeError = wsRef.current.onError(() => setIsConnected(false));

    wsRef.current.connect();

    return () => {
      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
      wsRef.current?.disconnect();
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };


  // Get amount color (alternating for visual effect)
  const getAmountColor = (index: number): string => {
    return index % 2 === 0 ? "text-[#13B562]" : "text-red-500";
  };

  return (
    <div className="w-full">
      {/* Back Button */}
      <a
        href="/rates"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-[#788099] hover:text-[#1D8751] dark:hover:text-[#1D8751] transition-colors mb-4 sm:mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm sm:text-base font-medium">Back</span>
      </a>

      {/* Page header like the provided design */}
      <div className="mb-4 sm:mb-5">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#051015] dark:text-white">
          Live Transactions
        </h1>
        <p className="mt-2 text-xs sm:text-sm lg:text-sm text-gray-600 dark:text-[#A3A7BF] max-w-4xl">
          See all OMAYA system transactions streaming in real time. This feed updates automatically as new transactions are completed across the platform.
        </p>
      </div>

      {/* Connection status indicator */}
      <div className="flex items-center justify-end mb-2 sm:mb-3">
        <div className={`flex items-center gap-1.5 text-sm font-medium ${isConnected ? 'text-[#13B562]' : 'text-red-500'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#13B562] animate-pulse' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#1D1D23] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] overflow-hidden relative">
        {/* Scroll indicators - show on mobile when table is scrollable */}
        <div className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="w-8 h-32 bg-gradient-to-r from-white dark:from-[#1D1D23] to-transparent" />
        </div>
        <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="w-8 h-32 bg-gradient-to-l from-white dark:from-[#1D1D23] to-transparent" />
        </div>
        {/* Mobile scroll hint */}
        <div className="sm:hidden flex items-center justify-center gap-2 py-2 text-xs text-gray-500 dark:text-[#788099] bg-gray-50 dark:bg-[#23232B] border-b border-[#E8EFF5] dark:border-[#35353E]">
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
          <span>Swipe to see more</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm sm:text-base text-gray-500 dark:text-[#788099]">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <p className="text-sm sm:text-base text-red-500">{error}</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#13B562] animate-pulse' : 'bg-gray-400'}`} />
                      <p className="text-sm sm:text-base text-gray-500 dark:text-[#788099]">
                        {isConnected ? 'Waiting for transactions...' : 'No transactions yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, index) => (
                    <tr
                      key={tx.id}
                      className="border-b border-[#E8EFF5] dark:border-[#35353E] hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar
                            src={tx.from.logo || null}
                            name={tx.from.name}
                          />
                          <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                            {tx.from.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar
                            src={tx.to.logo || null}
                            name={tx.to.name}
                          />
                          <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                            {tx.to.name}
                          </span>
                        </div>
                      </td>
                      <td className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base ${getAmountColor(index)}`}>
                        ${Math.floor(parseFloat(tx.amount)).toLocaleString('en-US')}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-gray-600 dark:text-[#788099]">
                        {tx.when}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && !loading && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[#1D1D23]">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-[#788099]">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} transactions
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

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

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#1D1D23] text-gray-400 dark:text-gray-500"
                    : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B]"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTransactionsPage;

