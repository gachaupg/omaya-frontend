import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Charts from "../../Common/charts";
import { Table } from "../../Common/Table";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchUserTrades,
  setCurrentPage as setUserTradesCurrentPage,
} from "@/features/p2p/slices/userTradesSlice";
import { TransactionType, UserTrade } from "@/features/p2p/types";
import { getUserTrades } from "@/features/p2p/api";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";
import P2PWithdrawalDepositTransactions from "@/components/dashboard/sections/P2PWithdrawalDepositTransactions";
import type { TableExportRef } from "../../Common/Table";

type TimeFilter =
  | "Today"
  | "Last Week"
  | "Last Month"
  | "Last 6 Months"
  | "All Time";

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

const P2PCharts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, loading, error, currentPage } = useSelector(
    (state: RootState) => state.userTrades
  );
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Last Month");
  const [dataKey, setDataKey] = useState(0);
  const [mainTab, setMainTab] = useState<"p2p-buy-sell" | "p2p-withdrawal-deposit">("p2p-buy-sell");
  const [depositWithdrawTab, setDepositWithdrawTab] = useState<"deposit" | "withdrawal">("deposit");
  const [tableDateFilter, setTableDateFilter] = useState("ALL");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const tableExportRef = useRef<TableExportRef>(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserTrades({ page: currentPage, currency: "USDT" }));
    }
  }, [dispatch, currentPage, isAuthenticated]);

  // Reset to first page when component mounts or authentication changes
  useEffect(() => {
    if (isAuthenticated && currentPage !== 1) {
      dispatch(setUserTradesCurrentPage(1));
    }
  }, [isAuthenticated, dispatch]);

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
  const transformedData: TransactionType[] = (trades?.results || []).map(
    (trade) => transformUserTradeToTransaction(trade, user?.email)
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

  // Use filtered data for display
  const displayData = searchQuery.trim() ? filteredData : timeFilteredData;
  const totalPages = Math.ceil((trades?.count || 0) / PAGE_SIZE);

  // Force re-render when trades data changes
  useEffect(() => {
    if (trades?.results?.length) {
      setDataKey((prev) => prev + 1);
    }
  }, [trades?.results]);

  const handlePageChange = (page: number) => {
    if (searchQuery.trim()) setSearchQuery("");
    if (page !== currentPage) {
      dispatch(setUserTradesCurrentPage(page));
      dispatch(fetchUserTrades({ page, currency: "USDT" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== searchQuery.trim() && currentPage !== 1) {
      dispatch(setUserTradesCurrentPage(1));
      dispatch(fetchUserTrades({ page: 1, currency: "USDT" }));
    }
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  const fetchAllDataForExport = async (): Promise<TransactionType[]> => {
    const allPagesData: TransactionType[] = [];
    try {
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 100) {
        const response = await getUserTrades(`?page=${page}&currency=USDT`);
        const results = response?.results || [];
        if (results.length === 0) break;
        allPagesData.push(...results.map((t) => transformUserTradeToTransaction(t, user?.email)));
        hasMore = !!response?.next;
        page++;
      }
      return allPagesData;
    } catch (err) {
      console.error("Error fetching user trades for export:", err);
      return transformedData;
    }
  };

  return (
    <div className="w-full pt-6 sm:pt-4">
      <Charts
        title="P2P Overview (USD)"
        timeFrame="Month"
        data={timeFilteredData}
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
          <div className="relative">
            <select
              value={tableDateFilter}
              onChange={(e) => setTableDateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-[#E6E7EC] dark:bg-[var(--bg-color)] text-gray-900 dark:text-white border-none outline-none focus:ring-0"
            >
              {["ALL", "Today", "Week", "Month", "Year"].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
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
          !displayData || displayData.length === 0 ? (
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
          ) : (
            <Table
              ref={tableExportRef}
              key={`p2p-table-${currentPage}-${dataKey}`}
              type="p2p"
              title="P2P History"
              data={displayData}
              loading={loading}
              error={error}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onFetchAllDataForExport={fetchAllDataForExport}
              onSearch={handleSearch}
              dateFilter={tableDateFilter}
              onDateFilterChange={(f) => setTableDateFilter(f)}
              hideToolbar={true}
              externalSearchQuery={searchQuery}
            />
          )
        ) : (
          /* P2P Withdrawal/Deposit - tabs above card, table inside card */
          <div>
            <div className="flex rounded-lg border border-[#E3E6F0] dark:border-[#2A2A35] p-1 bg-gray-100 dark:bg-[#23232B] mb-4 max-w-fit">
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
            <div className="w-full border-2 border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] shadow-lg rounded-[24px] overflow-hidden">
              <P2PWithdrawalDepositTransactions filterByType={depositWithdrawTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default P2PCharts;
