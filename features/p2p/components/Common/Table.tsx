import React, { useState } from "react";
import { tokens } from "@/styles/tokens";
import { TransactionType } from "@/features/p2p/types";
import Button from "./Button";
import { MoreHorizontal, Download, Search, X } from "lucide-react";
import { formatDate, formatNumber } from "@/utils/formatters";

type TableProps = {
  title?: string;
  type?: string;
  data?: TransactionType[];
  loading?: boolean;
  error?: string | null;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onExport?: (format: "csv" | "pdf") => void;
  onSearch?: (query: string) => void;
  onViewTransaction?: (tx: TransactionType) => void;
};

export const Table: React.FC<TableProps> = ({
  title = "P2P History",
  data = [],
  type = "",
  loading = false,
  error = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onExport,
  onSearch,
  onViewTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionType | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleExport = (format: "csv" | "pdf") => {
    if (onExport) {
      onExport(format);
    }
    setShowExportOptions(false);
  };

  const getAmountColor = (type: string | undefined | null) => {
    if (!type) return `text-[${tokens.colors.dark.textBody}]`;
    if (type.toLowerCase() === "buy") return "text-[#1D8751]";
    if (type.toLowerCase() === "sell") return "text-[#FF4D4D]";
    return `text-[${tokens.colors.dark.textBody}]`;
  };

  const getStatusColor = (status: string | undefined | null) => {
    return "text-[#788099]";
  };

  const handleViewTransaction = (row: TransactionType) => {
    console.log("Setting selected transaction:", row);
    setSelectedTransaction(row);
    onViewTransaction && onViewTransaction(row);
  };

  // Add effect to monitor selectedTransaction changes
  React.useEffect(() => {
    console.log("Selected transaction updated:", selectedTransaction);
  }, [selectedTransaction]);

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-[#788099]">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-8">
        <div className="flex flex-col items-center justify-center border border-[#35353E] rounded-[24px] p-8 bg-[#23232B]">
          <div className="w-16 h-16 mb-4 rounded-full bg-[#35353E] flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#788099]"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8V12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#788099] mb-2">
            No Data Found
          </h3>
          <p className="text-sm text-[#8C8CA1] text-center max-w-md">
            Please sign in to view your P2P transactions or check back later.
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <div className="flex flex-col items-center justify-center border border-[#35353E] rounded-[24px] p-8 bg-[#23232B]">
          <div className="w-16 h-16 mb-4 rounded-full bg-[#35353E] flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#788099]"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8V12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#788099] mb-2">
            No Data Available
          </h3>
          <p className="text-sm text-[#8C8CA1] text-center max-w-md">
            There are currently no records to display. Please check back later
            or try adjusting your filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h3 className={`font-medium text-[${tokens.colors.dark.textTitle}]`}>
            {title}
          </h3>

          {type === "p2p" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className={`py-2 pl-9 pr-4 rounded-[24px] text-sm w-full border focus:outline-none bg-[${tokens.colors.dark.card}] text-[${tokens.colors.dark.textTitle}] border-[${tokens.colors.dark.border}]`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search
                    size={16}
                    className={`text-[${tokens.colors.dark.textBody}]`}
                  />
                </div>
              </div>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="text-sm"
                >
                  <p className="text-[#1D8751]">Export Transactions</p>
                </Button>

                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#23232B] border border-[#35353E] z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport("csv")}
                        className="block w-full text-left px-4 py-2 text-sm text-[#8C8CA1] hover:bg-[#35353E]"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="block w-full text-left px-4 py-2 text-sm text-[#8C8CA1] hover:bg-[#35353E]"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div
            className={`w-full border-2 bg-[${tokens.colors.dark.card}] border-[${tokens.colors.dark.border}] shadow-lg rounded-[24px]`}
          >
            {/* Table Header */}
            <div
              className={`grid grid-cols-6 md:grid-cols-7 py-3 px-4 border-b bg-[${tokens.colors.dark.card}] border-[${tokens.colors.dark.border}] rounded-t-[24px]`}
            >
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Asset
              </div>
              {type === "p2p" && (
                <div
                  className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
                >
                  ID
                </div>
              )}
              <div>
                <div
                  className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
                >
                  Type
                </div>
              </div>
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Amount
              </div>

              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Date
              </div>
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Status
              </div>
              <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                Receipt
              </div>
              {/* <div
                className={`text-sm font-medium text-[${tokens.colors.dark.textTitle}]`}
              >
                More
              </div> */}
            </div>

            {/* Table Body */}
            <div>
              {data.map((row, idx) => (
                <div
                  key={idx}
                  className={`w-full grid grid-cols-6 md:grid-cols-7 py-4 px-4 border-b last:border-b-0 items-center hover:bg-opacity-80 transition-colors border-[${tokens.colors.dark.border}] bg-[${tokens.colors.dark.background}]`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                      alt={row.asset}
                      className="w-6 h-6"
                    />
                  </div>
                  {type === "p2p" && (
                    <div
                      className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                    >
                      {row.id
                        ? `${row.id.slice(0, 3)}...${row.id.slice(-3)}`
                        : ""}
                    </div>
                  )}
                  <div>
                    <div
                      className={`text-sm ${getAmountColor(String(row.type))}`}
                    >
                      {row.type}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-sm ${getAmountColor(String(row.type))}`}
                    >
                      {formatNumber(Number(row.amount)).toString()}
                    </div>
                  </div>
                  <div
                    className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                  >
                    {formatDate(row.date)}
                  </div>
                  <div
                    className={`text-sm ${getStatusColor(String(row.status))}`}
                  >
                    {row.status}
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#1D8751]"
                      onClick={() => handleViewTransaction(row)}
                    >
                      View
                    </Button>
                  </div>
                  {/* <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="text-[#788099]">
                      <MoreHorizontal size={20} />
                    </Button>
                  </div> */}
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 bg-transparent rounded-b-[24px]">
                <button
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] bg-[#23232B] text-[#8C8CA1] ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#35353E]"
                  }`}
                >
                  &lt;
                </button>
                {totalPages <= 10 ? (
                  // Show all pages if total pages is 10 or less
                  Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => onPageChange?.(i + 1)}
                      className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] ${
                        currentPage === i + 1
                          ? "bg-[#1D8751] text-white"
                          : "bg-[#23232B] text-[#8C8CA1] hover:bg-[#35353E]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                ) : (
                  // Show first 5 and last 5 pages with ellipsis
                  <>
                    {/* First 5 pages */}
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => onPageChange?.(i + 1)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] ${
                          currentPage === i + 1
                            ? "bg-[#1D8751] text-white"
                            : "bg-[#23232B] text-[#8C8CA1] hover:bg-[#35353E]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    {/* Ellipsis */}
                    <span className="text-[#8C8CA1]">...</span>

                    {/* Last 5 pages */}
                    {Array.from({ length: 5 }, (_, i) => {
                      const pageNum = totalPages - 4 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange?.(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] ${
                            currentPage === pageNum
                              ? "bg-[#1D8751] text-white"
                              : "bg-[#23232B] text-[#8C8CA1] hover:bg-[#35353E]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </>
                )}
                <button
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium border border-[#35353E] bg-[#23232B] text-[#8C8CA1] ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#35353E]"
                  }`}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Portal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999]"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="bg-[#23232B] rounded-[24px] p-6 w-full max-w-[500px] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image at the top */}
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1749881460/Group_3_uwzqa8.png"
              alt="Transaction"
              className="block mx-auto mb-4 max-w-[120px] w-full h-auto"
            />
            {/* Header: Coin, Type, Date, Share/Note */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedTransaction.asset === "Tron"
                      ? "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                      : "https://cryptologos.cc/logos/bitcoin-btc-logo.png"
                  }
                  alt={selectedTransaction.asset}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="text-white font-semibold">
                    {selectedTransaction.asset}{" "}
                    <span
                      className={
                        selectedTransaction.type === "buy"
                          ? "text-[#1D8751]"
                          : selectedTransaction.type === "sell"
                          ? "text-[#FF4D4D]"
                          : "text-[#788099]"
                      }
                    >
                      {selectedTransaction.type}
                    </span>
                  </div>
                  <div className="text-xs text-[#788099]">
                    {formatDate(selectedTransaction.date)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Placeholder for Share icon */}
                <button className="text-[#1D8751]" title="Share">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51l6.83 3.98" />
                    <path d="M15.41 6.51l-6.82 3.98" />
                  </svg>
                </button>
                {/* Placeholder for Eye icon */}
                <button className="text-[#788099]" title="Note">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Amount and Fees */}
            <div className="flex justify-between items-center border-b border-[#35353E] pb-4 mb-4">
              <div>
                <div className="text-[#8C8CA1] text-xs">Total Amount</div>
                <div className="text-[#1D8751] text-2xl font-bold">
                  {formatNumber(Number(selectedTransaction?.amount ?? 0))} USD
                </div>
              </div>
              <div className="text-right text-xs text-[#8C8CA1]">
                <div>
                  Total Fee <span className="text-white">$3</span>
                </div>
                <div>
                  Network Fee <span className="text-white">$2</span>
                </div>
              </div>
            </div>
            {/* Payment Info */}
            <div className="border-b border-[#35353E] pb-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#8C8CA1]">Payment:</span>
                <span className="text-[#788099] flex items-center gap-1">
                  Salaam Bank{" "}
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Bitmap_Icon_Bank.png"
                    alt=""
                    className="w-5 h-5"
                  />
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#8C8CA1]">Account Number:</span>
                <span className="text-[#788099]">485634612949050</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C8CA1]">Account Name:</span>
                <span className="text-[#788099]">Omar Ali Omar</span>
              </div>
            </div>
            {/* Deposit Sent To */}
            <div className="border-b border-[#35353E] pb-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#8C8CA1]">Deposit Sent to</span>
                <span className="text-[#788099]">3434343233</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C8CA1]">Transaction Hash:</span>
                <span className="text-[#1D8751] underline cursor-pointer">
                  4673u98948294r89589374933rq
                </span>
              </div>
            </div>
            {/* Status, Receipt, Rating */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#8C8CA1]">Status:</span>
                <span className="text-[#1D8751] font-semibold">
                  {selectedTransaction.status || "Completed"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#8C8CA1]">Receipt:</span>
                <span className="text-[#1D8751]">
                  {/* Placeholder for Eye icon */}
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C8CA1]">Service Rating:</span>
                <span className="flex flex-row">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="text-[#FFB800] w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                    </svg>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
