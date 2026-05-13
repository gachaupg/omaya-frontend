import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { tokens } from "@/styles/tokens";
import { TransactionType } from "@/features/p2p/types";
import Button from "./Button";
import { Download, Search, X, ArrowLeft, Pointer, Eye } from "lucide-react";
import { formatDate, formatNumber } from "@/utils/formatters";
import { TiArrowUnsorted } from "react-icons/ti";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { logger } from '@/lib/utils/logger';

type TableProps = {
  title?: string;
  type?: string;
  data?: TransactionType[];
  allDataForExport?: TransactionType[]; // All data for export (not paginated)
  onFetchAllDataForExport?: () => Promise<TransactionType[]>; // Callback to fetch all data for export
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
  showExportButton?: boolean;
  /** When true, hide the title + ALL + Search + Export row (for parent-provided toolbar) */
  hideToolbar?: boolean;
  /** When true with type "p2p", hide the table toolbar date dropdown (parent already filters by date, e.g. Orders page). */
  hideP2PDateFilter?: boolean;
  /** When hideToolbar is true, use this for export search filter */
  externalSearchQuery?: string;
};

export interface TableExportRef {
  exportCsv: () => Promise<void>;
  exportPdf: () => Promise<void>;
}

export const Table = forwardRef<TableExportRef, TableProps>(({
  title = "P2P History",
  data = [],
  allDataForExport,
  onFetchAllDataForExport,
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
  showExportButton = true,
  hideToolbar = false,
  hideP2PDateFilter = false,
  externalSearchQuery,
}, ref) => {
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
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsSmallScreen(window.innerWidth < 640);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handlePageChangeWithScroll = (page: number) => {
    onPageChange?.(page);
    // Delay scroll so React updates the DOM first before scrolling
    setTimeout(() => {
      tableContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0, 0, 0, 0);

    return data.filter((item) => {
      if (!item.date) return false;

      // Try to parse the date - handle various formats
      let itemDate: Date;
      try {
        itemDate = new Date(item.date);

        // Check if the date is valid
        if (isNaN(itemDate.getTime())) {
          return false;
        }
      } catch (error) {
        return false;
      }

      // Normalize item date to start of day for accurate comparison
      const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      itemDay.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case "Today":
          return itemDay.getTime() === today.getTime();
        case "Week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          weekAgo.setHours(0, 0, 0, 0);
          return itemDay >= weekAgo;
        case "Month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          monthAgo.setHours(0, 0, 0, 0);
          return itemDay >= monthAgo;
        case "Year":
          const yearAgo = new Date(today);
          yearAgo.setFullYear(today.getFullYear() - 1);
          yearAgo.setHours(0, 0, 0, 0);
          return itemDay >= yearAgo;
        default:
          return true;
      }
    });
  };

  // Apply date filter to data
  const filteredData = getFilteredData(data, dateFilter);
  const isAllFilterSelected = dateFilter === "ALL";
  const desktopGridCols = type === "p2p" ? "md:grid-cols-7" : "md:grid-cols-6";

  const formatTypeLabel = (value?: string | React.ReactNode | null): React.ReactNode => {
    if (value === null || value === undefined) return "--";
    if (typeof value === "string") {
      const normalized = value.trim();
      if (type !== "p2p") return normalized;
      return `P2P${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
    }
    if (typeof value === "number") {
      const normalized = value.toString();
      if (type !== "p2p") return normalized;
      return `P2P${normalized}`;
    }
    return value;
  };

  const formatP2PDate = (value?: string | Date | null) => {
    if (!value) return "--";
    const parsedDate = new Date(value);
    if (isNaN(parsedDate.getTime())) return "--";
    const day = parsedDate.getDate().toString().padStart(2, "0");
    const month = parsedDate.toLocaleString("en-US", { month: "short" });
    const year = parsedDate.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleExport = async (format: "csv" | "pdf") => {
    setShowExportOptions(false);

    // Priority order:
    // 1. If parent provides custom export handler, use it (but warn if onFetchAllDataForExport is also provided)
    // 2. Try onFetchAllDataForExport callback (best for fetching all data)
    // 3. Try allDataForExport prop (if parent provides all data)
    // 4. Finally fall back to data prop (current page only)

    if (onExport && !onFetchAllDataForExport) {
      // Use parent's export handler only if no fetch callback is provided
      try {
        await Promise.resolve(onExport(format));
      } catch (error) {
        console.error("Export error:", error);
        alert("Failed to export. Please try again.");
      }
      return;
    }

    // Use default export functionality with all data fetching
    let sourceData: TransactionType[] = [];

    console.log('🔍 Export - Checking data sources:', {
      hasOnFetchAllData: !!onFetchAllDataForExport,
      hasAllDataForExport: !!allDataForExport,
      allDataLength: allDataForExport?.length || 0,
      dataLength: data.length,
      totalPages,
    });

    if (onFetchAllDataForExport) {
      // Prefer fetching all data via callback
      try {
        console.log('📡 Export - Fetching all data via onFetchAllDataForExport callback');
        sourceData = await onFetchAllDataForExport();
        console.log(`✅ Export - Fetched ${sourceData.length} items via callback`);
      } catch (error) {
        console.error("❌ Export - Error fetching all data:", error);
        // Fall back to allDataForExport or data
        sourceData = allDataForExport && allDataForExport.length > 0 ? allDataForExport : data;
        console.warn(`⚠️ Export - Using fallback data: ${sourceData.length} items`);
      }
    } else if (allDataForExport && allDataForExport.length > 0) {
      sourceData = allDataForExport;
      console.log(`✅ Export - Using allDataForExport prop: ${sourceData.length} items`);
    } else {
      sourceData = data;
      console.warn(`⚠️ Export - Using data prop (current page only): ${sourceData.length} items`);
      if (totalPages > 1) {
        console.warn(`⚠️ Export - Warning: Only exporting current page (${data.length} items) out of ${totalPages} pages. Consider providing onFetchAllDataForExport prop.`);
      }
    }

    // Debug: Log data counts
    logger.debug('p2p', `Export - Total data prop items: ${data.length}`);
    logger.debug('p2p', `Export - All data for export items: ${allDataForExport?.length || 0}`);
    logger.debug('p2p', `Export - Using source data items: ${sourceData.length}`);
    logger.debug('p2p', `Export - Total pages: ${totalPages}`);

    // Apply date filter to ALL data (not just current page)
    let dataToExport = getFilteredData(sourceData, dateFilter);
    logger.debug('p2p', `Export - After date filter (${dateFilter}): ${dataToExport.length} items`);

    // Apply search filter if search query exists
    const activeSearchQuery = hideToolbar && externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;
    if (activeSearchQuery && activeSearchQuery.trim()) {
      const searchLower = activeSearchQuery.toLowerCase().trim();
      const beforeSearch = dataToExport.length;
      dataToExport = dataToExport.filter((item) => {
        // Search across multiple fields
        const searchableText = [
          item.id || "",
          item.asset || "",
          item.type || "",
          item.status || "",
          item.amount?.toString() || "",
          item.date?.toString() || "",
        ]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(searchLower);
      });
      logger.debug('p2p', `Export - After search filter ("${activeSearchQuery}"): ${dataToExport.length} items (was ${beforeSearch})`);
    }

    logger.debug('p2p', `Export - Final data to export: ${dataToExport.length} items`);

    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    if (format === "csv") {
      // Export as CSV
      try {
        const exportData = dataToExport.map((item) => ({
          Asset: item.asset || "",
          ...(type === "p2p" && { ID: item.id || "" }),
          Type: item.type || "",
          Amount: item.amount || 0,
          Date: item.date ? formatP2PDate(item.date) : "",
          Status: item.status || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

        const fileName = `${title.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
        XLSX.writeFile(workbook, fileName);
      } catch (error) {
        console.error("CSV export error:", error);
        alert("Failed to export CSV. Please try again.");
      }
    } else if (format === "pdf") {
      // Export as PDF with OMAYA logo, title, and export info
      try {
        const doc = new jsPDF();
        const margin = 14;
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        let currentY = 12;

        // Load and add OMAYA logo at top (centered)
        const logoUrl = "/assets/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png";
        const logoWidth = 48;
        const logoHeight = 18;
        try {
          const imgResponse = await fetch(logoUrl);
          const imgBlob = await imgResponse.blob();
          const imgDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imgBlob);
          });
          const logoX = centerX - logoWidth / 2;
          doc.addImage(imgDataUrl, "PNG", logoX, currentY, logoWidth, logoHeight);
          currentY += logoHeight + 8;
        } catch (logoErr) {
          logger.debug('p2p', "PDF logo load failed, using text:", logoErr);
          doc.setFontSize(18);
          doc.setTextColor(29, 135, 81);
          doc.text("OMAYA", centerX, currentY + 6, { align: "center" });
          currentY += 14;
        }

        // Title (transaction history name, centered)
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(title, centerX, currentY, { align: "center" });
        currentY += 8;

        // Export date and info (centered)
        const exportDate = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Exported on: ${exportDate}`, centerX, currentY, { align: "center" });
        currentY += 6;
        doc.text(`Total records: ${dataToExport.length}`, centerX, currentY, { align: "center" });
        currentY += 12;

        // Prepare table data
        const tableData = dataToExport.map((item) => {
          const row: string[] = [];
          if (type === "p2p") {
            row.push(String(item.asset || ""));
            row.push(String(item.id || "").slice(0, 10) + "...");
            row.push(String(item.type || ""));
            row.push(item.date ? formatP2PDate(item.date) : "");
            row.push(String(item.amount || 0));
            row.push(String(item.status || ""));
          } else {
            row.push(String(item.asset || ""));
            row.push(String(item.type || ""));
            row.push(item.date ? formatP2PDate(item.date) : "");
            row.push(String(item.amount || 0));
            row.push(String(item.status || ""));
          }
          return row;
        });

        // Define headers based on type
        const headers = type === "p2p"
          ? [["Asset", "ID", "Type", "Date", "Amount", "Status"]]
          : [["Asset", "Type", "Date", "Amount", "Status"]];

        autoTable(doc, {
          head: headers,
          body: tableData,
          startY: currentY,
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [29, 135, 81], // #1D8751
            textColor: 255,
          },
        });

        const dateStr = new Date().toISOString().split("T")[0];
        const safeTitle = title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
        const fileName = `OMAYA_${safeTitle}_Export_${dateStr}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error("PDF export error:", error);
        alert("Failed to export PDF. Please try again.");
      }
    }
  };

  const getAmountColor = (type: string | undefined | null) => {
    if (!type)
      return `text-gray-500 dark:text-[#788099]`;
    if (type.toLowerCase() === "buy") return "text-[#1D8751]";
    if (type.toLowerCase() === "sell") return "text-[#FF4D4D]";
    return `text-gray-500 dark:text-[#788099]`;
  };

  const getAssetLabel = (asset?: string | null) => {
    if (!asset) return "";
    return /tron/i.test(asset) ? "" : asset;
  };

  const getP2PTradeDirection = (row: TransactionType): { from: string; to: string } => {
    const t = String(row?.type ?? "").trim().toLowerCase();
    // UI requirement: show Fiat side as "Fiat (P2P)" (not "USD").
    const fiatLabel = "Fiat (P2P)";
    if (t === "sell") return { from: "USDT", to: fiatLabel };
    if (t === "buy") return { from: fiatLabel, to: "USDT" };
    // Fallback: assume USDT is the base asset.
    return { from: "USDT", to: fiatLabel };
  };

  const getAssetIconSrc = (ticker: string) => {
    const t = String(ticker || "").trim().toUpperCase();
    if (t === "USDT") return "/images/tether.svg";
    // Fiat (P2P) icon (generic USD icon for now)
    if (t === "FIAT(P2P)" || t === "FIAT" || t === "USD" || t.includes("FIAT")) return "/images/usd.svg";
    // No dedicated icon yet (e.g., KES); use a safe fallback.
    return "/default-provider-logo.svg";
  };

  const AssetDirectionCell = ({ row }: { row: TransactionType }) => {
    // Requirement: In P2P Buy/Sell history, show only the USDT asset logo in "Asset" column.
    return (
      <div className="flex items-center gap-2">
        <img
          src="/images/tether.svg"
          alt="USDT"
          className="w-6 h-6 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/default-provider-logo.svg";
          }}
        />
      </div>
    );
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
    if (!modalContentRef.current) {
      console.error('Modal content ref is null');
      return;
    }

    try {
      const canvas = await html2canvas(modalContentRef.current, {
        useCORS: true,
        onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
          clonedElement.style.borderRadius = "0px";
          clonedElement.style.maxHeight = "none";
          clonedElement.style.overflow = "visible";
          // Add a tiny bit of padding to avoid clipping top text if font rendering shifts
          clonedElement.style.paddingTop = "10px";
        },
      } as Parameters<typeof html2canvas>[1]);

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `OMAYA_Receipt_${selectedTransaction?.id?.substring(0, 8) || 'transaction'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download card:', error);
      // Fallback: try to print the content
      try {
        window.print();
      } catch (printError) {
        console.error('Print fallback also failed:', printError);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    exportCsv: () => handleExport("csv"),
    exportPdf: () => handleExport("pdf"),
  }));

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
        <div className="flex flex-col items-center justify-center border border-gray-200 dark:border-[#35353E] rounded-[24px] p-8 bg-white dark:bg-[var(--card-color)]">
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
      <div className="w-full text-center py-2">
        <div className="flex flex-col items-center justify-center border border-gray-200 dark:border-[#35353E] rounded-xl sm:rounded-2xl md:rounded-[24px] p-4 sm:p-6 md:p-8 bg-white dark:bg-[var(--card-color)]">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3 sm:mb-4 rounded-full bg-gray-100 dark:bg-[#35353E] flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-500 dark:text-[#788099] sm:w-5 sm:h-5 md:w-6 md:h-6"
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
          <h3 className="text-base sm:text-lg font-semibold text-gray-500 dark:text-[#788099] mb-1 sm:mb-2">
            No Data Available
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-[#8C8CA1] text-center max-w-md px-2 sm:px-0">
            There are currently no records to display. Please check back later
            or try adjusting your filters.
          </p>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="mt-1">
        {!hideToolbar && (
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between mb-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <h3
              className={`text-sm sm:text-base md:text-lg font-medium text-gray-900 dark:text-white`}
            >
              {title}
            </h3>

            {type === "p2p" && !hideP2PDateFilter && (
              <div className="relative w-full sm:w-auto sm:min-w-[80px]" ref={dateDropdownRef}>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <button
                      type="button"
                      onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                      disabled={loading}
                      className={`w-full sm:w-auto px-3 py-2 rounded-lg sm:rounded-[22px] text-xs sm:text-sm font-semibold flex items-center gap-1 border border-gray-200 dark:border-[#35353E] outline-none focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50 bg-gray-100 dark:bg-[#18181D] ${isAllFilterSelected
                        ? "text-gray-500 dark:text-[#7F889F]"
                        : "text-gray-900 dark:text-white"
                        } hover:border-[#1D8751] hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors`}
                    >
                      <span className="whitespace-nowrap">{dateFilter}</span>
                      <svg
                        className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isDateDropdownOpen ? "rotate-180" : ""}`}
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
                  </div>
                  {dateFilter !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDateFilterChange("ALL");
                        setIsDateDropdownOpen(false);
                      }}
                      className="p-1.5 sm:p-2 rounded-full text-sm text-gray-500 dark:text-[#8C8CA1] hover:text-[#1D8751] dark:hover:text-[#1D8751] hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors flex-shrink-0"
                      title="Clear date filter"
                    >
                      <X size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
                {isDateDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-auto sm:min-w-[140px] rounded-lg sm:rounded-2xl bg-white dark:bg-[#18181D] text-gray-900 dark:text-white shadow-2xl z-20 py-1 border border-gray-200 dark:border-[#35353E]">
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
                          className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors ${isSelected
                            ? "bg-gray-200 text-gray-900 dark:bg-[#23232B] dark:text-white"
                            : "text-gray-700 dark:text-[#C7CAD1]"
                            }`}
                        >
                          <span className="text-xs font-medium">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {type === "p2p" && (
              <div className="relative w-full sm:w-56 md:w-60 lg:w-64">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className={`py-2 pl-9 pr-10 rounded-xl sm:rounded-2xl md:rounded-[24px] text-xs sm:text-sm w-full border focus:outline-none bg-gray-100 dark:bg-[#35353E] text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-200 dark:border-[#35353E]`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search
                    size={14}
                    className="text-[#1D8751] sm:w-4 sm:h-4"
                  />
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#1D8751] sm:w-4 sm:h-4"
                  >
                    <rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="2" y="7.25" width="9" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="2" y="11.5" width="6" height="1.5" rx="0.75" fill="currentColor" />
                  </svg>
                </div>
              </div>
            )}

            {showExportButton && type !== "orders" && (
              <div className="relative flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="text-xs sm:text-sm font-semibold whitespace-nowrap px-2 sm:px-3"
                >
                  <p className="text-xs sm:text-sm text-[#1D8751] whitespace-nowrap flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="hidden xl:inline">Export Transactions</span>
                    <span className="xl:hidden">Export</span>
                  </p>
                </Button>

                {showExportOptions && (
                  <div className="absolute right-0 sm:right-auto left-0 sm:left-auto mt-2 w-full sm:w-48 rounded-md shadow-lg bg-white dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport("csv")}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-[#8C8CA1] hover:bg-gray-100 dark:hover:bg-[#35353E]"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-[#8C8CA1] hover:bg-gray-100 dark:hover:bg-[#35353E]"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        <div ref={tableContainerRef} className={`w-full pb-4 scroll-smooth ${hideToolbar ? "" : "mt-3"}`}>
          <div className="overflow-x-auto md:overflow-visible">
            <div
              className={`w-full md:min-w-0 border-2 bg-white dark:bg-[var(--card-color)] border-gray-200 dark:border-[#35353E] shadow-lg rounded-[24px] overflow-hidden`}
            >
              {/* Desktop Table Header - Hidden on mobile */}
              <div
                className={`hidden md:grid grid-cols-6 ${desktopGridCols} py-2 px-4 border-b bg-gray-50 dark:bg-[#35353E] border-gray-200 dark:border-[#35353E] rounded-t-[24px]`}
              >
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-white`}
                >
                  Asset
                </div>
                {type === "p2p" && (
                  <div
                    className={`text-sm font-medium text-gray-900 dark:text-white flex items-center justify-start -ml-4 pl-0`}
                  >
                    <span>ID</span>
                    <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                  </div>
                )}
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-white flex items-center`}
                >
                  Type
                  <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                </div>
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-white flex items-center`}
                >
                  Date
                  <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                </div>
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-white flex items-center`}
                >
                  Amount
                  <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                </div>
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-white flex items-center`}
                >
                  Status
                  <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                </div>
                <div
                  className={`text-sm font-medium text-gray-900 dark:text-white flex items-center`}
                >
                  Receipt
                  <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />
                </div>
              </div>

              {/* Table Body */}
              <div className={`bg-white dark:bg-[var(--card-color)] ${totalPages <= 1 ? 'rounded-b-[24px]' : ''}`}>
                {filteredData.length === 0 && data.length > 0 ? (
                  <div className="w-full text-center py-12 px-4 bg-white dark:bg-[var(--card-color)]">
                    <div className="flex flex-col items-center justify-center">
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
                      <p className="text-sm text-gray-400 dark:text-[#8C8CA1] text-center max-w-md mb-4">
                        No records found for the selected date filter ({dateFilter}). Please try a different time period or reset to view all records.
                      </p>
                      <button
                        onClick={() => handleDateFilterChange("ALL")}
                        className="inline-flex items-center px-4 py-2 border dark:border-[#35353E] border-gray-300 rounded-md shadow-sm text-sm font-medium dark:text-white text-gray-900 dark:bg-[var(--bg-color)] bg-gray-100 dark:hover:bg-[#35353E] hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D8751] transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Reset to All Records
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredData.map((row, idx) => {
                    const isLastRow = idx === filteredData.length - 1;
                    return (
                      <React.Fragment key={idx}>
                        {/* Desktop Grid View */}
                        <div
                          className={`hidden md:grid ${desktopGridCols} mx-2 py-2 px-2 items-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 bg-white dark:bg-[var(--card-color)] relative`}
                        >
                          <AssetDirectionCell row={row} />
                          {type === "p2p" && (
                            <div
                              className={`text-sm text-left text-gray-600 dark:text-[#788099] cursor-pointer relative -ml-4 pl-0`}
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
                              {row.id ? `${row.id.slice(0, 3)}...${row.id.slice(-3)}` : "--"}
                              {tooltipId === row.id && row.id && (
                                <div className="absolute z-50 px-3 py-2 text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 rounded-lg shadow-xl whitespace-nowrap -top-10 left-1/2 transform -translate-x-1/2 border border-gray-300 dark:border-gray-700">
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
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-100 dark:border-t-gray-900"></div>
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
                          <div className={`text-sm ${getAmountColor(String(row.type))}`}>
                            {formatTypeLabel(row.type)}
                          </div>
                          <div
                            className={`text-sm text-gray-600 dark:text-[#788099]`}
                          >
                            {formatP2PDate(row.date)}
                          </div>
                          <div className={`text-sm font-semibold ${getAmountColor(String(row.type))}`}>
                            {formatNumber(Number(row.amount)).toString()} USDT
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
                          {!isLastRow && (
                            <div
                              className={`absolute bottom-0 left-4 right-4 h-px bg-gray-200 dark:bg-gray-800`}
                            />
                          )}
                        </div>

                        {/* Mobile Card View */}
                        <div
                          className={`md:hidden flex flex-col gap-2 p-3 mx-2 relative hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 bg-white dark:bg-[var(--card-color)]`}
                        >
                          {/* Top Row: Asset and Type */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <AssetDirectionCell row={row} />
                            </div>
                            <div
                              className={`text-sm font-semibold flex-shrink-0 ${getAmountColor(String(row.type))}`}
                            >
                              {formatTypeLabel(row.type)}
                            </div>
                          </div>

                          {/* Amount Row */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-[#788099]">Amount</span>
                            <span
                              className={`text-sm font-semibold ${getAmountColor(String(row.type))}`}
                            >
                              {formatNumber(Number(row.amount)).toString()} USDT
                            </span>
                          </div>

                          {/* Date and Status Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-[#788099]">Date</span>
                              <span className={`text-sm text-gray-600 dark:text-[#788099]`}>
                                {formatP2PDate(row.date)}
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
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
                              <span className="text-xs text-gray-500 dark:text-[#788099]">ID</span>
                              <div
                                className={`text-xs text-gray-600 dark:text-[#788099] cursor-pointer relative`}
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
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
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
                          {!isLastRow && (
                            <div
                              className={`absolute bottom-0 left-4 right-4 h-px bg-gray-200 dark:bg-gray-800`}
                            />
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 sm:gap-2 py-4 pb-6 bg-white dark:bg-[var(--card-color)] rounded-b-[24px] overflow-x-auto px-2">
                  <button
                    onClick={() => {
                      logger.debug('p2p', "Previous page clicked, current:", currentPage);
                      if (onPageChange) {
                        handlePageChangeWithScroll(currentPage - 1);
                      } else {
                        logger.debug('p2p', "onPageChange is not provided");
                      }
                    }}
                    disabled={currentPage === 1}
                    className={`min-w-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium border flex items-center justify-center ${currentPage === 1
                        ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-400 dark:text-[#8C8CA1]"
                        : "border-[#1D8751] bg-white dark:bg-[var(--card-color)] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition-colors"
                      }`}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  {(() => {
                    const pageButtons = [];
                    // On small screens show fewer pages so prev/next buttons are always visible
                    const maxPagesToShow = isSmallScreen ? 3 : 7;
                    const sidePages = isSmallScreen ? 0 : 2;

                    const btnClass = (active: boolean) =>
                      `min-w-[28px] px-1.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium border border-gray-200 dark:border-[#35353E] text-center ${active
                        ? "bg-[#1D8751] text-white border-[#1D8751]"
                        : "bg-white text-gray-400 hover:bg-gray-100 dark:bg-[var(--card-color)] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]"
                      }`;

                    if (totalPages <= maxPagesToShow) {
                      // Show all pages if total fits
                      for (let i = 1; i <= totalPages; i++) {
                        pageButtons.push(
                          <button
                            key={i}
                            onClick={() => handlePageChangeWithScroll(i)}
                            className={btnClass(currentPage === i)}
                          >
                            {i}
                          </button>
                        );
                      }
                    } else {
                      // Smart pagination: first page
                      pageButtons.push(
                        <button key={1} onClick={() => handlePageChangeWithScroll(1)} className={btnClass(currentPage === 1)}>1</button>
                      );

                      // Calculate range around current page
                      let startPage = Math.max(2, currentPage - sidePages);
                      let endPage = Math.min(totalPages - 1, currentPage + sidePages);

                      // Clamp near start
                      if (!isSmallScreen && currentPage <= 4) {
                        startPage = 2;
                        endPage = Math.min(6, totalPages - 1);
                      } else if (!isSmallScreen && currentPage >= totalPages - 3) {
                        startPage = Math.max(2, totalPages - 5);
                        endPage = totalPages - 1;
                      }

                      // On small screens only show current page in the middle (between first and last)
                      if (isSmallScreen) {
                        startPage = currentPage === 1 ? totalPages : currentPage;
                        endPage = currentPage === totalPages ? 1 : currentPage;
                        // Just show current if it's not 1 or last
                        startPage = currentPage;
                        endPage = currentPage;
                      }

                      // Left ellipsis
                      if (startPage > 2) {
                        pageButtons.push(
                          <span key="el" className="px-0.5 text-xs text-gray-400 dark:text-[#8C8CA1]">…</span>
                        );
                      }

                      // Middle pages
                      for (let i = startPage; i <= endPage; i++) {
                        if (i > 1 && i < totalPages) {
                          pageButtons.push(
                            <button key={i} onClick={() => handlePageChangeWithScroll(i)} className={btnClass(currentPage === i)}>{i}</button>
                          );
                        }
                      }

                      // Right ellipsis
                      if (endPage < totalPages - 1) {
                        pageButtons.push(
                          <span key="er" className="px-0.5 text-xs text-gray-400 dark:text-[#8C8CA1]">…</span>
                        );
                      }

                      // Last page
                      pageButtons.push(
                        <button key={totalPages} onClick={() => handlePageChangeWithScroll(totalPages)} className={btnClass(currentPage === totalPages)}>{totalPages}</button>
                      );
                    }

                    return pageButtons;
                  })()}
                  <button
                    onClick={() => {
                      logger.debug('p2p', "Next page clicked, current:", currentPage);
                      if (onPageChange) {
                        handlePageChangeWithScroll(currentPage + 1);
                      } else {
                        logger.debug('p2p', "onPageChange is not provided");
                      }
                    }}
                    disabled={currentPage === totalPages}
                    className={`min-w-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium border flex items-center justify-center ${currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-400 dark:text-[#8C8CA1]"
                        : "border-[#1D8751] bg-white dark:bg-[var(--card-color)] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition-colors"
                      }`}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
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
            className="bg-white dark:bg-[var(--card-color)] rounded-[24px] p-4 sm:p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button at top-left */}
            <button
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-3 right-3 text-[#6b7280] hover:text-[#111827] dark:hover:text-white transition-colors p-1 rounded-full hover:bg-[#f3f4f6] dark:hover:bg-[#1f2937]"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Omaya.io Logo at the top */}
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <img
                src="/assets/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png"
                alt="OMAYA"
                className="h-6 sm:h-8 w-auto object-contain"
              />
              <span className="text-[#6b7280] dark:text-[#9ca3af] text-xl sm:text-2xl font-medium ml-0.5"></span>
            </div>
            {/* Header: Coin, Type, Date, Share/Note */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src={
                    selectedTransaction.asset === "Tron"
                      ? "/images/tether.svg"
                      : "/images/tether.svg"
                  }
                  alt={selectedTransaction.asset}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[#111827] dark:text-white font-semibold text-sm sm:text-base">
                    <span className="truncate">{selectedTransaction.asset}</span>{" "}
                    <span
                      className={
                        selectedTransaction.type === "buy"
                          ? "text-[#1D8751]"
                          : selectedTransaction.type === "sell"
                            ? "text-[#FF4D4D]"
                            : "text-[#6b7280] dark:text-[#788099]"
                      }
                    >
                      {selectedTransaction.type}
                    </span>
                  </div>
                  <div className="text-xs text-[#6b7280] dark:text-[#788099]">
                    {formatDate(selectedTransaction.date)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end sm:justify-start">
                {/* Share button */}
                <button
                  onClick={async () => {
                    const shareText = `Transaction ID: ${selectedTransaction.id}\nAmount: ${selectedTransaction.amount} ${selectedTransaction.assetSymbol}\nStatus: ${selectedTransaction.status}`;

                    try {
                      if (navigator.share && window.isSecureContext) {
                        await navigator.share({
                          title: `${selectedTransaction.asset} ${selectedTransaction.type} Transaction`,
                          text: shareText,
                        });
                      } else {
                        await navigator.clipboard.writeText(shareText);
                        // Show a brief tooltip feedback
                        const btn = document.activeElement as HTMLButtonElement;
                        const originalTitle = btn?.title;
                        if (btn) { btn.title = 'Copied!'; setTimeout(() => { btn.title = originalTitle || 'Share Transaction'; }, 2000); }
                      }
                    } catch (err: any) {
                      if (err?.name !== 'AbortError') {
                        try {
                          await navigator.clipboard.writeText(shareText);
                        } catch {
                          logger.debug('p2p', 'Share and clipboard both failed:', err);
                        }
                      }
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 border-b border-[#e5e7eb] dark:border-[#35353E] pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div>
                <div className="text-[#9ca3af] dark:text-[#8C8CA1] text-xs">
                  Total Amount
                </div>
                <div className="text-[#1D8751] text-xl sm:text-2xl font-bold">
                  {formatNumber(Number(selectedTransaction?.amount ?? 0))} USDT
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-[#9ca3af] dark:text-[#8C8CA1]">
                <div>
                  Total Fee{" "}
                  <span className="text-[#111827] dark:text-white">$3</span>
                </div>
                <div>
                  Network Fee{" "}
                  <span className="text-[#111827] dark:text-white">$2</span>
                </div>
              </div>
            </div>
            {/* Payment Info */}
            <div className="border-b border-[#e5e7eb] dark:border-[#35353E] pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
                  Payment:
                </span>
                <span className="text-[#6b7280] dark:text-[#788099] flex items-center gap-1 text-xs sm:text-sm">
                  <span className="truncate">Salaam Bank</span>{" "}
                  <img
                    src="/assets/image_7_jijlik.png"
                    alt=""
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  />
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
                  Account Number:
                </span>
                <span className="text-[#6b7280] dark:text-[#788099] text-xs sm:text-sm break-all sm:break-normal">
                  485634612949050
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
                  Account Name:
                </span>
                <span className="text-[#6b7280] dark:text-[#788099] text-xs sm:text-sm break-words">
                  Omar Ali Omar
                </span>
              </div>
            </div>
            {/* Deposit Sent To */}
            <div className="border-b border-[#e5e7eb] dark:border-[#35353E] pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
                  Deposit Sent to
                </span>
                <span className="text-[#6b7280] dark:text-[#788099] text-xs sm:text-sm break-all">
                  3434343233
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
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
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
                  Status:
                </span>
                <span className="text-[#1D8751] font-semibold text-xs sm:text-sm">
                  {selectedTransaction.status || "Completed"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
                  Receipt:
                </span>
                <span className="text-[#1D8751] text-xs sm:text-sm">
                  Available above ↑
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-[#9ca3af] dark:text-[#8C8CA1]">
                  Service Rating:
                </span>
                <span className="flex flex-row">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="text-[#9ca3af] dark:text-[#8C8CA1] w-4 h-4 sm:w-5 sm:h-5"
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
});

Table.displayName = "Table";

