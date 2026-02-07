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

const ASSET_ICON_URL =
  "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png";
const PAYMENT_ICON_URL =
  "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";

// Map WebSocket message data to Transaction format
const mapWsDataToTransaction = (data: any): Transaction => {
  const id = data.id || data.transaction_id || `tx-${Date.now()}-${Math.random()}`;
  const amount = data.amount || data.total_amount || data.total_amount_due || "0";
  const timestamp = data.timestamp || data.created_at || new Date().toISOString();
  return {
    transaction_type: data.transaction_type || data.type || "transaction",
    transaction_id: id,
    user: {
      id: data.user_id || 0,
      name: data.user_name || data.from || data.from_bank || "User",
      email: "",
      photo: null,
    },
    amount,
    currency: data.currency || "USD",
    asset_image: data.asset_image || null,
    total_amount_due: amount,
    payment_provider: data.payment_provider || data.from_provider || data.from_bank || "",
    status: data.status || "completed",
    stages: "",
    timestamp,
  };
};

// Helper function to get bank logo
const getBankLogo = (bankName: string): string => {
  // To avoid 404s from /banks/*.png, always use the Cloudinary default for now
  return "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
};

// Helper function to determine From and To based on transaction type
const getFromTo = (tx: Transaction): { from: { name: string; logo: string }; to: { name: string; logo: string } } => {
  const transactionType = tx.transaction_type?.toLowerCase() || "";
  
  // Helper to check if a name is likely a crypto asset (USDT, BTC, ETH, etc.)
  const isCryptoAsset = (name: string) => {
    const cryptoAssets = ['usdt', 'btc', 'eth', 'usd', 'usdc', 'bnb', 'trx', 'aurora_eth'];
    return cryptoAssets.some(crypto => name.toLowerCase().includes(crypto));
  };
  
  // For deposits: From = payment provider (bank), To = crypto asset
  if (transactionType === "deposit" || transactionType === "moneyx") {
    const providerName = tx.payment_provider || "Payment Provider";
    const assetName = tx.currency || "USD";
    
    return {
      from: {
        name: providerName,
        logo: PAYMENT_ICON_URL, // Always use payment icon for banks/providers
      },
      to: {
        name: assetName,
        logo: tx.asset_image || ASSET_ICON_URL, // Use asset image for crypto
      },
    };
  }
  
  // For withdrawals: From = crypto asset, To = payment provider (bank)
  if (transactionType === "withdrawal") {
    const assetName = tx.currency || "USD";
    const providerName = tx.payment_provider || "Payment Provider";
    
    return {
      from: {
        name: assetName,
        logo: tx.asset_image || ASSET_ICON_URL, // Use asset image for crypto
      },
      to: {
        name: providerName,
        logo: PAYMENT_ICON_URL, // Always use payment icon for banks/providers
      },
  };
  }
  
  // For P2P: From = payment provider, To = crypto asset
  if (transactionType.includes("p2p")) {
    const providerName = tx.payment_provider || "Payment Provider";
    const assetName = tx.currency || "USD";
    
    return {
      from: {
        name: providerName,
        logo: PAYMENT_ICON_URL, // Use payment icon for provider
      },
      to: {
        name: assetName,
        logo: tx.asset_image || ASSET_ICON_URL, // Use asset image for crypto
      },
    };
  }
  
  // Default: Determine based on names
  const firstName = tx.payment_provider || tx.currency || "Source";
  const secondName = tx.currency || "Destination";
  
  // If first name is crypto, swap them
  if (isCryptoAsset(firstName)) {
    return {
      from: {
        name: firstName,
        logo: tx.asset_image || ASSET_ICON_URL,
      },
      to: {
        name: secondName,
        logo: PAYMENT_ICON_URL,
      },
    };
  }
  
  // Default: From = payment provider, To = asset
  return {
    from: {
      name: firstName,
      logo: PAYMENT_ICON_URL,
    },
    to: {
      name: secondName,
      logo: tx.asset_image || ASSET_ICON_URL,
    },
  };
};

const RatesTransactionHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.transaction
  );
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<AllSystemTransactionsWebSocket | null>(null);

  const getAmountColor = useMemo(
    () => (type: string) => (type === "withdrawal" ? "text-red-500" : "text-[#1D8751]"),
    []
  );

  useEffect(() => {
    dispatch(fetchTransactions());
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
        {transactions.map((tx: Transaction, index: number) => {
          const { from, to } = getFromTo(tx);
          const amountColor = index % 2 === 0 ? "text-[#13B562]" : "text-red-500";
          
          return (
          <div key={tx.transaction_id} className="border border-gray-200 dark:border-[#35353E] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                <img
                    src={from.logo}
                    alt={from.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
                    }}
                  />
                  <span className="text-gray-900 dark:text-white font-medium">{from.name}</span>
                  <span className="text-gray-500">→</span>
                  <img
                    src={to.logo}
                    alt={to.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
                    }}
                  />
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
          {transactions.map((tx: Transaction, index: number) => {
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
                <img
                      src={from.logo}
                      alt={from.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
                      }}
                    />
                    <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      {from.name}
                  </span>
                </div>
              </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <img
                      src={to.logo}
                      alt={to.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
                      }}
                    />
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
    </div>
  );
};

export default RatesTransactionHistory;
