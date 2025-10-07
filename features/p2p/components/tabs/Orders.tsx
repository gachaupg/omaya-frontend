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
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

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
    dispatch(setCurrentPage(page));
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    dispatch(setCurrentPage(1)); // Reset to first page when filters change
  };

  const processingCount = trades.results.filter(
  trade => trade.status.toLowerCase() === "pending"
).length;

const orderStatusTabs = staticOrderStatusTabs.map(tab =>
  tab.id === "processing"
    ? { ...tab, count: processingCount }
    : tab
);

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

      // Status filter
      if (filters.status !== "all") {
        if (
          filters.status === "processing" &&
          trade.status.toLowerCase() !== "pending"
        ) {
          return false;
        }

        if (
          filters.status !== "processing" &&
          trade.status.toLowerCase() !== filters.status
        ) {
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
    date: new Date(trade.timestamp).toLocaleString(),
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
        />
      </div>
    </div>
  );
};

export default Orders;
