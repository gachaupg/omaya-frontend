import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchUserTrades,
  setCurrentPage,
} from "@/features/p2p/slices/userTradesSlice";
import { TransactionType } from "@/features/p2p/types";
// TODO: If not installed, run: npm install date-fns
import { formatDistanceToNow } from "date-fns";
import { NoDataFound } from "../ui/Transactions";

const COIN_ICONS: Record<string, string> = {
  USDT: "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png",
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};
const BANK_ICONS: Record<string, string> = {
  "Salam Bank": "/banks/salam.png",
  "Premier Bank": "/banks/premier.png",
  "Dahabshiil Bank": "/banks/dahabshiil.png",
};

const P2PTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, loading, error, currentPage } = useSelector(
    (state: RootState) => state.userTrades
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;
  // Ensure trades.results is an array
  const tradesArray = Array.isArray(trades?.results) ? trades.results : [];
  const totalPages = Math.ceil(tradesArray.length / itemsPerPage);
  const paginatedData = tradesArray.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const fetchTrades = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchUserTrades({ page: currentPage }));
    }
  }, [dispatch, currentPage, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrades();
    }
  }, [fetchTrades]);

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const transformedData: TransactionType[] = paginatedData.map((trade) => {
    let assetSymbol =
      typeof trade.currency === "string" ? trade.currency : "USDT";
    let asset = typeof trade.currency === "string" ? trade.currency : "USDT";
    let payment = undefined;
    if (Array.isArray(trade.payment_details) && trade.payment_details[0]) {
      payment = {
        bank: trade.payment_details[0].provider,
        logo: BANK_ICONS[trade.payment_details[0].provider] || "",
      };
    }
    return {
      id: trade.id,
      type:
        typeof trade.order_type === "string"
          ? trade.order_type.toLowerCase()
          : "",
      date: trade.timestamp,
      amount: parseFloat(trade.amount).toFixed(2),
      status:
        typeof trade.status === "string" ? trade.status.toLowerCase() : "",
      asset,
      assetSymbol,
      payment,
    };
  });

  if (!paginatedData.length) {
    return (
      <NoDataFound
        title="No P2P Transactions Found"
        message="There are currently no P2P transactions to display. Please check back later or try adjusting your filters."
      />
    );
  }

  return (
    <div className="w-full h-full dark:bg-[#23232b] bg-[#F5F5F5] rounded-xl sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6">
      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-white">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : transformedData.length === 0 ? (
          <div className="text-center py-8 dark:text-white text-gray-900">
            No transactions found.
          </div>
        ) : (
          transformedData.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white dark:bg-[#28293d] border border-[#E8EFF5] dark:border-[#35353E] rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      COIN_ICONS[transaction.assetSymbol] || COIN_ICONS.USDT
                    }
                    alt={transaction.assetSymbol}
                    className="w-10 h-10 rounded-full bg-white flex-shrink-0"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {transaction.assetSymbol}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mt-0.5">
                      {transaction.asset}
                    </div>
                  </div>
                </div>
                <span
                  className={
                    typeof transaction.type === "string" &&
                    transaction.type === "buy"
                      ? "text-[#1D8751] font-semibold text-sm"
                      : "text-[#E23D3A] font-semibold text-sm"
                  }
                >
                  {typeof transaction.type === "string"
                    ? transaction.type.charAt(0).toUpperCase() +
                      transaction.type.slice(1)
                    : ""}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Amount</div>
                  <div
                    className="text-base font-bold"
                    style={{
                      color:
                        typeof transaction.type === "string" &&
                        transaction.type === "buy"
                          ? "#1D8751"
                          : "#E23D3A",
                    }}
                  >
                    ${transaction.amount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">Payment</div>
                  <div className="flex items-center gap-2">
                    {transaction.payment &&
                      typeof transaction.payment === "object" &&
                      "logo" in transaction.payment &&
                      transaction.payment.logo && (
                        <img
                          src={transaction.payment.logo}
                          alt={transaction.payment.bank}
                          className="w-6 h-6 rounded-full bg-white flex-shrink-0"
                        />
                      )}
                    <span className="text-gray-900 dark:text-white text-sm">
                      {transaction.payment &&
                      typeof transaction.payment === "object" &&
                      "bank" in transaction.payment
                        ? transaction.payment.bank
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1">When</div>
                  <div className="text-sm text-gray-900 dark:text-[#A0A3BC]">
                    {formatDistanceToNow(new Date(transaction.date), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm text-left bg-transparent">
          <thead>
            <tr className="text-[#A0A3BC] border-b border-[#35353E]">
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm">Asset</th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm">Transaction Type</th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm">Amount</th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm">Payment Method</th>
              <th className="px-3 sm:px-4 lg:px-4 py-3 font-medium text-xs sm:text-sm">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-600 dark:text-white">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-red-500">
                  {error}
                </td>
              </tr>
            ) : transformedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 dark:text-white text-gray-900">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transformedData.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-[#35353E] hover:bg-[#28293d]"
                >
                  {/* Asset */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                    <img
                      src={
                        COIN_ICONS[transaction.assetSymbol] || COIN_ICONS.USDT
                      }
                      alt={transaction.assetSymbol}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white flex-shrink-0"
                    />
                      <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white truncate">
                        {transaction.assetSymbol}
                      </div>
                        <div className="text-xs text-gray-500 dark:text-[#A0A3BC] truncate">
                        {transaction.asset}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Transaction Type */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3">
                    <span
                      className={`text-xs sm:text-sm lg:text-base font-semibold ${
                        typeof transaction.type === "string" &&
                        transaction.type === "buy"
                          ? "text-[#1D8751]"
                          : "text-[#E23D3A]"
                      }`}
                    >
                      {typeof transaction.type === "string"
                        ? transaction.type.charAt(0).toUpperCase() +
                          transaction.type.slice(1)
                        : ""}
                    </span>
                  </td>
                  {/* Amount */}
                  <td
                    className="px-3 sm:px-4 lg:px-4 py-3 text-sm sm:text-base lg:text-lg font-bold"
                    style={{
                      color:
                        typeof transaction.type === "string" &&
                        transaction.type === "buy"
                          ? "#1D8751"
                          : "#E23D3A",
                    }}
                  >
                    ${transaction.amount}
                  </td>
                  {/* Payment Method */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                    {transaction.payment &&
                      typeof transaction.payment === "object" &&
                      "logo" in transaction.payment &&
                      transaction.payment.logo && (
                        <img
                          src={transaction.payment.logo}
                          alt={transaction.payment.bank}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white flex-shrink-0"
                        />
                      )}
                      <span className="text-gray-900 dark:text-white text-xs sm:text-sm lg:text-base truncate">
                      {transaction.payment &&
                      typeof transaction.payment === "object" &&
                      "bank" in transaction.payment
                        ? transaction.payment.bank
                        : "N/A"}
                    </span>
                    </div>
                  </td>
                  {/* When */}
                  <td className="px-3 sm:px-4 lg:px-4 py-3 text-xs sm:text-sm text-gray-500 dark:text-[#A0A3BC]">
                    {formatDistanceToNow(new Date(transaction.date), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 flex-wrap">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded-full border border-[#35353E] text-gray-900 dark:text-white bg-white dark:bg-[#23232b] hover:bg-gray-100 dark:hover:bg-[#35353E] transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx + 1)}
              className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-full border text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0 ${
                page === idx + 1
                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                  : "border-[#35353E] text-gray-600 dark:text-[#A0A3BC] bg-white dark:bg-[#23232b] hover:bg-gray-100 dark:hover:bg-[#35353E]"
              } transition`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-2 sm:px-3 py-1.5 sm:py-1 rounded-full border border-[#35353E] text-gray-900 dark:text-white bg-white dark:bg-[#23232b] hover:bg-gray-100 dark:hover:bg-[#35353E] transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[44px] sm:min-h-0 lg:min-h-0"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default P2PTransactions;
