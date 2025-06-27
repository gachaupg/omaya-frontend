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
      <div className="bg-[#1D1D23] p-6 rounded-lg">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1D1D23] p-6 rounded-lg">
        <div className="text-red-500 text-center">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1D1D23] p-6 rounded-lg">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#35353E] text-[#788099]">
            <th className="p-4 font-normal">Asset</th>
            <th className="p-4 font-normal">Transaction Type</th>
            <th className="p-4 font-normal">Amount</th>
            <th className="p-4 font-normal">Status</th>
            <th className="p-4 font-normal">When</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr
              key={tx.transaction_id}
              className="border-b border-[#35353E] last:border-b-0"
            >
              <td className="p-4 flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-white text-xs font-bold">
                  {getCurrencyIcon(tx.currency)}
                </div>
                <div>
                  <div>{tx.currency}</div>
                  <div className="text-sm text-[#788099]">{tx.source}</div>
                </div>
              </td>
              <td className="p-4">
                {formatTransactionType(tx.transaction_type)}
              </td>
              <td className={`p-4 ${getStatusColor(tx.status)}`}>
                {formatAmount(tx.total_amount_due, tx.currency)}
              </td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                    tx.status
                  )}`}
                >
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
              </td>
              <td className="p-4 text-[#788099]">
                {formatTimeAgo(tx.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RatesTransactionHistory;
