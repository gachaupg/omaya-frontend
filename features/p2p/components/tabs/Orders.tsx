import React, { useEffect, useState, useCallback, useMemo } from "react";
import Filters from "../ui/orders/Filters";
import OrdersTransactions from "../ui/orders/OrdersTransactions";
import { fetchUserTrades } from "../../slices/userTradesSlice";
import { TransactionType } from "../../types";
import { setCurrentPage } from "../../slices/userTradesSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { orderStatusTabs as staticOrderStatusTabs } from "../../data";
import { RootState } from "@/store/rootReducer";

const Orders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, loading, error, currentPage } = useSelector(
    (state: RootState) => state.userTrades
  );
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Filter states with proper initial values
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    date: "all",
    currency: "usdt",
  });

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTrades = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchUserTrades({ page: currentPage, ...filters }));
    }
  }, [dispatch, currentPage, filters, isAuthenticated]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handlePageChange = (page: number) => {
    console.log("handlePageChange called with page:", page);
    dispatch(setCurrentPage(page));
    // Fetch data for the new page
    dispatch(fetchUserTrades({ page, ...filters }));
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    dispatch(setCurrentPage(1)); // Reset to first page when filters change
  };

  // Count orders by status - map "pending" from API to "processing" in UI
  const processingCount = trades.results.filter(
    trade => trade.status.toLowerCase() === "pending" || trade.status.toLowerCase() === "matched"
  ).length;
  
  const completedCount = trades.results.filter(
    trade => trade.status.toLowerCase() === "completed"
  ).length;
  
  const canceledCount = trades.results.filter(
    trade => trade.status.toLowerCase() === "canceled"
  ).length;

  const orderStatusTabs = staticOrderStatusTabs.map(tab => {
    if (tab.id === "processing") {
      return { ...tab, count: processingCount };
    } else if (tab.id === "completed") {
      return { ...tab, count: completedCount };
    } else if (tab.id === "canceled") {
      return { ...tab, count: canceledCount };
    } else if (tab.id === "all") {
      return { ...tab, count: trades.count };
    }
    return tab;
  });

  // Apply client-side filtering to the data
  const filteredData = useMemo(() => {
    return trades.results.filter((trade) => {
      // Type filter
      if (
        filters.type !== "all" &&
        trade.order_type.toLowerCase() !== filters.type
      ) {
        return false;
      }

      // Status filter - map UI "processing" to API "pending"/"matched"
      if (filters.status !== "all") {
        const tradeStatus = trade.status.toLowerCase();
        if (filters.status === "processing") {
          // Processing includes both pending and matched statuses
          if (tradeStatus !== "pending" && tradeStatus !== "matched") {
            return false;
          }
        } else if (tradeStatus !== filters.status.toLowerCase()) {
          return false;
        }
      }

      // Date filter
      if (filters.date !== "all") {
        const tradeDate = new Date(trade.timestamp);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filters.date) {
          case "today":
            const tradeDay = new Date(tradeDate);
            tradeDay.setHours(0, 0, 0, 0);
            if (tradeDay.getTime() !== today.getTime()) {
              return false;
            }
            break;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            if (tradeDate < weekAgo) {
              return false;
            }
            break;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            if (tradeDate < monthAgo) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [trades.results, filters]);

  const transformedData: TransactionType[] = filteredData.map((trade) => ({
    id: trade.id,
    type: trade.order_type.toLowerCase(),
    date: trade.timestamp, // Keep as ISO string for formatDate to parse correctly
    amount: parseFloat(trade.amount).toFixed(2),
    status: trade.status.toLowerCase(),
    asset: parseFloat(trade.amount).toFixed(2),
    assetSymbol: "USDT",
    rate: parseFloat(trade.rate.toString()).toFixed(2),
    payment: trade.payment_details?.[0]
      ? {
          bank: trade.payment_details[0].provider,
          logo: "",
        }
      : undefined,
    // Add all trade data for modal
    rawData: trade,
  }));

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <Filters
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
        orderStatusTabs={orderStatusTabs}
      />
      <div className="flex flex-col w-full">
      <OrdersTransactions
        transformedData={transformedData}
        loading={loading}
        error={error}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        trades={trades}
        currentUserEmail={user?.email || ""}
      />
      </div>
    </div>
  );
};

export default Orders;
