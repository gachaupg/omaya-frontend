import React, { useState, useRef } from "react";
import { tokens } from "@/styles/tokens";
import { TransactionType } from "@/features/p2p/types";
import Button from "./Button";
import { MoreHorizontal, Download, Search, X, ArrowLeft, Pointer, Eye } from "lucide-react";
import { formatDate, formatNumber } from "@/utils/formatters";
import { TiArrowUnsorted } from "react-icons/ti";
import html2canvas from "html2canvas";

import { logger } from '@/lib/utils/logger';

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
  onDateFilterChange?: (filter: string) => void;
  dateFilter?: string;
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
  onDateFilterChange,
  dateFilter: externalDateFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionType | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [internalDateFilter, setInternalDateFilter] = useState("ALL");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const dateFilterOptions = ["ALL", "Today", "Week", "Month", "Year"];
  
  // Use external date filter if provided, otherwise use internal state
  const dateFilter = externalDateFilter !== undefined ? externalDateFilter : internalDateFilter;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleDateFilterChange = (filter: string) => {
    if (onDateFilterChange) {
      onDateFilterChange(filter);
    } else {
      setInternalDateFilter(filter);
    }
  };

  // Filter data based on date filter
  const getFilteredData = (data: TransactionType[], dateFilter: string) => {
    if (dateFilter === "ALL") return data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime())) return false;

      switch (dateFilter) {
        case "Today":
          const itemDay = new Date(itemDate);
          itemDay.setHours(0, 0, 0, 0);
          return itemDay.getTime() === today.getTime();
        case "Week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return itemDate >= weekAgo;
        case "Month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return itemDate >= monthAgo;
        case "Year":
          const yearAgo = new Date(today);
          yearAgo.setFullYear(today.getFullYear() - 1);
          return itemDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  // Apply date filter to data
  const filteredData = getFilteredData(data, dateFilter);

  const handleExport = (format: "csv" | "pdf") => {
    if (onExport) {
      onExport(format);
    }
    setShowExportOptions(false);
  };

  const getAmountColor = (type: string | undefined | null) => {
    if (!type)
      return `text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`;
    if (type.toLowerCase() === "buy") return "text-[#1D8751]";
    if (type.toLowerCase() === "sell") return "text-[#FF4D4D]";
    return `text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`;
  };

  const getStatusColor = (status: string | undefined | null) => {
    return "text-gray-500 dark:text-[#788099]";
  };

  const handleViewTransaction = (row: TransactionType) => {
    logger.debug('p2p', "Setting selected transaction:", row);
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
      console.error('Failed to download card:', error);
    }
  };

  // Add effect to monitor selectedTransaction changes
  React.useEffect(() => {
    logger.debug('p2p', "Selected transaction updated:", selectedTransaction);
  }, [selectedTransaction]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDateDropdownOpen &&
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDateDropdownOpen(false);
      }
    };

    if (isDateDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDateDropdownOpen]);

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

  if (filteredData.length === 0 && data.length > 0) {
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
            No Data Matches Filter
          </h3>
          <p className="text-sm text-gray-400 dark:text-[#8C8CA1] text-center max-w-md">
            No records found for the selected date filter. Please try a different time period.
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
              {/* Date Filter */}
              <div className="relative min-w-[150px]" ref={dateDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 rounded text-sm font-semibold dark:bg-[#18181D] bg-white border dark:border-[#35353E] border-gray-300 dark:text-white text-[#0D0D0D] flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
                >
                  <span className="truncate">{dateFilter}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDateDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <span
                  className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${
                    dateFilter ? "text-[#1D8751]" : "text-gray-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {isDateDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-[#1D8751] bg-[#0F0F13] dark:bg-[#0F0F13] text-white shadow-lg z-20">
                    {dateFilterOptions.map((option) => {
                      const isSelected = dateFilter === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            handleDateFilterChange(option);
                            setIsDateDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#1b1b22] ${
                            isSelected ? "text-white" : "text-[#C7CAD1]"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? "border-[#1D8751] bg-[#1D8751]" : "border-[#1D8751]"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className="text-sm font-semibold">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className={`py-2 pl-9 pr-10 rounded-[24px] text-sm w-full border focus:outline-none bg-gray-100 dark:bg-[#35353E] text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-200 dark:border-[${tokens.colors.dark.border}]`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search
                    size={16}
                    className="text-[#1D8751]"
                  />
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#1D8751]"
                  >
                    <rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="2" y="7.25" width="9" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="2" y="11.5" width="6" height="1.5" rx="0.75" fill="currentColor" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="text-base font-semibold"
                >
                  <p className="text-[14px] text-[#1D8751]">Export Transactions</p>
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
            {/* Desktop Table Header - Hidden on mobile */}
            <div
              className={`hidden md:grid grid-cols-6 ${type === "p2p" ? "md:grid-cols-7" : ""} py-3 px-4 border-b bg-gray-50 dark:bg-[#35353E] border-gray-200 dark:border-[${tokens.colors.dark.border}] rounded-t-[24px]`}
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
              {filteredData.map((row, idx) => (
                <React.Fragment key={idx}>
                  {/* Desktop Grid View */}
                <div
                    className={`hidden md:grid w-full grid-cols-6 ${type === "p2p" ? "md:grid-cols-7" : ""} py-4 px-4 border-b last:border-b-0 items-center hover:bg-gray-50 dark:hover:bg-[#2A2A35] transition-colors duration-200 border-gray-200 dark:border-[${tokens.colors.dark.border}] bg-white dark:bg-[${tokens.colors.dark.background}]`}
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
                    className={`text-sm text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`}
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
                      <Eye size={18} />
                    </Button>
                  </div>
                </div>

                  {/* Mobile Card View */}
                  <div
                    className={`md:hidden flex flex-col gap-3 p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#2A2A35] transition-colors duration-200 border-gray-200 dark:border-[${tokens.colors.dark.border}] bg-white dark:bg-[${tokens.colors.dark.background}]`}
                  >
                    {/* Top Row: Asset and Type */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                          alt={row.asset}
                          className="w-6 h-6"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {row.asset}
                        </span>
                      </div>
                      <div
                        className={`text-sm font-semibold ${getAmountColor(String(row.type))}`}
                      >
                        {row.type}
                      </div>
                    </div>

                    {/* Amount Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-[#788099]">Amount</span>
                      <div
                        className={`text-sm font-semibold ${getAmountColor(String(row.type))}`}
                      >
                        {formatNumber(Number(row.amount)).toString()}
                      </div>
                    </div>

                    {/* Date and Status Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-[#788099]">Date</span>
                        <span className={`text-sm text-gray-500 dark:text-[${tokens.colors.dark.textBody}]`}>
                          {formatDate(row.date)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 dark:text-[#788099]">Status</span>
                        <span className={`text-sm ${getStatusColor(String(row.status))}`}>
                          {row.status}
                        </span>
                      </div>
                    </div>

                    {/* ID Row (only for p2p type) */}
                    {type === "p2p" && row.id && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[#35353E]">
                        <span className="text-xs text-gray-500 dark:text-[#788099]">ID</span>
                        <div
                          className={`text-xs text-gray-500 dark:text-[${tokens.colors.dark.textBody}] cursor-pointer relative`}
                          onClick={() => {
                            if (row.id) {
                              navigator.clipboard.writeText(row.id);
                              setCopiedId(row.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }
                          }}
                        >
                          {row.id.slice(0, 8)}...{row.id.slice(-6)}
                          {copiedId === row.id && (
                            <div className="absolute z-50 px-2 py-1 text-xs text-white bg-green-600 rounded shadow-lg whitespace-nowrap -top-8 right-0">
                              Copied!
                              <div className="absolute top-full right-4 transform w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2 border-t border-gray-200 dark:border-[#35353E]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[#1D8751] justify-center"
                        onClick={() => handleViewTransaction(row)}
                      >
                        <Eye size={18} className="mr-2" />
                        View Receipt
                      </Button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 bg-transparent rounded-b-[24px]">
                <button
                  onClick={() => {
                    logger.debug('p2p', "Previous page clicked, current:", currentPage);
                    if (onPageChange) {
                      logger.debug('p2p', 
                        "Calling onPageChange with:",
                        currentPage - 1
                      );
                      onPageChange(currentPage - 1);
                    } else {
                      logger.debug('p2p', "onPageChange is not provided");
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
                            logger.debug('p2p', "Page clicked:", i);
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
                            logger.debug('p2p', "Page clicked:", i);
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
                            logger.debug('p2p', "Last page clicked:", totalPages);
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
                    logger.debug('p2p', "Next page clicked, current:", currentPage);
                    if (onPageChange) {
                      logger.debug('p2p', 
                        "Calling onPageChange with:",
                        currentPage + 1
                      );
                      onPageChange(currentPage + 1);
                    } else {
                      logger.debug('p2p', "onPageChange is not provided");
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
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 dark:bg-black/60 p-3 sm:p-4"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            ref={modalContentRef}
            className="bg-white dark:bg-[#23232B] rounded-[24px] p-4 sm:p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image at the top */}
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1749881460/Group_3_uwzqa8.png"
              alt="Transaction"
              className="block mx-auto mb-3 sm:mb-4 max-w-[100px] sm:max-w-[120px] w-full h-auto"
            />
            {/* Header: Coin, Type, Date, Share/Note */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src={
                    selectedTransaction.asset === "Tron"
                      ? "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                      : "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  }
                  alt={selectedTransaction.asset}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">
                    <span className="truncate">{selectedTransaction.asset}</span>{" "}
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
              <div className="flex gap-2 justify-end sm:justify-start">
                {/* Share button */}
                <button 
                  onClick={() => {
                    const shareData = {
                      title: `${selectedTransaction.asset} ${selectedTransaction.type} Transaction`,
                      text: `Transaction ID: ${selectedTransaction.id}\nAmount: ${selectedTransaction.amount} ${selectedTransaction.assetSymbol}\nStatus: ${selectedTransaction.status}`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData).catch(err => logger.debug('p2p', 'Share failed:', err));
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 border-b border-gray-200 dark:border-[#35353E] pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div>
                <div className="text-gray-400 dark:text-[#8C8CA1] text-xs">
                  Total Amount
                </div>
                <div className="text-[#1D8751] text-xl sm:text-2xl font-bold">
                  {formatNumber(Number(selectedTransaction?.amount ?? 0))} USD
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-gray-400 dark:text-[#8C8CA1]">
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
            <div className="border-b border-gray-200 dark:border-[#35353E] pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Payment:
                </span>
                <span className="text-gray-500 dark:text-[#788099] flex items-center gap-1 text-xs sm:text-sm">
                  <span className="truncate">Salaam Bank</span>{" "}
                  <img
                    src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                    alt=""
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  />
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Account Number:
                </span>
                <span className="text-gray-500 dark:text-[#788099] text-xs sm:text-sm break-all sm:break-normal">
                  485634612949050
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Account Name:
                </span>
                <span className="text-gray-500 dark:text-[#788099] text-xs sm:text-sm break-words">
                  Omar Ali Omar
                </span>
              </div>
            </div>
            {/* Deposit Sent To */}
            <div className="border-b border-gray-200 dark:border-[#35353E] pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Deposit Sent to
                </span>
                <span className="text-gray-500 dark:text-[#788099] text-xs sm:text-sm break-all">
                  3434343233
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Transaction Hash:
                </span>
                <span className="text-[#1D8751] underline cursor-pointer text-xs sm:text-sm break-all text-left sm:text-right">
                  4673u98948294r89589374933rq
                </span>
              </div>
            </div>
            {/* Status, Receipt, Rating */}
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Status:
                </span>
                <span className="text-[#1D8751] font-semibold text-xs sm:text-sm">
                  {selectedTransaction.status || "Completed"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Receipt:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCard}
                    className="text-[#1D8751] hover:text-[#166b3e] transition-colors cursor-pointer"
                    title="Download Receipt as Image"
                  >
                    <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1]">
                  Service Rating:
                </span>
                <span className="flex flex-row">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="text-[#FFB800] w-4 h-4 sm:w-5 sm:h-5"
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

