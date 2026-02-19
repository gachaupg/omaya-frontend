/**
 * Memoized Redux Selectors for P2P Feature
 *
 * These selectors use createSelector from @reduxjs/toolkit to prevent
 * unnecessary re-computations and re-renders.
 *
 * Performance Benefits:
 * - Selectors only recompute when input values change
 * - Prevents unnecessary component re-renders
 * - Improves performance of complex calculations
 */

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/rootReducer";
import { toNumber } from "@/lib/finanacial";
import { getWalletAmountsFromSummary } from "@/features/p2p/walletAmounts";

// ======================
// Base Selectors (Input Selectors)
// ======================

export const selectWalletsState = (state: RootState) => state.wallets;
export const selectMatchedTradesState = (state: RootState) =>
  state.matchedTrades;
export const selectTransactionSummaryState = (state: RootState) =>
  state.transactionSummary;
export const selectUserTradesState = (state: RootState) => state.userTrades;
export const selectP2PMarketState = (state: RootState) => state.p2pMarket;
export const selectAuthState = (state: RootState) => state.auth;
export const selectMyOrdersState = (state: RootState) => state.myOrders;
export const selectP2PBuySellState = (state: RootState) => state.p2pBuySell;

// ======================
// Memoized Wallet Selectors
// ======================

/**
 * Select wallet balance with proper parsing and fallback
 */
export const selectWalletBalance = createSelector(
  [selectWalletsState],
  (walletsState) => {
    // Ensure wallets is always an object, even if data is null/undefined
    const wallets = walletsState.data || {
      total_balance: '0',
      wallet: {
        id: 0,
        currency: 'USDT',
        balance: '0',
        deposit_address: '',
        created_on: new Date().toISOString(),
      },
      deposit_addresses: {
        tron: {
          address: null,
          status: 'inactive',
        },
        bsc: {
          address: '',
          status: 'inactive',
        },
      },
    };

    const totalBalance = wallets?.total_balance
      ? toNumber(wallets.total_balance)
      : 0;
    const walletBalance = wallets?.wallet?.balance
      ? parseFloat(wallets.wallet.balance)
      : 0;

    // For USDT wallets, prioritize the individual wallet balance
    const isUSDTWallet = wallets?.wallet?.currency === "USDT";
    const balance =
      isUSDTWallet && walletBalance > 0
        ? walletBalance
        : totalBalance && !isNaN(totalBalance) && totalBalance > 0
          ? totalBalance
          : walletBalance;

    return {
      balance: isNaN(balance) ? 0 : balance,
      totalBalance: isNaN(totalBalance) ? 0 : totalBalance,
      walletBalance: isNaN(walletBalance) ? 0 : walletBalance,
      currency: wallets?.wallet?.currency || "USDT",
      loading: walletsState.loading,
    };
  }
);

/**
 * Select wallet data
 */
export const selectWalletData = createSelector(
  [selectWalletsState],
  (walletsState) => walletsState.data
);

// ======================
// Memoized Trades Selectors
// ======================

/**
 * Select matched trades with loading state
 */
export const selectMatchedTrades = createSelector(
  [selectMatchedTradesState],
  (tradesState) => ({
    data: tradesState.data,
    loading: tradesState.loading,
    error: tradesState.error,
  })
);

/**
 * Select active matched trades (non-completed)
 */
export const selectActiveMatchedTrades = createSelector(
  [selectMatchedTradesState],
  (tradesState) => {
    const trades = tradesState.data?.results || [];
    return trades.filter(
      (trade) => trade.status === "matched" || trade.status === "half-matched"
    );
  }
);

/**
 * Select completed matched trades
 */
export const selectCompletedMatchedTrades = createSelector(
  [selectMatchedTradesState],
  (tradesState) => {
    const trades = tradesState.data?.results || [];
    return trades.filter((trade) => trade.status === "completed");
  }
);

// ======================
// Memoized Transaction Summary Selectors
// ======================

/**
 * Select transaction summary
 */
export const selectTransactionSummary = createSelector(
  [selectTransactionSummaryState],
  (summaryState) => summaryState.summary
);

/**
 * Select transaction summary with loading state
 */
export const selectTransactionSummaryWithLoading = createSelector(
  [selectTransactionSummaryState],
  (summaryState) => ({
    summary: summaryState.summary,
    loading: summaryState.loading,
    error: summaryState.error,
  })
);

/**
 * Select reusable wallet amounts from transaction summary (balance, available, escrow).
 * Use in P2pWallet (balance), P2PDashboard/Available (available + escrow).
 */
export const selectP2PWalletAmounts = createSelector(
  [selectTransactionSummary],
  getWalletAmountsFromSummary
);

// ======================
// Memoized User Trades Selectors
// ======================

/**
 * Select user trades results
 */
export const selectUserTradesResults = createSelector(
  [selectUserTradesState],
  (tradesState) => tradesState.trades.results || []
);

/**
 * Select user trades by status
 */
export const selectUserTradesByStatus = createSelector(
  [selectUserTradesResults],
  (trades) => {
    const processing = trades.filter(
      (trade) =>
        trade.status.toLowerCase() === "pending" ||
        trade.status.toLowerCase() === "matched" ||
        trade.status.toLowerCase() === "half-matched"
    );

    const completed = trades.filter(
      (trade) => trade.status.toLowerCase() === "completed"
    );

    const cancelled = trades.filter(
      (trade) => trade.status.toLowerCase() === "cancelled"
    );

    const failed = trades.filter(
      (trade) => trade.status.toLowerCase() === "failed"
    );

    return {
      processing,
      completed,
      cancelled,
      failed,
      processingCount: processing.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      failedCount: failed.length,
    };
  }
);

// ======================
// Memoized P2P Market Selectors
// ======================

/**
 * Select P2P buy orders
 */
export const selectP2PBuyOrders = createSelector(
  [selectP2PMarketState],
  (marketState) =>
    marketState?.p2pBuyOrders || { results: [], total_orders_count: 0 }
);

/**
 * Select P2P sell orders
 */
export const selectP2PSellOrders = createSelector(
  [selectP2PMarketState],
  (marketState) =>
    marketState?.p2pSellOrders || { results: [], total_orders_count: 0 }
);

/**
 * Select all P2P orders (buy + sell)
 */
export const selectAllP2POrders = createSelector(
  [selectP2PBuyOrders, selectP2PSellOrders],
  (buyOrders, sellOrders) => ({
    buy_orders: buyOrders,
    sell_orders: sellOrders,
    totalBuyCount: buyOrders.total_orders_count || 0,
    totalSellCount: sellOrders.total_orders_count || 0,
  })
);

// ======================
// Memoized My Orders Selectors
// ======================

/**
 * Select my orders with transformed data
 */
export const selectMyOrdersTransformed = createSelector(
  [selectP2PBuySellState, selectMyOrdersState],
  (buySellState, myOrdersState) => {
    const orders = buySellState.orders;
    const myOrders = myOrdersState.orders || [];

    return {
      orders,
      myOrders,
      loading: buySellState.loading || myOrdersState.loading,
    };
  }
);

// ======================
// Memoized Dashboard Data Selector
// ======================

/**
 * Select all dashboard data in one optimized selector
 */
export const selectP2PDashboardData = createSelector(
  [
    selectWalletBalance,
    selectMatchedTrades,
    selectTransactionSummaryWithLoading,
    selectAuthState,
  ],
  (walletBalance, matchedTrades, transactionSummary, authState) => ({
    balance: walletBalance.balance,
    currency: walletBalance.currency,
    walletLoading: walletBalance.loading,
    matchedTrades: matchedTrades.data,
    matchedTradesLoading: matchedTrades.loading,
    transactionSummary: transactionSummary.summary,
    summaryLoading: transactionSummary.loading,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
  })
);

// ======================
// Memoized P2P Center Data Selector
// ======================

/**
 * Select all P2P Center data in one optimized selector
 */
export const selectP2PCenterData = createSelector(
  [
    selectWalletData,
    selectTransactionSummary,
    selectMyOrdersTransformed,
    selectAuthState,
  ],
  (wallets, summary, ordersData, authState) => ({
    wallets,
    walletsLoading: !wallets,
    summary,
    orders: ordersData.orders,
    myOrders: ordersData.myOrders,
    ordersLoading: ordersData.loading,
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
  })
);

// ======================
// Memoized Filter & Search Selectors
// ======================

/**
 * Create a selector factory for filtered trades
 */
export const makeSelectFilteredTrades = () =>
  createSelector(
    [(state: RootState, filters: any) => filters, selectUserTradesResults],
    (filters, trades) => {
      let filtered = [...trades];

      // Apply type filter
      if (filters.type && filters.type !== "all" && filters.type !== "Type") {
        filtered = filtered.filter(
          (trade) =>
            trade.order_type?.toLowerCase() === filters.type.toLowerCase()
        );
      }

      // Apply status filter
      if (
        filters.status &&
        filters.status !== "all" &&
        filters.status !== "Status"
      ) {
        filtered = filtered.filter(
          (trade) =>
            trade.status?.toLowerCase() === filters.status.toLowerCase()
        );
      }

      // Apply currency filter
      if (filters.currency && filters.currency !== "usdt") {
        filtered = filtered.filter(
          (trade) =>
            trade.currency?.toLowerCase() === filters.currency.toLowerCase()
        );
      }

      // Apply date filter (simplified - would need actual implementation)
      if (filters.date && filters.date !== "all" && filters.date !== "Date") {
        // Implement date filtering logic based on your requirements
      }

      return filtered;
    }
  );

/**
 * Create a selector factory for searched orders
 */
export const makeSelectSearchedOrders = () =>
  createSelector(
    [
      (state: RootState, searchQuery: string) => searchQuery,
      selectAllP2POrders,
    ],
    (searchQuery, orders) => {
      if (!searchQuery || searchQuery.trim() === "") {
        return orders;
      }

      const query = searchQuery.toLowerCase();

      const filteredBuyOrders = {
        ...orders.buy_orders,
        results: orders.buy_orders.results.filter(
          (order: any) =>
            order.advertiser_name?.toLowerCase().includes(query) ||
            order.payment_method?.toLowerCase().includes(query) ||
            order.currency?.toLowerCase().includes(query)
        ),
      };

      const filteredSellOrders = {
        ...orders.sell_orders,
        results: orders.sell_orders.results.filter(
          (order: any) =>
            order.advertiser_name?.toLowerCase().includes(query) ||
            order.payment_method?.toLowerCase().includes(query) ||
            order.currency?.toLowerCase().includes(query)
        ),
      };

      return {
        buy_orders: filteredBuyOrders,
        sell_orders: filteredSellOrders,
        totalBuyCount: filteredBuyOrders.results.length,
        totalSellCount: filteredSellOrders.results.length,
      };
    }
  );
