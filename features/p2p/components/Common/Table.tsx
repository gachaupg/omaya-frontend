import React, { useState, useRef } from "react";
import { tokens } from "@/styles/tokens";
import { TransactionType } from "@/features/p2p/types";
import Button from "./Button";
import { MoreHorizontal, Download, Search, X, ArrowLeft, Pointer } from "lucide-react";
import { formatDate, formatNumber } from "@/utils/formatters";
import { TiArrowUnsorted } from "react-icons/ti";
import html2canvas from "html2canvas";

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
  currentUserEmail?: string;
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
  currentUserEmail = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionType | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

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
    if (!type)
      return `text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`;
    if (type.toLowerCase() === "buy") return "text-[#FF4D4D]";
    if (type.toLowerCase() === "sell") return "text-[#1D8751]";
    return `text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`;
  };

  const getStatusColor = (status: string | undefined | null) => {
    return "text-gray-500 dark:text-[#788099]";
  };

  const handleViewTransaction = (row: TransactionType) => {
    setSelectedTransaction(row);
    onViewTransaction && onViewTransaction(row);
  };

  // Function to download modal as image
  const handleDownloadCard = async () => {
    if (!modalContentRef.current) return;
    
    try {
      const canvas = await html2canvas(modalContentRef.current);
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `OMAYA_Receipt_${selectedTransaction?.id?.substring(0, 8) || 'transaction'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // Silent error handling
    }
  };

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-gray-500 dark:text-[#788099]">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-8">
        <div className="flex flex-col items-center justify-center border border-gray-200 dark:border-[#35353E] rounded-[24px] p-8 bg-white dark:bg-[#23232B]">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-[#35353E] flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-500 dark:text-[#788099]"
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
          <h3 className="text-lg font-semibold text-gray-500 dark:text-[#788099] mb-2">
            No Data Found
          </h3>
          <p className="text-sm text-gray-400 dark:text-[#8C8CA1] text-center max-w-md">
            Please sign in to view your P2P transactions or check back later.
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <div className="flex flex-col items-center justify-center border border-gray-200 dark:border-[#35353E] rounded-[24px] p-8 bg-white dark:bg-[#23232B]">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-[#35353E] flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-500 dark:text-[#788099]"
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
          <h3 className="text-lg font-semibold text-gray-500 dark:text-[#788099] mb-2">
            No Data Available
          </h3>
          <p className="text-sm text-gray-400 dark:text-[#8C8CA1] text-center max-w-md">
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
          <h3
            className={`font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}]`}
          >
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
                  className={`py-2 pl-9 pr-4 rounded-[24px] text-sm w-full border focus:outline-none bg-white dark:bg-[${tokens.colors.dark.card}] text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] border-gray-200 dark:border-[${tokens.colors.dark.border}]`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search
                    size={16}
                    className={`text-gray-400 dark:text-[${tokens.colors.dark.textBody}]`}
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
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport("csv")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-400 dark:text-[#8C8CA1] hover:bg-gray-100 dark:hover:bg-[#35353E]"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-400 dark:text-[#8C8CA1] hover:bg-gray-100 dark:hover:bg-[#35353E]"
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
            className={`w-full border-2 bg-white dark:bg-[${tokens.colors.dark.card}] border-gray-200 dark:border-[${tokens.colors.dark.border}] shadow-lg rounded-[24px]`}
          >
            {/* Table Header */}
            <div
              className={`grid grid-cols-7 md:grid-cols-8 py-3 px-4 border-b bg-gray-50 dark:bg-[#35353E] border-gray-200 dark:border-[${tokens.colors.dark.border}] rounded-t-[24px]`}
            >
              <div
                className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}]`}
              >
                Asset
              </div>
              {type === "p2p" && (
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] flex items-center`}
                >
                  ID
                  <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                </div>
              )}
              <div>
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] flex items-center`}
                >
                  Type
                  <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                </div>
              </div>
              <div
                className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] flex items-center`}
              >
                Amount
                <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
              </div>

              <div
                className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] flex items-center`}
              >
                Date
                <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
              </div>
              <div
                className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] flex items-center`}
              >
                Time
                <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
              </div>
              <div
                className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] flex items-center`}
              >
                Status
                <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
              </div>
              <div
                className={`text-sm font-medium text-gray-900 dark:text-[${tokens.colors.dark.textTitle}] flex items-center`}
              >
                Receipt
                <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
              </div>
            </div>

            {/* Table Body */}
            <div>
              {data.map((row, idx) => (
                <div
                  key={idx}
                  className={`w-full grid grid-cols-7 md:grid-cols-8 py-4 px-4 border-b last:border-b-0 items-center hover:bg-gray-50 dark:hover:bg-[#2A2A35] transition-colors duration-200 border-gray-200 dark:border-[${tokens.colors.dark.border}] bg-white dark:bg-[${tokens.colors.dark.background}]`}
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
                      className={`text-sm text-gray-500 dark:text-[${tokens.colors.dark.textBody}] cursor-pointer relative`}
                      onMouseEnter={() => setTooltipId(row.id || "")}
                      onMouseLeave={() => setTooltipId(null)}
                      onClick={() => {
                        if (row.id) {
                          navigator.clipboard.writeText(row.id);
                          setCopiedId(row.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }
                      }}
                      title={`Click to copy full ID: ${row.id || ""}`}
                    >
                      {row.id
                        ? `${row.id.slice(0, 3)}...${row.id.slice(-3)}`
                        : ""}
                      {tooltipId === row.id && row.id && (
                        <div className="absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-xl whitespace-nowrap -top-10 left-1/2 transform -translate-x-1/2 border border-gray-700">
                          <div className="flex items-center gap-2">
                            <span>{row.id}</span>
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                      {copiedId === row.id && (
                        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-green-600 rounded shadow-lg whitespace-nowrap -top-8 left-1/2 transform -translate-x-1/2">
                          Copied!
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    {(() => {
                      const isOwner = row.rawData?.owner === currentUserEmail;
                      const displayType = isOwner 
                        ? (row.type === "buy" ? "Buy" : "Sell")
                        : (row.type === "buy" ? "Sell" : "Buy");
                      
                      // Color logic: Green for Sell, Red for Buy (regardless of owner)
                      const colorClass = displayType === "Sell" ? "text-[#1D8751]" : "text-[#FF4D4D]";
                      
                      return (
                        <div className={`text-sm ${colorClass}`}>
                          {displayType}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <div
                      className={`text-sm ${getAmountColor(String(row.type))}`}
                    >
                      {formatNumber(Number(row.amount)).toString()}
                    </div>
                  </div>
                  <div
                    className={`text-sm text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`}
                  >
                    {formatDate(row.date)}
                  </div>
                  <div
                    className={`text-sm text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`}
                  >
                    {new Date(row.date).toLocaleTimeString()}
                  </div>
                  <div
                    className={`text-sm ${getStatusColor(String(row.status))}`}
                  >
                    <span className="capitalize">{row.status}</span>
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
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 bg-transparent rounded-b-[24px]">
                <button
                  onClick={() => {
                    if (onPageChange) {
                      onPageChange(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#23232B] text-gray-400 dark:text-[#8C8CA1] ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100 dark:hover:bg-[#35353E]"
                  }`}
                >
                    &lt;
                </button>
                {(() => {
                  const pageButtons = [];
                  const maxPagesToShow = 7; // Show up to 7 page numbers
                  const sidePages = 2; // Pages to show on each side of current page
                  
                  if (totalPages <= maxPagesToShow) {
                    // Show all pages if total is 7 or less
                    for (let i = 1; i <= totalPages; i++) {
                      pageButtons.push(
                        <button
                          key={i}
                          onClick={() => {
                            onPageChange?.(i);
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] ${
                            currentPage === i
                              ? "bg-[#1D8751] text-white"
                              : "bg-white text-gray-400 hover:bg-gray-100 dark:bg-[#23232B] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                  } else {
                    // Smart pagination with ellipsis
                    // Always show first page
                    pageButtons.push(
                      <button
                        key={1}
                        onClick={() => onPageChange?.(1)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] ${
                          currentPage === 1
                            ? "bg-[#1D8751] text-white"
                            : "bg-white text-gray-400 hover:bg-gray-100 dark:bg-[#23232B] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]"
                        }`}
                      >
                        1
                      </button>
                    );

                    // Calculate range around current page
                    let startPage = Math.max(2, currentPage - sidePages);
                    let endPage = Math.min(totalPages - 1, currentPage + sidePages);

                    // Adjust if we're near the start
                    if (currentPage <= 4) {
                      startPage = 2;
                      endPage = Math.min(6, totalPages - 1);
                    }
                    // Adjust if we're near the end
                    else if (currentPage >= totalPages - 3) {
                      startPage = Math.max(2, totalPages - 5);
                      endPage = totalPages - 1;
                    }

                    // Left ellipsis
                    if (startPage > 2) {
                      pageButtons.push(
                        <span key="ellipsis-left" className="px-2 text-gray-400 dark:text-[#8C8CA1]">
                          ...
                        </span>
                      );
                    }

                    // Pages around current page
                    for (let i = startPage; i <= endPage; i++) {
                      pageButtons.push(
                        <button
                          key={i}
                          onClick={() => {
                            onPageChange?.(i);
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] ${
                            currentPage === i
                              ? "bg-[#1D8751] text-white"
                              : "bg-white text-gray-400 hover:bg-gray-100 dark:bg-[#23232B] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Right ellipsis
                    if (endPage < totalPages - 1) {
                      pageButtons.push(
                        <span key="ellipsis-right" className="px-2 text-gray-400 dark:text-[#8C8CA1]">
                          ...
                        </span>
                      );
                    }

                    // Always show last page
                    if (totalPages > 1) {
                      pageButtons.push(
                        <button
                          key={totalPages}
                          onClick={() => {
                            onPageChange?.(totalPages);
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] ${
                            currentPage === totalPages
                              ? "bg-[#1D8751] text-white"
                              : "bg-white text-gray-400 hover:bg-gray-100 dark:bg-[#23232B] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]"
                          }`}
                        >
                          {totalPages}
                        </button>
                      );
                    }
                  }
                  
                  return pageButtons;
                })()}
                <button
                  onClick={() => {
                    if (onPageChange) {
                      onPageChange(currentPage + 1);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#23232B] text-gray-400 dark:text-[#8C8CA1] ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100 dark:hover:bg-[#35353E]"
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
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 dark:bg-black/60"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            ref={modalContentRef}
            className="bg-white dark:bg-[#23232B] rounded-[24px] p-6 w-full max-w-[500px] mx-4"
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
                      ? "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                      : "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  }
                  alt={selectedTransaction.asset}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="text-gray-900 dark:text-white font-semibold">
                    {selectedTransaction.asset}{" "}
                    <span
                      className={
                        selectedTransaction.type === "buy"
                          ? "text-[#1D8751]"
                          : selectedTransaction.type === "sell"
                            ? "text-[#FF4D4D]"
                            : "text-gray-500 dark:text-[#788099]"
                      }
                    >
                      {selectedTransaction.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-[#788099]">
                    {formatDate(selectedTransaction.date)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Share button */}
                <button 
                  onClick={() => {
                    const shareData = {
                      title: `${selectedTransaction.asset} ${selectedTransaction.type} Transaction`,
                      text: `Transaction ID: ${selectedTransaction.id}\nAmount: ${selectedTransaction.amount} ${selectedTransaction.assetSymbol}\nStatus: ${selectedTransaction.status}`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData).catch(err => {});
                    } else {
                      // Fallback - copy to clipboard
                      navigator.clipboard.writeText(`Transaction ID: ${selectedTransaction.id}\nAmount: ${selectedTransaction.amount} ${selectedTransaction.assetSymbol}\nStatus: ${selectedTransaction.status}`);
                      alert('Transaction details copied to clipboard!');
                    }
                  }}
                  className="text-[#1D8751] hover:text-[#166b3e] transition-colors" 
                  title="Share Transaction"
                >
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
                {/* Download Card as Image button */}
                <button
                  onClick={handleDownloadCard}
                  className="text-[#1D8751] hover:text-[#166b3e] transition-colors"
                  title="Download Receipt as Image"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
            {/* Amount and Fees */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#35353E] pb-4 mb-4">
              <div>
                <div className="text-gray-400 dark:text-[#8C8CA1] text-xs">
                  Total Amount
                </div>
                <div className="text-[#1D8751] text-2xl font-bold">
                  {formatNumber(Number(selectedTransaction?.amount ?? 0))} USD
                </div>
              </div>
              <div className="text-right text-xs text-gray-400 dark:text-[#8C8CA1]">
                <div>
                  Total Fee{" "}
                  <span className="text-gray-900 dark:text-white">$3</span>
                </div>
                <div>
                  Network Fee{" "}
                  <span className="text-gray-900 dark:text-white">$2</span>
                </div>
              </div>
            </div>
            {/* Payment Info */}
            <div className="border-b border-gray-200 dark:border-[#35353E] pb-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Payment:
                </span>
                <span className="text-gray-500 dark:text-[#788099] flex items-center gap-1">
                  Salaam Bank{" "}
                  <img
                    src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                    alt=""
                    className="w-5 h-5"
                  />
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Account Number:
                </span>
                <span className="text-gray-500 dark:text-[#788099]">
                  485634612949050
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Account Name:
                </span>
                <span className="text-gray-500 dark:text-[#788099]">
                  Omar Ali Omar
                </span>
              </div>
            </div>
            {/* Deposit Sent To */}
            <div className="border-b border-gray-200 dark:border-[#35353E] pb-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Deposit Sent to
                </span>
                <span className="text-gray-500 dark:text-[#788099]">
                  3434343233
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Transaction Hash:
                </span>
                <span className="text-[#1D8751] underline cursor-pointer">
                  4673u98948294r89589374933rq
                </span>
              </div>
            </div>
            {/* Status, Receipt, Rating */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Status:
                </span>
                <span className="text-[#1D8751] font-semibold">
                  {selectedTransaction.status || "Completed"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Receipt:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCard}
                    className="text-[#1D8751] hover:text-[#166b3e] transition-colors cursor-pointer"
                    title="Download Receipt as Image"
                  >
                    <Download size={18} />
                  </button>
                  
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-[#8C8CA1]">
                  Service Rating:
                </span>
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
