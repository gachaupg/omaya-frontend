import React, { useState } from "react";
import { Feedback } from "@/features/p2p/types";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";

const COIN_ICONS: Record<string, string> = {
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  TRON: "https://cryptologos.cc/logos/tron-trx-logo.png",
  TRC20:
    "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
};

const BANK_ICONS: Record<string, string> = {
  "Salam Bank": "/banks/salam.png",
  "Premier Bank": "/banks/premier.png",
  "Dahabshiil Bank": "/banks/dahabshiil.png",
};

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name) return email;
  return "****" + name.slice(-3) + "@" + domain;
}

interface FeedbackTableProps {
  data: Feedback[];
  loading?: boolean;
}

const FeedbackTable: React.FC<FeedbackTableProps> = ({ data, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data?.length / itemsPerPage) || 1;

  const toggleRowExpansion = (tradeId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-2xl">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-[#E8EFF5] dark:bg-[#23232b] text-[#788099] dark:text-[#A0A3BC]">
                <th className="px-4 py-3 font-medium">Coin</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Transaction ID</th>
                <th className="px-4 py-3 font-medium">User name</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="border-b border-[#E8EFF5] dark:border-[#35354a]">
                  {[...Array(9)].map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2">
                      <div className="h-6 bg-[#E8EFF5] dark:bg-[#35354a] rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 dark:bg-[#23232b] bg-gray-100 rounded-lg">
          <div className="h-6 w-48 bg-[#35354a] rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-[#35354a] rounded animate-pulse"></div>
            <div className="h-8 w-32 bg-[#35354a] rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-[#35354a] rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0)
    return (
      <NoDataFound
        title="No Feedback Records Found"
        message="There are currently no feedback records to display. Try again later or after you have some feedback."
      />
    );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="bg-[#E8EFF5] dark:bg-[#23232b] text-[#A0A3BC]">
              <th className="px-4 py-3 font-medium">Coin</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Transaction ID</th>
              <th className="px-4 py-3 font-medium">User name</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Comment</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <React.Fragment key={item.trade_id}>
                <tr className="border-b border-[#E8EFF5] dark:border-[#35354a] dark:hover:bg-[#28293d] transition-colors duration-200">
                  {/* Coin */}
                  <td className="px-4 py-2 flex items-center gap-2">
                    <img
                      src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                      alt={item.coin}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium dark:text-white text-gray-900">
                      {item.coin}
                    </span>
                  </td>
                  {/* Type */}
                  <td className="px-4 py-2">
                    <span
                      className={
                        item.type === "buy"
                          ? "text-[#1D8751] font-semibold"
                          : "text-[#E23D3A] font-semibold"
                      }
                    >
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                  </td>
                  {/* Transaction ID */}
                  <td className="px-4 py-2 dark:text-white text-gray-900">
                    {item.transaction_id}
                  </td>
                  {/* User name */}
                  <td className="px-4 py-2 dark:text-white text-gray-900">
                    {maskEmail(item.reviewer_email)}
                  </td>
                  {/* Amount */}
                  <td className="px-4 py-2 dark:text-white text-gray-900">
                    {item.amount}USD
                  </td>
                  {/* Payment (bank name only, no image) */}
                  <td className="px-4 py-2 dark:text-white text-gray-900">
                    Salam Bank
                  </td>
                  {/* Date */}
                  <td className="px-4 py-2 dark:text-white text-gray-900">
                    {new Date(item.date).toLocaleString("en-US", {
                      timeZone: "UTC"
                    })}
                  </td>
                  {/* Rating */}
                  <td className="px-4 py-2">
                    <span
                      className={
                        item.is_positive
                          ? "text-[#1D8751] font-semibold"
                          : "text-[#E23D3A] font-semibold"
                      }
                    >
                      {item.is_positive ? "Positive" : "Negative"}
                    </span>
                  </td>
                  {/* Comment */}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleRowExpansion(item.trade_id)}
                      className="text-[#1D8751] hover:underline font-medium transition-colors duration-200 hover:text-[#16a34a]"
                    >
                      {expandedRows.has(item.trade_id) ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {/* Expandable Comment Row */}
                {expandedRows.has(item.trade_id) && (
                  <tr className="border-b border-[#35354a] bg-[#1a1a1f]">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="text-sm text-[#A0A3BC] mb-1">
                            Comment:
                          </div>
                          <div className="text-sm dark:text-white text-gray-900 bg-[#23232b] rounded-lg p-3 border border-[#35354a]">
                            {item.comment || "No comment provided"}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {currentItems.map((item) => (
          <div
            key={item.trade_id}
            className="bg-white dark:bg-[#23232b] rounded-2xl border border-[#E8EFF5] dark:border-[#35354a] p-4 space-y-3"
          >
            {/* Top Row: Coin and Type */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EFF5] dark:border-[#35354a]">
              <div className="flex items-center gap-2">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  alt={item.coin}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium dark:text-white text-gray-900 text-sm">
                  {item.coin}
                </span>
              </div>
              <span
                className={
                  item.type === "buy"
                    ? "text-[#1D8751] font-semibold text-sm"
                    : "text-[#E23D3A] font-semibold text-sm"
                }
              >
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </span>
            </div>

            {/* Amount and Rating Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Amount</span>
                <span className="text-sm font-semibold dark:text-white text-gray-900">
                  {item.amount}USD
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Rating</span>
                <span
                  className={
                    item.is_positive
                      ? "text-[#1D8751] font-semibold text-sm"
                      : "text-[#E23D3A] font-semibold text-sm"
                  }
                >
                  {item.is_positive ? "Positive" : "Negative"}
                </span>
              </div>
            </div>

            {/* Transaction ID and User */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#E8EFF5] dark:border-[#35354a]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Transaction ID</span>
                <span className="text-xs dark:text-white text-gray-900 font-mono">
                  {String(item.transaction_id).slice(0, 12)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">User</span>
                <span className="text-xs dark:text-white text-gray-900">
                  {maskEmail(item.reviewer_email)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Payment</span>
                <span className="text-xs dark:text-white text-gray-900">Salam Bank</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Date</span>
                <span className="text-xs dark:text-white text-gray-900">
                  {new Date(item.date).toLocaleString("en-US", {
                    timeZone: "UTC",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>

            {/* Comment Section */}
            <div className="pt-2 border-t border-[#E8EFF5] dark:border-[#35354a]">
              <button
                onClick={() => toggleRowExpansion(item.trade_id)}
                className="w-full text-left text-[#1D8751] hover:underline font-medium transition-colors duration-200 hover:text-[#16a34a] text-sm"
              >
                {expandedRows.has(item.trade_id) ? "Hide Comment" : "View Comment"}
              </button>
              {expandedRows.has(item.trade_id) && (
                <div className="mt-2 flex items-start gap-2">
                  <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-xs text-[#A0A3BC] mb-1">Comment:</div>
                    <div className="text-sm dark:text-white text-gray-900 bg-[#E8EFF5] dark:bg-[#23232b] rounded-lg p-3 border border-[#E8EFF5] dark:border-[#35354a]">
                      {item.comment || "No comment provided"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#23232b] rounded-lg">
        <div className="dark:text-white text-gray-900">
          Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of{" "}
          {data.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-[#35354a] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#28293d]"
          >
            Previous
          </button>
          <span className="px-3 py-1 dark:text-white text-gray-900">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-[#35354a] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#28293d]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTable;
