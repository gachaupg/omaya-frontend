import React, { useEffect, useState } from "react";
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

type TimeFilter =
  | "Today"
  | "Last Week"
  | "Last Month"
  | "Last 6 Months"
  | "All Time";

const PAGE_SIZE = 10;

const transformUserTradeToTransaction = (trade: UserTrade): TransactionType => ({
  id: trade.id,
  type: trade.order_type?.toLowerCase() || "sell",
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
});

const P2PCharts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, loading, error, currentPage } = useSelector(
    (state: RootState) => state.userTrades
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Last Month");
  const [dataKey, setDataKey] = useState(0);

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

  // Transform user trades to table format
  const transformedData: TransactionType[] = (trades?.results || []).map(
    transformUserTradeToTransaction
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
        allPagesData.push(...results.map(transformUserTradeToTransaction));
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

      {/* Orders Table */}
      <div className="mt-8 w-full pb-4">
        {!displayData || displayData.length === 0 ? (
          <div className="text-center py-12 px-4">
            <NoDataFound
              title="No Orders Found"
              message={
                searchQuery.trim()
                  ? `No orders match your search "${searchQuery}" for the selected time period.`
                  : `There are currently no orders to display for the selected time period.`
              }
            />
            {/* Action buttons */}
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
          />
        )}
      </div>
    </div>
  );
};

export default P2PCharts;
