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
  "https://omayabucket.s3.amazonaws.com/bank_logo/image_7.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW7TPBKP2YLA7Y4X4%2F20251123%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20251123T135945Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=4b6da7174dc37d4563aeb22adf37d1fa70b0c429f1710606e4346cbbe8c8be2f";

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
        {transactions.map((tx: Transaction) => (
          <div key={tx.transaction_id} className="border border-gray-200 dark:border-[#35353E] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <img
                  src={ASSET_ICON_URL}
                  alt={`${tx.currency} network`}
                  className="w-10 h-10 object-contain mr-3"
                />
                <div>
                  <div className="text-gray-900 dark:text-white font-medium">{tx.currency}</div>
                  <div className="text-xs text-gray-600 dark:text-[#788099]">{tx.source}</div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs sm:text-sm lg:text-base ${getStatusColor(tx.status)}`}>
                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#788099]">Type:</span>
                <span className="text-gray-900 dark:text-white">{formatTransactionType(tx.transaction_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#788099]">Amount:</span>
                <span className={getAmountColor(tx.transaction_type)}>
                  {formatAmount(tx.total_amount_due, tx.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#788099]">Payment Method:</span>
                <div className="flex items-center space-x-1">
                  <img
                    src={PAYMENT_ICON_URL}
                    alt="Payment method"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-gray-900 dark:text-white">Salam Bank</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#788099]">When:</span>
                <span className="text-gray-600 dark:text-[#788099]">{formatTimeAgo(tx.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden sm:block w-full overflow-x-auto border border-gray-200 dark:border-[#35353E] rounded-lg">
        <table className="min-w-max w-full text-left">
        <thead>
          <tr className="bg-gray-100 dark:bg-transparent border-b border-gray-200 dark:border-[#35353E] text-gray-600 dark:text-[#788099]">
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Asset</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Transaction Type</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Amount</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Payment Method</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base min-w-[120px]">Status</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">When</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx: Transaction, index: number) => (
            <tr
              key={tx.transaction_id}
              className="border-b border-gray-200 dark:border-[#35353E] last:border-b-0"
            >
              <td className="p-2 sm:p-3 lg:p-4 flex items-center text-xs sm:text-sm lg:text-base">
                <img
                  src={ASSET_ICON_URL}
                  alt={`${tx.currency} network`}
                  className="w-8 h-8 object-contain mr-3"
                />
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm lg:text-base">
                    {tx.currency}
                  </span>
                  <span className="text-xs sm:text-sm lg:text-sm text-gray-600 dark:text-[#788099]">
                    {tx.source}
                  </span>
                </div>
              </td>
              <td className="p-2 sm:p-3 lg:p-4 text-gray-900 dark:text-white text-xs sm:text-sm lg:text-base">
                {formatTransactionType(tx.transaction_type)}
              </td>
              <td className={`p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base ${getAmountColor(tx.transaction_type)}`}>
                {formatAmount(tx.total_amount_due, tx.currency)}
              </td>
              <td className="p-2 sm:p-3 lg:p-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white">
                  <img
                    src={PAYMENT_ICON_URL}
                    alt="Payment method"
                    className="w-6 h-6 object-contain"
                  />
                  <span>Salam Bank</span>
                </div>
              </td>
              <td className="p-2 sm:p-3 lg:p-4 min-w-[120px]">
                <span
                  className={`px-2 py-1 rounded-full text-xs sm:text-sm lg:text-base ${getStatusColor(
                    tx.status
                  )}`}
                >
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
              </td>
              <td className="p-2 sm:p-3 lg:p-4 text-gray-600 dark:text-[#788099] text-xs sm:text-sm lg:text-base">
                {formatTimeAgo(tx.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        
      </div>
    </div>
  );
};

export default RatesTransactionHistory;
