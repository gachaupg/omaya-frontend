import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Share,
  Copy,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchTransactions,
  searchTransactions,
} from "@/features/exchange/slices/exchangeSlice";
import {
  Transaction as ApiTransaction,
  Transaction,
} from "@/features/exchange/types";
import { div } from "framer-motion/client";
import { storage } from "@/features/auth/utils/storage";
import { TransactionHistorySkeleton } from "@/components/ui/Skeletons";

import { logger } from "@/lib/utils/logger";

type TransactionDisplay = {
  id: string;
  type: string;
  date: string;
  amount: string;
  status: string;
  asset: string;
};

type TransactionHistoryTableProps = {
  transactions?: TransactionDisplay[];
};

const ReceiptModal = ({
  isOpen,
  onClose,
  transaction,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}) => {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-1 overflow-y-auto max-h-[100vh]"
      style={{ background: "rgba(24, 24, 29, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#18181D] rounded-3xl w-full max-w-md relative border border-[#3A3B45] overflow-x-hidden mt-56 max-w-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative z-10 p-6 pb-4">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/images/tether.svg"
              alt=""
            />
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-white absolute top-2 right-4"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 border border-[#35353E] rounded-lg">
            {/* Transaction Header */}
            <div className="flex items-center justify-between mb-2 border-b border-[#35353E] p-2">
              <div className="flex items-center gap-3">
                <BitcoinIcon />
                <div>
                  <p className="text-white font-medium text-md">
                    {transaction.currency}{" "}
                    <span className="text-[#788099] text-sm">
                      {transaction.transaction_type}
                    </span>
                  </p>
                  <p className="text-[#788099] text-sm">
                    {formatDate(transaction.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col text-[#788099]">
                <div className="flex gap-2 justify-between items-center text-right">
                  <div>
                    <span className="text-sm text-right">Share</span>
                  </div>
                  <div>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 14L34 24L20 34V28C12 28 6 32 4 40C4 31 10 22 20 22V14Z"
                        stroke="#2DA56A"
                        strokeWidth="3"
                        strokeLinecap="butt"
                        strokeLinejoin="miter"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
                {transaction.screenshot && (
                  <div className="flex gap-2">
                    <p className="text-sm">Transaction Screenshot</p>
                    <button className="text-[#10B981] hover:text-[#059669] transition-colors p-1 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Section */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[#9CA3AF] text-sm mb-1">Total Amount</p>
                  <p
                    className={`${transaction.transaction_type === "deposit"
                        ? "text-[#10B981]"
                        : "text-[#EF4444]"
                      } text-md font-medium`}
                  >
                    {transaction.transaction_type === "deposit" ? "+" : "-"}
                    {transaction.total_amount.toFixed(2)} {transaction.currency}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex justify-between items-center gap-5">
                    <span className="text-[#9CA3AF] text-sm">Commission</span>
                    <span className="text-white text-sm">
                      {transaction.commission.toFixed(2)} {transaction.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-5">
                    <span className="text-[#9CA3AF] text-sm">Net Amount</span>
                    <span className="text-white text-sm">
                      {transaction.amount.toFixed(2)} {transaction.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="relative z-10 rounded-lg mt-2">
            {/* Payment Details */}
            <div className="flex flex-col gap-2 mb-6 border border-[#35353E] p-2 rounded-lg">
              <div className="flex justify-between border-b border-dotted border-[#35353E]">
                <p className="text-white text-sm mb-1">Payment Method:</p>
                <p className="text-[#788099] text-sm">
                  {transaction.payment_method}
                </p>
              </div>
              <div className="flex justify-between border-b border-dotted border-[#35353E]">
                <p className="text-white text-sm mb-1">Payment Provider:</p>
                <p className="text-[#788099] text-sm">
                  {transaction.payment_provider}
                </p>
              </div>
              <div className="flex justify-between border-b border-dotted border-[#35353E]">
                <p className="text-white text-sm mb-1">Account Name:</p>
                <p className="text-[#788099] text-sm">
                  {transaction.account_name}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-white text-sm mb-1">Account Number:</p>
                <p className="text-[#788099] text-sm">
                  {transaction.account_number}
                </p>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="flex flex-col gap-2 p-2 border border-[#35353E] rounded-lg mb-6">
              {transaction.withdrawal_address && (
                <div className="flex justify-between border-b border-dotted border-[#35353E]">
                  <p className="text-white text-sm mb-1">Withdrawal Address</p>
                  <p className="text-[#788099] text-sm break-all">
                    {transaction.withdrawal_address}
                  </p>
                </div>
              )}
              {transaction.transaction_harsh && (
                <div className="flex justify-between">
                  <p className="text-white text-sm mb-1">Transaction Hash:</p>
                  <p className="text-[#788099] text-sm break-all">
                    {transaction.transaction_harsh}
                  </p>
                </div>
              )}
            </div>

            {/* Status and Additional Info */}
            <div className="flex flex-col gap-2 p-2 border border-[#35353E] rounded-lg">
              <div className="flex justify-between items-center border-b border-dotted border-[#35353E]">
                <span className="text-white text-sm">Status:</span>
                <span
                  className={`text-sm font-medium ${transaction.status === "completed"
                      ? "text-[#10B981]"
                      : transaction.status === "pending"
                        ? "text-[#F59E0B]"
                        : "text-[#EF4444]"
                    }`}
                >
                  {transaction.status.charAt(0).toUpperCase() +
                    transaction.status.slice(1)}
                </span>
              </div>

              {transaction.stages && (
                <div className="flex justify-between items-center border-b border-dotted border-[#35353E]">
                  <span className="text-white text-sm">Stage:</span>
                  <span className="text-[#788099] text-sm">
                    {transaction.stages}
                  </span>
                </div>
              )}

              {transaction.reason && (
                <div className="flex justify-between items-center border-b border-dotted border-[#35353E]">
                  <span className="text-white text-sm">Reason:</span>
                  <span className="text-[#788099] text-sm">
                    {transaction.reason}
                  </span>
                </div>
              )}

              {transaction.additional_info && (
                <div className="flex justify-between items-center border-b border-dotted border-[#35353E]">
                  <span className="text-white text-sm">Additional Info:</span>
                  <span className="text-[#788099] text-sm">
                    {transaction.additional_info}
                  </span>
                </div>
              )}

              {transaction.assigned_to &&
                transaction.assigned_to.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm">Assigned To:</span>
                    <span className="text-[#788099] text-sm">
                      {transaction.assigned_to.join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BitcoinIcon = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-[#F7931A] to-[#FF8C00] rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
    <span className="text-white font-bold text-sm">₿</span>
  </div>
);

const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.exchange
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const profile = storage.getProfile();
    const email = profile?.user?.email || "";
    setUserEmail(email);
  }, []);

  // Fetch transactions when userEmail is set
  useEffect(() => {
    if (userEmail) {
      logger.debug("exchange", "=== FETCHING TRANSACTIONS ===", { userEmail });
      dispatch(fetchTransactions());
    }
  }, [dispatch, userEmail]);

  logger.debug("exchange", "User email:", userEmail);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery && userEmail) {
        dispatch(
          searchTransactions({
            search: searchQuery,
            page: currentPage,
          })
        );
      } else if (userEmail) {
        dispatch(fetchTransactions());
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentPage, dispatch, userEmail]);

  const handleEyeClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptModalOpen(true);
  };

  const closeModal = () => {
    setIsReceiptModalOpen(false);
    setSelectedTransaction(null);
  };

  const getFilteredTransactions = (): Transaction[] => {
    if (!transactions || !userEmail) {
      logger.debug("exchange", "No transactions or user email available:", {
        transactions,
        userEmail,
      });
      return [];
    }

    logger.debug("exchange", "Filtering transactions:", {
      totalTransactions: transactions.length,
      userEmail,
      firstTransaction: transactions[0],
    });

    const filtered = transactions.filter((tx) => {
      const matches = tx.user_email === userEmail;
      return matches;
    });

    logger.debug("exchange", "Filtered transactions:", {
      totalFiltered: filtered.length,
      firstFiltered: filtered[0],
    });

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Show skeleton while loading initial data
  if (loading && (!transactions || transactions.length === 0)) {
    return <TransactionHistorySkeleton rows={6} />;
  }

  return (
    <div className="rounded-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[#1D8751] text-xl font-medium">
            Transaction History
          </h1>
          <div className="flex items-center gap-2 text-[#9CA3AF] cursor-pointer hover:text-white transition-colors">
            <span className="text-sm">Month</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-44">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1D8751] w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-[#2D2E3A] rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
            />
          </div>

          {/* Export Button */}
          <button className="w-full sm:w-auto text-[#1D8751] rounded-lg text-sm font-medium transition-colors">
            Export Transactions
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#1D1D23] rounded-2xl border border-[#2D2E3A] overflow-hidden w-full">
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="bg-[#35353E] border-b border-[#35353E] px-4 sm:px-6 py-4 sticky top-0 z-10">
            <div className="grid grid-cols-12 items-center min-w-[800px]">
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                ID <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                Type <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                Date <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium flex items-center gap-1">
                Amount <ChevronDown className="w-3 h-3" />
              </div>
              <div className="col-span-2 text-[#9CA3AF] text-sm font-medium">
                Status
              </div>
              <div className="col-span-1 text-[#9CA3AF] text-sm font-medium">
                Receipt
              </div>
              <div className="col-span-1 text-[#9CA3AF] text-sm font-medium">
                More
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {currentTransactions.length > 0 ? (
              currentTransactions.map((tx: Transaction) => (
                <div
                  key={tx.transaction_id}
                  className="border-b border-[#2D2E3A] last:border-b-0 hover:bg-[#232430] transition-colors group"
                >
                  <div className="px-4 sm:px-6 py-4">
                    <div className="grid grid-cols-12 items-center min-w-[800px]">
                      {/* ID with Bitcoin Icon and colored left border */}
                      <div className="col-span-2 flex items-center gap-3 relative">
                        <div
                          className={`absolute left-[-16px] sm:left-[-24px] top-0 bottom-0 w-1 rounded-r ${tx.transaction_type === "deposit"
                              ? "bg-[#10B981]"
                              : "bg-[#EF4444]"
                            }`}
                        ></div>
                        <BitcoinIcon />
                        <span className="text-[#788099] text-sm font-medium truncate">
                          {tx.transaction_id}
                        </span>
                      </div>

                      {/* Type */}
                      <div className="col-span-2">
                        <span className="text-white text-sm truncate">
                          {tx.transaction_type.charAt(0).toUpperCase() +
                            tx.transaction_type.slice(1)}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <span className="text-[#788099] text-sm truncate">
                          {new Date(tx.timestamp).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2">
                        <span
                          className={`text-sm font-medium truncate ${tx.transaction_type === "deposit"
                              ? "text-[#10B981]"
                              : "text-[#EF4444]"
                            }`}
                        >
                          {tx.transaction_type === "deposit" ? "+" : "-"}
                          {tx.amount.toFixed(2)}{" "}
                          <span className="text-[#788099] ml-1">
                            {tx.currency}
                          </span>
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className="text-[#788099] text-sm rounded-md text-xs truncate">
                          {tx.status}
                        </span>
                      </div>

                      {/* Receipt */}
                      <div className="col-span-1">
                        <button
                          className="text-[#10B981] hover:text-[#059669] transition-colors p-1 rounded"
                          onClick={() => handleEyeClick(tx)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* More */}
                      <div className="col-span-1">
                        <button className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#788099]">
                {loading ? "Loading transactions..." : "No transactions found"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center mt-6 gap-2">
        <button
          className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#232430] transition-colors disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from(
          { length: Math.ceil(filteredTransactions.length / itemsPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                  ? "bg-[#10B981] text-white"
                  : "text-[#9CA3AF] hover:text-white hover:bg-[#232430]"
                }`}
            >
              {i + 1}
            </button>
          )
        )}

        <button
          className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#232430] transition-colors disabled:opacity-50"
          disabled={
            currentPage ===
            Math.ceil(filteredTransactions.length / itemsPerPage)
          }
          onClick={() =>
            setCurrentPage(
              Math.min(
                Math.ceil(filteredTransactions.length / itemsPerPage),
                currentPage + 1
              )
            )
          }
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeModal}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default TransactionHistoryTable;
