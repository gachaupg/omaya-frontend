/**
 * Memoized Redux Selectors for Exchange Feature
 *
 * Performance Benefits:
 * - Prevents unnecessary re-computations
 * - Reduces component re-renders
 * - Optimizes expensive calculations
 */

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/rootReducer";

// Base selectors
export const selectExchangeState = (state: RootState) => state.exchange;
export const selectPaymentState = (state: RootState) => state.payment;

/**
 * Select favorite assets
 */
export const selectFavoriteAssets = createSelector(
  [selectExchangeState],
  (exchangeState) => ({
    assets: exchangeState.favoriteAssets || [],
    loading: exchangeState.loading,
  })
);

/**
 * Select exchange statistics
 */
export const selectExchangeStatistics = createSelector(
  [selectExchangeState],
  (exchangeState) => ({
    statistics: exchangeState.statistics,
    loading: exchangeState.loading,
  })
);

/**
 * Select all exchange data
 */
export const selectExchangeData = createSelector(
  [selectFavoriteAssets, selectExchangeStatistics],
  (favoriteAssets, statistics) => ({
    favoriteAssets: favoriteAssets.assets,
    statistics: statistics.statistics,
    loading: favoriteAssets.loading || statistics.loading,
  })
);

/**
 * Select payment methods
 */
export const selectPaymentMethods = createSelector(
  [selectPaymentState],
  (paymentState) => ({
    methods: paymentState.paymentMethods || [],
    loading: paymentState.loading,
  })
);
