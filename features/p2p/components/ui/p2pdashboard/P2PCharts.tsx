import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import Charts from "../../Common/charts";
import { Table } from "../../Common/Table";
import { RootState } from "@/store/rootReducer";
import { TransactionType, UserTrade } from "@/features/p2p/types";
import { fetchAllUserTradesPages } from "@/features/p2p/utils/fetchAllUserTradesPages";
import type { P2PChartTimeFilter } from "@/features/p2p/utils/p2pTradeChartAggregation";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";
import P2PWithdrawalDepositTransactions from "@/components/dashboard/sections/P2PWithdrawalDepositTransactions";
import type { TableExportRef } from "../../Common/Table";

type TimeFilter = P2PChartTimeFilter;

type P2PChartsProps = {
  chartTrades?: UserTrade[];
  tradesLoading?: boolean;
  chartTimeFilter?: TimeFilter;
  onChartTimeFilterChange?: (filter: TimeFilter) => void;
};

const PAGE_SIZE = 10;

const transformUserTradeToTransaction = (
  trade: UserTrade,
  currentUserEmail?: string
): TransactionType => {
  // If logged-in user is owner: display order_type as-is. If NOT owner: swap (buy → sell, sell → buy).
  const rawOrderType = trade.order_type?.toLowerCase() || "sell";
  const ownerEmail = (trade.owner || "").trim().toLowerCase();
  const userEmail = (currentUserEmail || "").trim().toLowerCase();
  const isOwner = userEmail && ownerEmail && userEmail === ownerEmail;
  const displayType = isOwner
    ? rawOrderType
    : rawOrderType === "buy"
      ? "sell"
      : "buy";

  return {
  id: trade.id,
  type: displayType,
  date: trade.timestamp,
  amount: String(parseFloat(trade.amount || "0").toFixed(2)),
  status: trade.status?.toLowerCase() || "",
  asset: String(parseFloat(trade.amount || "0").toFixed(2)),
  assetSymbol: trade.currency || "USDT",
  rate: String(parseFloat(String(trade.rate || 0)).toFixed(2)),
  payment: trade.payment_details?.[0]
    ? { bank: trade.payment_details[0].provider, logo: "" }
    : undefined,
  username: trade.advertiser_name,
  limit: trade.limit,
  price: trade.price,
  commission: String(trade.commission_amount ?? 0),
  lastUpdate: trade.timestamp,
  rawData: trade,
};
};

const P2PCharts = ({
  chartTrades: chartTradesProp,
  tradesLoading: tradesLoadingProp,
  chartTimeFilter: chartTimeFilterProp,
  onChartTimeFilterChange,
}: P2PChartsProps = {}) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [allTradesLocal, setAllTradesLocal] = useState<UserTrade[]>([]);
  const allTrades = chartTradesProp ?? allTradesLocal;
  const [tradesLoading, setTradesLoading] = useState(false);
  const isTradesLoading = tradesLoadingProp ?? tradesLoading;
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const tradesFetchStartedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilterLocal, setTimeFilterLocal] = useState<TimeFilter>("All Time");
  const timeFilter = chartTimeFilterProp ?? timeFilterLocal;
  const setTimeFilter = onChartTimeFilterChange ?? setTimeFilterLocal;
  const [dataKey, setDataKey] = useState(0);
  const [mainTab, setMainTab] = useState<"p2p-buy-sell" | "p2p-withdrawal-deposit">("p2p-buy-sell");
  const [depositWithdrawTab, setDepositWithdrawTab] = useState<"all" | "deposit" | "withdrawal">("all");
  const [tableDateFilter, setTableDateFilter] = useState("ALL");
  const [isHistoryDateOpen, setIsHistoryDateOpen] = useState(false);
  const historyDateRef = useRef<HTMLDivElement>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const tableExportRef = useRef<TableExportRef>(null);

  // Close P2P History date dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!isHistoryDateOpen) return;
      const target = e.target as Node;
      if (historyDateRef.current && !historyDateRef.current.contains(target)) {
        setIsHistoryDateOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isHistoryDateOpen]);

  // Fetch trades locally only when parent does not supply them.
  useEffect(() => {
    if (chartTradesProp || !isAuthenticated || tradesFetchStartedRef.current) return;
    tradesFetchStartedRef.current = true;
    setTradesLoading(true);
    setTradesError(null);
    fetchAllUserTradesPages({ fetchAll: true })
      .then((rows) => setAllTradesLocal(rows as UserTrade[]))
      .catch((err) => {
        setTradesError(
          err instanceof Error ? err.message : "Failed to load P2P history"
        );
      })
      .finally(() => setTradesLoading(false));
  }, [chartTradesProp, isAuthenticated]);

  // Filter data based on time filter
  const filterDataByTime = (
    data: TransactionType[],
    filter: TimeFilter
  ): TransactionType[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter((item) => {
      const dateStr = item.lastUpdate || item.date;
      if (!dateStr) return false;

      let itemDate: Date;
      try {
        itemDate = new Date(dateStr);

        // Check if the date is valid
        if (isNaN(itemDate.getTime())) {
          return false;
        }
      } catch (error) {
        return false;
      }

      switch (filter) {
        case "Today":
          return itemDate >= today;

        case "Last Week":
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= lastWeek;

        case "Last Month":
          const lastMonth = new Date(
            today.getTime() - 30 * 24 * 60 * 60 * 1000
          );
          return itemDate >= lastMonth;

        case "Last 6 Months":
          const last6Months = new Date(
            today.getTime() - 180 * 24 * 60 * 60 * 1000
          );
          return itemDate >= last6Months;

        case "All Time":
          return true;

        default:
          return true;
      }
    });
  };

  // Transform user trades to table format (swap order_type for non-owner)
  const transformedData: TransactionType[] = allTrades.map((trade) =>
    transformUserTradeToTransaction(trade, user?.email)
  );

  // Apply time filter to transformed data
  const timeFilteredData = transformedData.filter((item) => {
    const itemDate = new Date(item.date);
    const now = new Date();
    const diffInHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);

    switch (timeFilter) {
      case "Today":
        return diffInHours <= 24;
      case "Last Week":
        return diffInHours <= 24 * 7;
      case "Last Month":
        return diffInHours <= 24 * 30;
      case "Last 6 Months":
        return diffInHours <= 24 * 180;
      case "All Time":
        return true;
      default:
        return true;
    }
  });

  // Apply search filter to time filtered data
  const filteredData = searchQuery.trim()
    ? timeFilteredData.filter(
        (item) =>
          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.username || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.status || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : timeFilteredData;

  // Use filtered data for display (client-side pagination)
  const paginatedSource = searchQuery.trim() ? filteredData : timeFilteredData;
  const totalPages = Math.max(1, Math.ceil(paginatedSource.length / PAGE_SIZE));
  const safeTablePage = Math.min(tablePage, totalPages);
  const displayData = paginatedSource.slice(
    (safeTablePage - 1) * PAGE_SIZE,
    safeTablePage * PAGE_SIZE
  );

  useEffect(() => {
    if (allTrades.length) {
      setDataKey((prev) => prev + 1);
    }
  }, [allTrades.length]);

  useEffect(() => {
    if (tablePage > totalPages) {
      setTablePage(totalPages);
    }
  }, [tablePage, totalPages]);

  const handlePageChange = (page: number) => {
    if (searchQuery.trim()) setSearchQuery("");
    if (page === safeTablePage) return;
    setTablePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== searchQuery.trim()) {
      setTablePage(1);
    }
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    setTablePage(1);
  };

  const fetchAllDataForExport = useCallback(async (): Promise<TransactionType[]> => {
    try {
      const rows =
        allTrades.length > 0
          ? allTrades
          : ((await fetchAllUserTradesPages({ fetchAll: true })) as UserTrade[]);
      return rows.map((t) => transformUserTradeToTransaction(t, user?.email));
    } catch (err) {
      console.error("Error fetching user trades for export:", err);
      return transformedData;
    }
  }, [allTrades, user?.email, transformedData]);

  return (
    <div className="w-full pt-6 sm:pt-4">
      <Charts
        title="P2P Overview (USD)"
        timeFrame="Month"
        chartTrades={allTrades}
        chartLoading={isTradesLoading}
        onTimeFilterChange={handleTimeFilterChange}
        selectedTimeFilter={timeFilter}
        showTimeFilter={true}
      />

      {/* P2P History - section title */}
      <div className="mt-8 w-full pb-4">
        {/* P2P History | ALL | Search | Export Transactions (only for P2P Buy and Sell) */}
        {mainTab === "p2p-buy-sell" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4">
          <h3 className="text-base font-semibold dark:text-white text-gray-900 sm:mr-2">
            P2P History
          </h3>
          <div className="relative" ref={historyDateRef}>
            <button
              type="button"
              onClick={() => setIsHistoryDateOpen((p) => !p)}
              className="px-3 py-2 rounded-lg sm:rounded-[22px] text-sm font-semibold bg-gray-100 dark:bg-[#18181D] text-gray-900 dark:text-white border border-gray-200 dark:border-[#35353E] outline-none focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50 hover:border-[#1D8751] hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors inline-flex items-center gap-1"
            >
              <span className="whitespace-nowrap">{tableDateFilter}</span>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-[#788099] transition-transform ${isHistoryDateOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isHistoryDateOpen && (
              <div className="absolute left-0 top-full mt-2 w-full min-w-[140px] rounded-lg sm:rounded-2xl bg-white dark:bg-[#18181D] shadow-2xl z-20 py-1 border border-gray-200 dark:border-[#35353E]">
                {["ALL", "Today", "Week", "Month", "Year"].map((opt) => {
                  const selected = tableDateFilter === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setTableDateFilter(opt);
                        setIsHistoryDateOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                        selected
                          ? "bg-gray-200 text-gray-900 dark:bg-[#23232B] dark:text-white"
                          : "text-gray-700 dark:text-[#C7CAD1] hover:bg-gray-50 dark:hover:bg-[#14141B]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-4 rounded-xl text-sm border bg-gray-100 dark:bg-[#35353E] text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-200 dark:border-[#35353E] focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-[#1D8751] hover:bg-[#1D8751]/10 rounded-xl transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Transactions
            </button>
            {showExportOptions && (
              <div className="absolute left-0 top-full mt-1 w-40 rounded-md shadow-lg bg-white dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] z-10 py-1">
                <button
                  onClick={() => { tableExportRef.current?.exportCsv(); setShowExportOptions(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#8C8CA1] hover:bg-gray-100 dark:hover:bg-[#35353E]"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => { tableExportRef.current?.exportPdf(); setShowExportOptions(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#8C8CA1] hover:bg-gray-100 dark:hover:bg-[#35353E]"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Tabs: P2P Buy and Sell | P2P Withdrawal/Deposit - below toolbar */}
        <div className="flex rounded-lg border border-[#E3E6F0] dark:border-[#2A2A35] p-1 bg-gray-100 dark:bg-[#1D1D23] mb-6 max-w-fit">
          <button
            type="button"
            onClick={() => setMainTab("p2p-buy-sell")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              mainTab === "p2p-buy-sell"
                ? "bg-white dark:bg-[#35353E] text-[#1D8751] shadow-sm"
                : "text-gray-600 dark:text-[#8B90A5] hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            P2P Buy and Sell
          </button>
          <button
            type="button"
            onClick={() => setMainTab("p2p-withdrawal-deposit")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              mainTab === "p2p-withdrawal-deposit"
                ? "bg-white dark:bg-[#35353E] text-[#1D8751] shadow-sm"
                : "text-gray-600 dark:text-[#8B90A5] hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            P2P Withdrawal/Deposit
          </button>
        </div>

        {mainTab === "p2p-buy-sell" ? (
          /* P2P Buy and Sell - orders table */
          isTradesLoading || tradesError || displayData.length > 0 ? (
            <Table
              ref={tableExportRef}
              key={`p2p-table-${safeTablePage}-${dataKey}`}
              type="p2p"
              title="P2P History"
              data={displayData}
              loading={isTradesLoading}
              error={tradesError}
              currentPage={safeTablePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onFetchAllDataForExport={fetchAllDataForExport}
              onSearch={handleSearch}
              dateFilter={tableDateFilter}
              onDateFilterChange={(f) => setTableDateFilter(f)}
              hideToolbar={true}
              externalSearchQuery={searchQuery}
            />
          ) : (
            <div className="text-center py-12 px-4">
              <NoDataFound
                title="No Orders Found"
                message={
                  searchQuery.trim()
                    ? `No orders match your search "${searchQuery}" for the selected time period.`
                    : `There are currently no orders to display for the selected time period.`
                }
              />
              {searchQuery.trim() && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center px-4 py-2 border dark:border-[#35353E] border-gray-300 rounded-md shadow-sm text-sm font-medium dark:text-white text-gray-900 dark:bg-[#18181D] bg-gray-100 dark:hover:bg-[#35353E] hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D8751] transition-colors"
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
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          /* P2P Withdrawal/Deposit - tabs above card, table inside card */
          <div>
            <div className="flex rounded-lg border border-[#E3E6F0] dark:border-[#2A2A35] p-1 bg-gray-100 dark:bg-[#23232B] mb-4 max-w-fit">
              <button
                type="button"
                onClick={() => setDepositWithdrawTab("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  depositWithdrawTab === "all"
                    ? "bg-white dark:bg-[#35353E] text-[#1D8751] shadow-sm"
                    : "text-gray-600 dark:text-[#8B90A5] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setDepositWithdrawTab("deposit")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  depositWithdrawTab === "deposit"
                    ? "bg-white dark:bg-[#35353E] text-[#1D8751] shadow-sm"
                    : "text-gray-600 dark:text-[#8B90A5] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Deposits
              </button>
              <button
                type="button"
                onClick={() => setDepositWithdrawTab("withdrawal")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  depositWithdrawTab === "withdrawal"
                    ? "bg-white dark:bg-[#35353E] text-[#1D8751] shadow-sm"
                    : "text-gray-600 dark:text-[#8B90A5] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Withdrawals
              </button>
            </div>
            <div className="w-full border-2 border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] shadow-lg rounded-[24px] overflow-x-auto">
              <P2PWithdrawalDepositTransactions filterByType={depositWithdrawTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default P2PCharts;
