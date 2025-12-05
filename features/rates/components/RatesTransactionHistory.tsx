import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { fetchTransactions } from "../slices/transactionSlice";
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

// Helper function to get bank logo
const getBankLogo = (bankName: string): string => {
  // To avoid 404s from /banks/*.png, always use the Cloudinary default for now
  return "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg";
};

// Helper function to determine From and To based on transaction type
const getFromTo = (tx: Transaction): { from: { name: string; logo: string }; to: { name: string; logo: string } } => {
  const transactionType = tx.transaction_type?.toLowerCase() || "";
  
  // For deposits: From = payment provider, To = currency/asset
  if (transactionType === "deposit" || transactionType === "moneyx") {
    return {
      from: {
        name: tx.payment_provider || "Payment Provider",
        logo: getBankLogo(tx.payment_provider || ""),
      },
      to: {
        name: tx.currency || "USD",
        logo: tx.asset_image || ASSET_ICON_URL,
      },
    };
  }
  
  // For withdrawals: From = currency/asset, To = payment provider
  if (transactionType === "withdrawal") {
    return {
      from: {
        name: tx.currency || "USD",
        logo: tx.asset_image || ASSET_ICON_URL,
      },
      to: {
        name: tx.payment_provider || "Payment Provider",
        logo: getBankLogo(tx.payment_provider || ""),
      },
  };
  }
  
  // For P2P: From = payment provider, To = payment provider (or currency)
  if (transactionType.includes("p2p")) {
    return {
      from: {
        name: tx.payment_provider || tx.currency || "Source",
        logo: getBankLogo(tx.payment_provider || ""),
      },
      to: {
        name: tx.currency || "Destination",
        logo: tx.asset_image || ASSET_ICON_URL,
      },
    };
  }
  
  // Default: From = currency, To = payment provider
  return {
    from: {
      name: tx.currency || "USD",
      logo: tx.asset_image || ASSET_ICON_URL,
    },
    to: {
      name: tx.payment_provider || "Payment Provider",
      logo: getBankLogo(tx.payment_provider || ""),
    },
  };
};

const RatesTransactionHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.transaction
  );

  const getAmountColor = useMemo(
    () => (type: string) => (type === "withdrawal" ? "text-red-500" : "text-[#1D8751]"),
    []
  );

  useEffect(() => {
    dispatch(fetchTransactions());
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
          <tr className="bg-gray-50 dark:bg-[#23232B] border-b border-gray-200 dark:border-[#35353E] text-gray-600 dark:text-[#788099]">
            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]">
              From
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]">
              To
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]">
              Amount
            </th>
            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm text-gray-600 dark:text-[#788099]">
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
