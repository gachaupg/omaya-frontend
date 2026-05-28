import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import Filters from "../ui/orders/Filters";
import OrdersTransactions from "../ui/orders/OrdersTransactions";
import UnreadMessages from "../ui/orders/UnreadMessages";
import ProcessingNotifications from "../ui/orders/ProcessingNotifications";
import { fetchUserTrades } from "../../slices/userTradesSlice";
import { TransactionType } from "../../types";
import { setCurrentPage } from "../../slices/userTradesSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { orderStatusTabs as staticOrderStatusTabs } from "../../data";
import { RootState } from "@/store/rootReducer";
import {
  selectPendingMatchedTradeNotificationCount,
  selectUserTradesByStatus,
} from "../../selectors";
import { OrdersListSkeleton } from "@/components/ui/Skeletons";
import { useGroupedMessages } from "../../hooks/useGroupedMessages";
import { fetchMatchedTrades } from "../../slices/matchedTradesSlice";

import { logger } from "@/lib/utils/logger";

const Orders = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, loading, error, currentPage } = useSelector(
    (state: RootState) => state.userTrades
  );
  const { data: matchedTrades, loading: matchedTradesLoading } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  // Filter states with proper initial values
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    date: "all",
    currency: "usdt",
    customDateFrom: undefined as string | undefined,
    customDateTo: undefined as string | undefined,
  });

  // State for unread messages view
  const [showUnreadMessages, setShowUnreadMessages] = useState(false);

  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTrades = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchUserTrades({ page: currentPage, ...filters }));
    }
  }, [dispatch, currentPage, filters, isAuthenticated]);

  useEffect(() => {
    fetchTrades();
    // Fetch matched trades for Processing tab
    if (isAuthenticated) {
      dispatch(fetchMatchedTrades(1));
    }
  }, [fetchTrades, isAuthenticated, dispatch]);

  const handlePageChange = (page: number) => {
    logger.debug("p2p", "handlePageChange called with page:", page);
    dispatch(setCurrentPage(page));
    // Fetch data for the new page
    dispatch(fetchUserTrades({ page, ...filters }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (newFilters: {
    type: string;
    status: string;
    date: string;
    currency: string;
    customDateFrom?: string | undefined;
    customDateTo?: string | undefined;
  }) => {
    setFilters({
      ...newFilters,
      customDateFrom: newFilters.customDateFrom ?? undefined,
      customDateTo: newFilters.customDateTo ?? undefined,
    });
    dispatch(setCurrentPage(1)); // Reset to first page when filters change
  };


  const handleBackToOrders = () => {
    setShowUnreadMessages(false);
  };

  // Use memoized selector for status counts
  const { processingCount, completedCount, cancelledCount } = useSelector(
    selectUserTradesByStatus
  );

  const pendingMatchedCount = useSelector(
    selectPendingMatchedTradeNotificationCount
  );
  const actualProcessingCount = pendingMatchedCount || processingCount;

  const orderStatusTabs = useMemo(
    () =>
      staticOrderStatusTabs.map((tab) => {
        if (tab.id === "processing") {
          return { ...tab, count: actualProcessingCount };
        } else if (tab.id === "completed") {
          return { ...tab, count: completedCount };
        } else if (tab.id === "canceled") {
          return { ...tab, count: cancelledCount };
        } else if (tab.id === "all") {
          return { ...tab, count: trades.count };
        }
        return tab;
      }),
    [actualProcessingCount, completedCount, cancelledCount, trades.count]
  );

  // Apply client-side filtering to the data
  const filteredData = useMemo(() => {
    const currentUserEmail = (user?.email || "").trim().toLowerCase();

    // If Processing tab is selected, use matched trades instead
    if (filters.status === "processing") {
      return matchedTrades?.results || [];
    }

    return trades.results.filter((trade) => {
      // Type filter: use display type (swap for non-owner)
      if (filters.type !== "all") {
        const ownerEmail = (trade.owner || "").trim().toLowerCase();
        const isOwner = currentUserEmail && ownerEmail && currentUserEmail === ownerEmail;
        const displayType = isOwner
          ? trade.order_type.toLowerCase()
          : trade.order_type.toLowerCase() === "buy"
            ? "sell"
            : "buy";
        if (displayType !== filters.type) {
          return false;
        }
      }

      // Status filter - skip processing since it's handled above
      if (filters.status !== "all") {
        const tradeStatus = trade.status.toLowerCase();
        if (tradeStatus !== filters.status.toLowerCase()) {
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
            // "This month" should mean current calendar month, not "last 30 days".
            const startOfThisMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1,
              0,
              0,
              0,
              0
            );
            if (tradeDate < startOfThisMonth) {
              return false;
            }
            break;
          case "custom":
            if (filters.customDateFrom && filters.customDateTo) {
              const fromDate = new Date(filters.customDateFrom);
              fromDate.setHours(0, 0, 0, 0);
              const toDate = new Date(filters.customDateTo);
              toDate.setHours(23, 59, 59, 999);
              if (tradeDate < fromDate || tradeDate > toDate) {
                return false;
              }
            }
            break;
        }
      }

      return true;
    });
  }, [trades.results, filters, user?.email, matchedTrades]);



  const transformedData: TransactionType[] = (filteredData as any[])
    .filter(() => filters.status !== "processing")
    .map((trade) => {
    // If logged-in user is the owner: display order_type as-is.
    // If NOT owner (user is counterparty): swap order_type (buy → sell, sell → buy).
    const currentUserEmail = (user?.email || "").trim().toLowerCase();
    const ownerEmail = (trade.owner || "").trim().toLowerCase();
    const isOwner = currentUserEmail && ownerEmail && currentUserEmail === ownerEmail;

    const rawOrderType = trade.order_type.toLowerCase();
    const userAction = isOwner
      ? rawOrderType
      : rawOrderType === "buy"
        ? "sell"
        : "buy";

    return {
      id: trade.id,
      type: userAction,
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
    };
  });

  const hasActiveLocalFilters =
    filters.type !== "all" ||
    filters.date !== "all" ||
    (filters.status !== "all" && filters.status !== "processing");

  // Show skeleton while loading initial data
  if (loading && trades.results.length === 0) {
    return <OrdersListSkeleton count={6} />;
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 w-full h-full mx-auto max-w-[1400px] px-1 sm:px-2 md:px-6 lg:px-8">
      <Filters
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
        orderStatusTabs={orderStatusTabs}
      
      />
      <div className="flex flex-col w-full">
        {filters.status === "processing" ? (
          <ProcessingNotifications matchedTrades={matchedTrades} />
        ) : (
          <OrdersTransactions
            transformedData={transformedData}
            loading={loading}
            error={error}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
            trades={trades}
            hasActiveLocalFilters={hasActiveLocalFilters}
          />
        )}
      </div>
    </div>
  );
});

Orders.displayName = "Orders";

export default Orders;
