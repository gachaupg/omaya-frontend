import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Charts from "../../Common/charts";
import { Table } from "../../Common/Table";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchMyOrders,
  setCurrentPage as setMyOrdersCurrentPage,
} from "@/features/p2p/slices/myOrdersSlice";
import { P2POrder, TransactionType } from "@/features/p2p/types";
import { getMyP2POrders } from "@/features/p2p/api";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";

type TimeFilter =
  | "Today"
  | "Last Week"
  | "Last Month"
  | "Last 6 Months"
  | "All Time";

const P2PCharts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error, currentPage } = useSelector(
    (state: RootState) => state.myOrders
  );
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Last Month");
  const [dataKey, setDataKey] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyOrders(currentPage));
    }
  }, [dispatch, currentPage, isAuthenticated]);

  // Reset to first page when component mounts or authentication changes
  useEffect(() => {
    if (isAuthenticated && currentPage !== 1) {
      dispatch(setMyOrdersCurrentPage(1));
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
      if (!item.lastUpdate) return false;

      // Parse the date string - handle different formats
      let itemDate: Date;
      try {
        // Try parsing as ISO string first
        itemDate = new Date(item.lastUpdate);

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

  // Transform orders data - handle both buy_orders and sell_orders from API response
  const allOrders = [
    ...(orders?.buy_orders || []),
    ...(orders?.sell_orders || []),
  ];
  
  const transformedData: TransactionType[] = allOrders.map((order: P2POrder) => ({
    id: order.id,
    type: order.order_type,
    advertiser_email: order.advertiser_email,
    date: order.created_on,
    amount: order.amount,
    status: order.status,
    asset: order.asset,
    assetSymbol: order.currency,
    rate: order.exchange_rate,
    payment: order.payment_details.map((payment) => ({
      bank: payment.provider,
      logo: "",
    })),
    username: `${order.advertiser_first_name} ${order.advertiser_last_name}`,
    limit: `${order.min_order_amount} - ${order.max_order_amount}`,
    price: order.exchange_rate,
    commission: order.commission_rate,
    lastUpdate: order.created_on,
  }));

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

  // Use filtered data for display, but ensure we're showing the correct data for current page
  const displayData = searchQuery.trim() ? filteredData : transformedData;
  // Calculate total pages based on actual count from API
  const totalOrders = (orders?.buy_pagination?.count || 0) + (orders?.sell_pagination?.count || 0);
  const pageSize = 10; // Default page size, should match backend
  const totalPages = Math.ceil(totalOrders / pageSize);

 
 

  // Force re-render when orders data changes
  useEffect(() => {
    if (orders?.buy_orders || orders?.sell_orders) {
      setDataKey((prev) => prev + 1);
    }
  }, [orders?.buy_orders, orders?.sell_orders]);

  // Check if data is actually different
  useEffect(() => {
    if (orders?.buy_orders || orders?.sell_orders) {
      const currentDataIds = allOrders
        .map((item) => item.id)
        .join(",");
    }
  }, [orders?.buy_orders, orders?.sell_orders, dataKey]);

  // Handlers for table functionality
  const handleExport = async (format: "csv" | "pdf") => {
    console.log("🔄 Export started - handleExport called");
    
    // Fetch all pages of data for export
    const allPagesData: TransactionType[] = [];
    
    try {
      // First, fetch page 1 to get accurate pagination info
      const firstPageResponse = await getMyP2POrders(1);
      const buyTotalPages = firstPageResponse?.buy_pagination?.total_pages || 1;
      const sellTotalPages = firstPageResponse?.sell_pagination?.total_pages || 1;
      const buyCount = firstPageResponse?.buy_pagination?.count || 0;
      const sellCount = firstPageResponse?.sell_pagination?.count || 0;
      
      // Use the maximum of both paginations to ensure we get all data
      const maxTotalPages = Math.max(buyTotalPages, sellTotalPages, 1);
      
      // Also calculate from counts as fallback
      const calculatedBuyPages = buyCount > 0 ? Math.ceil(buyCount / 10) : 1;
      const calculatedSellPages = sellCount > 0 ? Math.ceil(sellCount / 10) : 1;
      const maxCalculatedPages = Math.max(calculatedBuyPages, calculatedSellPages);
      
      // Use the maximum to ensure we don't miss any pages
      // Don't cap - fetch all pages if needed
      const finalMaxPages = Math.max(maxTotalPages, maxCalculatedPages, totalPages || 1);
      
      console.log("📊 Export - Pagination info:", {
        buyTotalPages,
        sellTotalPages,
        buyCount,
        sellCount,
        calculatedBuyPages,
        calculatedSellPages,
        maxTotalPages,
        maxCalculatedPages,
        finalMaxPages,
        currentOrdersState: {
          buyCount: orders?.buy_pagination?.count,
          sellCount: orders?.sell_pagination?.count,
        },
      });

      // Fetch all pages using API directly
      // Keep fetching until we get an error (404) or no data
      let page = 1;
      let consecutiveEmptyPages = 0;
      const MAX_PAGES_TO_FETCH = 100; // Safety limit
      const MAX_CONSECUTIVE_EMPTY = 2; // Stop after 2 empty pages in a row
      let hasMorePages = true;
      
      while (hasMorePages && page <= Math.max(finalMaxPages, MAX_PAGES_TO_FETCH)) {
        try {
          const response = await getMyP2POrders(page);
          const buyOrders = response?.buy_orders || [];
          const sellOrders = response?.sell_orders || [];
          const allOrdersPage = [...buyOrders, ...sellOrders];
          
          console.log(`📄 Export - Page ${page}:`, {
            buyOrdersCount: buyOrders.length,
            sellOrdersCount: sellOrders.length,
            total: allOrdersPage.length,
            buyPagination: response?.buy_pagination,
            sellPagination: response?.sell_pagination,
          });
          
          // Check if we have a "next" field indicating more pages
          const hasBuyNext = response?.buy_pagination?.next !== null;
          const hasSellNext = response?.sell_pagination?.next !== null;
          const hasNextPage = hasBuyNext || hasSellNext;
          
          if (allOrdersPage.length === 0) {
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= MAX_CONSECUTIVE_EMPTY || !hasNextPage) {
              console.log(`✅ Export - Got ${MAX_CONSECUTIVE_EMPTY} empty pages or no next page, stopping at page ${page}`);
              hasMorePages = false;
              break;
            }
            page++;
            continue;
          }
          
          // Reset consecutive empty counter if we got data
          consecutiveEmptyPages = 0;
          
          const transformedPageData: TransactionType[] = allOrdersPage.map((order: P2POrder) => ({
            id: order.id,
            type: order.order_type,
            advertiser_email: order.advertiser_email,
            date: order.created_on,
            amount: order.amount,
            status: order.status,
            asset: order.asset,
            assetSymbol: order.currency,
            rate: order.exchange_rate,
            payment: order.payment_details.map((payment) => ({
              bank: payment.provider,
              logo: "",
            })),
            username: `${order.advertiser_first_name} ${order.advertiser_last_name}`,
            limit: `${order.min_order_amount} - ${order.max_order_amount}`,
            price: order.exchange_rate,
            commission: order.commission_rate,
            lastUpdate: order.created_on,
          }));
          
          allPagesData.push(...transformedPageData);
          
          // Update pagination info from current page response
          const currentBuyTotalPages = response?.buy_pagination?.total_pages || buyTotalPages;
          const currentSellTotalPages = response?.sell_pagination?.total_pages || sellTotalPages;
          const currentMaxPages = Math.max(currentBuyTotalPages, currentSellTotalPages);
          
          // Stop if no next page and we've reached max pages
          if (!hasNextPage || (page >= currentMaxPages && allOrdersPage.length === 0)) {
            console.log(`✅ Export - No more pages available, stopping at page ${page}`);
            hasMorePages = false;
            break;
          }
          
          page++;
        } catch (error: any) {
          // Handle 404 or other errors - means we've reached the end or page doesn't exist
          if (error?.response?.status === 404 || error?.status === 404) {
            console.log(`✅ Export - Got 404 on page ${page}, no more pages available`);
            hasMorePages = false;
            break;
          } else if (page === 1) {
            // If first page fails, throw error
            throw error;
          } else {
            // For other errors after page 1, just stop and use what we have
            console.warn(`⚠️ Export - Error on page ${page}, stopping and using data fetched so far:`, error);
            hasMorePages = false;
            break;
          }
        }
      }
      
      console.log("✅ Export - Fetching complete:", {
        totalItems: allPagesData.length,
        pagesFetched: Math.min(finalMaxPages, maxTotalPages),
      });
      
      // If we still don't have data, use current page data as fallback
      if (allPagesData.length === 0) {
        console.warn("⚠️ Export - No data fetched, using current page data");
        allPagesData.push(...transformedData);
      }
    } catch (error) {
      console.error("❌ Export - Error fetching all pages:", error);
      // Fall back to current page data if fetching all pages fails
      allPagesData.push(...transformedData);
      console.warn("⚠️ Export - Using current page data only due to error");
    }

    console.log("🔍 Export - Applying filters:", {
      totalItemsBeforeFilters: allPagesData.length,
      timeFilter,
      searchQuery,
    });

    // Apply time filter to all data
    const timeFilteredAllData = filterDataByTime(allPagesData, timeFilter);
    console.log("📅 Export - After time filter:", timeFilteredAllData.length);
    
    // Apply search filter if exists
    const exportData = searchQuery.trim()
      ? timeFilteredAllData.filter(
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
      : timeFilteredAllData;
    
    console.log("📤 Export - Final data to export:", {
      totalItems: exportData.length,
      format,
    });

    // Validate we have data to export
    if (!exportData || exportData.length === 0) {
      alert("No data to export. Please check your filters or try again.");
      console.error("❌ Export - No data to export after filtering");
      return;
    }

    if (format === "csv") {
      // Export as CSV
      console.log(`💾 Exporting CSV with ${exportData.length} items...`);
      const worksheet = XLSX.utils.json_to_sheet(
        exportData.map((item) => ({
          ID: item.id,
          Type: item.type,
          Amount: item.amount,
          Status: item.status,
          Asset: item.asset,
          Date: item.date,
          Username: item.username,
          Rate: item.rate,
          Commission: item.commission,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      XLSX.writeFile(workbook, "p2p_transactions.csv");
      console.log(`✅ CSV exported successfully with ${exportData.length} items`);
    } else {
      // Export as PDF
      console.log(`💾 Exporting PDF with ${exportData.length} items...`);
      const doc = new jsPDF();
      doc.text("P2P Transactions", 14, 15);

      const tableData = exportData.map((item) => [
        String(item.id || ""),
        String(item.type || ""),
        String(item.amount || ""),
        String(item.status || ""),
        String(item.asset || ""),
        new Date(item.date || "").toLocaleDateString(),
        String(item.username || ""),
      ]);

      autoTable(doc, {
        head: [["ID", "Type", "Amount", "Status", "Asset", "Date", "Username"]],
        body: tableData,
        startY: 25,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [29, 135, 81],
          textColor: 255,
        },
      });

      doc.save("p2p_transactions.pdf");
      console.log(`✅ PDF exported successfully with ${exportData.length} items`);
    }
    
    // Restore the original page data by fetching the current page again
    if (currentPage !== 1 || totalPages > 1) {
      dispatch(fetchMyOrders(currentPage));
    }
  };

  const handlePageChange = (page: number) => {
    // Clear search when changing pages to avoid confusion
    if (searchQuery.trim()) {
      setSearchQuery("");
    }

    // Only update if the page is actually different
    if (page !== currentPage) {
      // Update the current page in Redux store
      dispatch(setMyOrdersCurrentPage(page));
      // Fetch data for the new page
      dispatch(fetchMyOrders(page));
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    if (query.trim() !== searchQuery.trim()) {
      if (currentPage !== 1) {
        dispatch(setMyOrdersCurrentPage(1));
        dispatch(fetchMyOrders(1));
      }
    }
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  // Function to fetch all data for export - used by Table component
  const fetchAllDataForExport = async (): Promise<TransactionType[]> => {
    console.log("🔄 fetchAllDataForExport called - fetching all pages");
    const allPagesData: TransactionType[] = [];
    
    try {
      // First, fetch page 1 to get accurate pagination info
      const firstPageResponse = await getMyP2POrders(1);
      const buyTotalPages = firstPageResponse?.buy_pagination?.total_pages || 1;
      const sellTotalPages = firstPageResponse?.sell_pagination?.total_pages || 1;
      const buyCount = firstPageResponse?.buy_pagination?.count || 0;
      const sellCount = firstPageResponse?.sell_pagination?.count || 0;
      
      const maxTotalPages = Math.max(buyTotalPages, sellTotalPages, 1);
      const calculatedBuyPages = buyCount > 0 ? Math.ceil(buyCount / 10) : 1;
      const calculatedSellPages = sellCount > 0 ? Math.ceil(sellCount / 10) : 1;
      const maxCalculatedPages = Math.max(calculatedBuyPages, calculatedSellPages);
      const finalMaxPages = Math.max(maxTotalPages, maxCalculatedPages, totalPages || 1);
      
      console.log("📊 Fetching all data - Pagination:", { buyTotalPages, sellTotalPages, finalMaxPages });
      
      // Fetch all pages
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages && page <= Math.min(finalMaxPages, 100)) {
        try {
          const response = await getMyP2POrders(page);
          const buyOrders = response?.buy_orders || [];
          const sellOrders = response?.sell_orders || [];
          const allOrdersPage = [...buyOrders, ...sellOrders];
          
          const hasBuyNext = response?.buy_pagination?.next !== null;
          const hasSellNext = response?.sell_pagination?.next !== null;
          const hasNextPage = hasBuyNext || hasSellNext;
          
          if (allOrdersPage.length === 0 && !hasNextPage) {
            console.log(`✅ No more data at page ${page}`);
            break;
          }
          
          console.log(`📄 Fetched page ${page}: ${allOrdersPage.length} items`);
          
          const transformedPageData: TransactionType[] = allOrdersPage.map((order: P2POrder) => ({
            id: order.id,
            type: order.order_type,
            advertiser_email: order.advertiser_email,
            date: order.created_on,
            amount: order.amount,
            status: order.status,
            asset: order.asset,
            assetSymbol: order.currency,
            rate: order.exchange_rate,
            payment: order.payment_details.map((payment) => ({
              bank: payment.provider,
              logo: "",
            })),
            username: `${order.advertiser_first_name} ${order.advertiser_last_name}`,
            limit: `${order.min_order_amount} - ${order.max_order_amount}`,
            price: order.exchange_rate,
            commission: order.commission_rate,
            lastUpdate: order.created_on,
          }));
          
          allPagesData.push(...transformedPageData);
          
          if (!hasNextPage) {
            hasMorePages = false;
            break;
          }
          
          page++;
        } catch (error: any) {
          if (error?.response?.status === 404 || error?.status === 404) {
            console.log(`✅ 404 at page ${page}, stopping`);
            break;
          }
          throw error;
        }
      }
      
      console.log(`✅ Fetched all data: ${allPagesData.length} total items`);
      return allPagesData;
    } catch (error) {
      console.error("❌ Error fetching all data:", error);
      // Return current page data as fallback
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
      <div className="mt-8">
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
