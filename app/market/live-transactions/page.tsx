"use client";

import React, { useEffect, useState, useRef } from "react";
import { AllSystemTransactionsWebSocket } from "@/features/markets/services/allSystemTransactionsWebSocket";

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

// Helper function to get bank logo
const getBankLogo = (bankName: string): string => {
  // For now, always use the Cloudinary default logo to avoid 404s from /banks/*.png
  return "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
};

const LiveTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<AllSystemTransactionsWebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket using centralized API_CONFIG base URL (via service default)
    wsRef.current = new AllSystemTransactionsWebSocket();

    // Set up handlers
    const unsubscribeMessage = wsRef.current.onMessage((message) => {
      try {
        // Handle initial bulk payload: { type: "initial", data: { transactions: [...] } }
        if (message.type === "initial" && Array.isArray(message.data?.transactions)) {
          const list = message.data.transactions as any[];

          const mapped: Transaction[] = list.map((data) => {
            const type = String(data.transaction_type || "").toLowerCase();

            // Derive a nicer From/To using similar rules as RatesTransactionHistory
            let fromName = "";
            let fromLogo = "";
            let toName = "";
            let toLogo = "";

            if (type === "moneyx") {
              // MoneyX: From = payment provider, To = currency/asset
              fromName = data.payment_provider || data.user_name || "MoneyX";
              fromLogo = getBankLogo(data.payment_provider || "");
              toName = data.currency || "USD";
              toLogo = data.asset_image || "/icons/usdt.svg";
            } else if (type === "p2p_deposit") {
              // P2P deposit: From = user, To = asset
              fromName = data.user_name || "P2P Deposit";
              fromLogo = getBankLogo(data.payment_provider || fromName);
              toName = data.currency || "USDT";
              toLogo = data.asset_image || "/icons/usdt.svg";
            } else if (type === "p2p_withdraw") {
              // P2P withdraw: From = asset, To = user
              fromName = data.currency || "USDT";
              fromLogo = data.asset_image || "/icons/usdt.svg";
              toName = data.user_name || "P2P Withdraw";
              toLogo = getBankLogo(data.payment_provider || toName);
            } else if (type === "p2p_trade") {
              // P2P trade: From = buyer, To = seller (or generic labels)
              fromName = data.buyer_name || "Buyer";
              fromLogo = getBankLogo(fromName);
              toName = data.seller_name || "Seller";
              toLogo = getBankLogo(toName);
            } else {
              // Fallback: From = currency, To = payment provider or user
              fromName = data.currency || data.user_name || "Transaction";
              fromLogo = data.asset_image || "/icons/usdt.svg";
              toName = data.payment_provider || data.user_name || "Destination";
              toLogo = getBankLogo(data.payment_provider || "");
            }

            return {
              id:
                data.id ||
                data.transaction_id ||
                `tx-${Date.now()}-${Math.random()}`,
              from: {
                name: fromName,
                logo: fromLogo,
              },
              to: {
                name: toName,
                logo: toLogo,
              },
              amount:
                data.amount || data.total_amount || data.total_amount_due || "0",
              currency: data.currency || "USD",
              timestamp:
                data.timestamp || data.created_at || new Date().toISOString(),
              when: formatTimeAgo(
                data.timestamp || data.created_at || new Date().toISOString()
              ),
            };
          }).sort((a, b) => {
            // Sort so latest timestamp appears on top
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });

          // Replace the list with the initial snapshot (newest first)
          setTransactions(mapped.slice(0, 100));
          return;
        }

        // Handle incremental single-transaction updates
        if (message.type === "transaction" || message.type === "new_transaction") {
          const data = message.data;
          
          // Transform the message data to Transaction format
          const transaction: Transaction = {
            id: data.id || data.transaction_id || `tx-${Date.now()}-${Math.random()}`,
            from: {
              name: data.from || data.from_bank || data.from_provider || "Unknown",
              logo: data.from_logo || getBankLogo(data.from || data.from_bank || ""),
            },
            to: {
              name: data.to || data.to_bank || data.to_provider || "Unknown",
              logo: data.to_logo || getBankLogo(data.to || data.to_bank || ""),
            },
            amount: data.amount || data.total_amount || "0",
            currency: data.currency || "USD",
            timestamp: data.timestamp || data.created_at || new Date().toISOString(),
            when: formatTimeAgo(data.timestamp || data.created_at || new Date().toISOString()),
          };

          // Add new transaction to the beginning of the list
          setTransactions((prev) => [transaction, ...prev].slice(0, 100)); // Keep last 100
        }
      } catch (error) {
        console.error("Error processing transaction message:", error);
      }
    });

    const unsubscribeOpen = wsRef.current.onOpen(() => {
      setIsConnected(true);
    });

    const unsubscribeClose = wsRef.current.onClose(() => {
      setIsConnected(false);
    });

    const unsubscribeError = wsRef.current.onError((error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    });

    // Connect
    wsRef.current.connect();

    // Cleanup
    return () => {
      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
      wsRef.current?.disconnect();
    };
  }, []);

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
          See all OMAYA MoneyX and P2P activity streaming in real time. This feed updates automatically as new transactions are completed across the platform.
        </p>
      </div>

      {/* Status indicator only */}
      <div className="flex items-center justify-end mb-2 sm:mb-3">
        <div className={`flex items-center gap-1.5 ${isConnected ? 'text-[#13B562]' : 'text-red-500'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#13B562] animate-pulse' : 'bg-red-500'}`}></div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#1D1D23] rounded-2xl border border-[#E8EFF5] dark:border-[#35353E] overflow-hidden">
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#13B562] animate-pulse' : 'bg-gray-400'}`}></div>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-[#788099]">
                        {isConnected ? 'Waiting for transactions...' : 'Connecting to live feed...'}
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
                        <img
                          src={tx.from.logo}
                          alt={tx.from.name}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
                          }}
                        />
                        <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          {tx.from.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img
                          src={tx.to.logo}
                          alt={tx.to.name}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
                          }}
                        />
                        <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          {tx.to.name}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base ${getAmountColor(index)}`}>
                      ${parseFloat(tx.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
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
      </div>
    </div>
  );
};

export default LiveTransactionsPage;

