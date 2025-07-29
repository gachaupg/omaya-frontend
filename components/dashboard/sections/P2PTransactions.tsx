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
  const totalPages = Math.ceil(trades.results.length / itemsPerPage);
  const paginatedData = trades.results.slice(
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
    <div className="w-full h-full dark:bg-[#23232b] bg-[#F5F5F5] rounded-2xl p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left bg-transparent">
          <thead>
            <tr className="text-[#A0A3BC] border-b border-[#35353E]">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Transaction Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Payment Method</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-white">
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
                <td colSpan={5} className="text-center py-8 dark:text-white">
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
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img
                      src={
                        COIN_ICONS[transaction.assetSymbol] || COIN_ICONS.USDT
                      }
                      alt={transaction.assetSymbol}
                      className="w-7 h-7 rounded-full bg-white"
                    />
                    <div>
                      <div className="font-medium text-base text-white">
                        {transaction.assetSymbol}
                      </div>
                      <div className="text-xs text-[#A0A3BC] mt-0.5">
                        {transaction.asset}
                      </div>
                    </div>
                  </td>
                  {/* Transaction Type */}
                  <td className="px-4 py-3">
                    <span
                      className={
                        typeof transaction.type === "string" &&
                        transaction.type === "buy"
                          ? "text-[#1D8751] font-semibold"
                          : "text-[#E23D3A] font-semibold"
                      }
                    >
                      {typeof transaction.type === "string"
                        ? transaction.type.charAt(0).toUpperCase() +
                          transaction.type.slice(1)
                        : ""}
                    </span>
                  </td>
                  {/* Amount */}
                  <td
                    className="px-4 py-3 text-lg font-bold"
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
                  <td className="px-4 py-3 flex items-center gap-2">
                    {transaction.payment &&
                      typeof transaction.payment === "object" &&
                      "logo" in transaction.payment &&
                      transaction.payment.logo && (
                        <img
                          src={transaction.payment.logo}
                          alt={transaction.payment.bank}
                          className="w-7 h-7 rounded-full bg-white"
                        />
                      )}
                    <span className="text-white">
                      {transaction.payment &&
                      typeof transaction.payment === "object" &&
                      "bank" in transaction.payment
                        ? transaction.payment.bank
                        : "N/A"}
                    </span>
                  </td>
                  {/* When */}
                  <td className="px-4 py-3 text-[#A0A3BC]">
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
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 rounded-full border border-[#35353E] text-white bg-[#23232b] hover:bg-[#35353E] transition disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx + 1)}
              className={`px-3 py-1 rounded-full border ${
                page === idx + 1
                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                  : "border-[#35353E] text-[#A0A3BC] bg-[#23232b] hover:bg-[#35353E]"
              } transition`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-full border border-[#35353E] text-white bg-[#23232b] hover:bg-[#35353E] transition disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default P2PTransactions;
