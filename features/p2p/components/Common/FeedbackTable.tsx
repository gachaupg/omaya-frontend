import React, { useState } from "react";
import { Feedback } from "@/features/p2p/types";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";

const COIN_ICONS: Record<string, string> = {
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  TRON: "https://cryptologos.cc/logos/tron-trx-logo.png",
  TRC20:
    "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png",
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
              <tr className="bg-[#23232b] text-[#A0A3BC]">
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
                <tr key={index} className="border-b border-[#35354a]">
                  {[...Array(9)].map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2">
                      <div className="h-6 bg-[#35354a] rounded animate-pulse"></div>
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
      <div className="overflow-x-auto rounded-2xl">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="bg-[#23232b] text-[#A0A3BC]">
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
                <tr className="border-b border-[#35354a] hover:bg-[#28293d] transition-colors duration-200">
                  {/* Coin */}
                  <td className="px-4 py-2 flex items-center gap-2">
                    <img
                      src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
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
                    {new Date(item.date).toLocaleString()}
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
