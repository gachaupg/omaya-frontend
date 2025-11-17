import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { fetchTransactions } from "../slices/transactionSlice";
import {
  formatTransactionType,
  formatAmount,
  formatTimeAgo,
  getCurrencyIcon,
  getStatusColor,
} from "../utils/transactionUtils";

const RatesTransactionHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.transaction
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
        {transactions.map((tx) => (
          <div key={tx.transaction_id} className="border border-gray-200 dark:border-[#35353E] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-white text-xs font-bold">
                  {getCurrencyIcon(tx.currency)}
                </div>
                <div>
                  <div className="text-gray-900 dark:text-white font-medium">{tx.currency}</div>
                  <div className="text-xs text-gray-600 dark:text-[#788099]">{tx.source}</div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(tx.status)}`}>
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
                <span className={getStatusColor(tx.status)}>{formatAmount(tx.total_amount_due, tx.currency)}</span>
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
      <div className="hidden sm:block w-full overflow-x-auto">
        <table className="min-w-max w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 dark:border-[#35353E] text-gray-600 dark:text-[#788099]">
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Asset</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Transaction Type</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Amount</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">Status</th>
            <th className="p-2 sm:p-3 lg:p-4 font-normal text-xs sm:text-sm lg:text-base">When</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr
              key={tx.transaction_id}
              className="border-b border-gray-200 dark:border-[#35353E] last:border-b-0"
            >
              <td className="p-2 sm:p-3 lg:p-4 flex items-center text-xs sm:text-sm lg:text-base">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-white text-xs font-bold">
                  {getCurrencyIcon(tx.currency)}
                </div>
                <div>
                  <div className="text-gray-900 dark:text-white">
                    {tx.currency}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-sm text-gray-600 dark:text-[#788099]">
                    {tx.source}
                  </div>
                </div>
              </td>
              <td className="p-2 sm:p-3 lg:p-4 text-gray-900 dark:text-white text-xs sm:text-sm lg:text-base">
                {formatTransactionType(tx.transaction_type)}
              </td>
              <td className={`p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base ${getStatusColor(tx.status)}`}>
                {formatAmount(tx.total_amount_due, tx.currency)}
              </td>
              <td className="p-2 sm:p-3 lg:p-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
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
