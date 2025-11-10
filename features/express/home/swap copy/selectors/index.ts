/**
 * Memoized Redux Selectors for Swap Feature
 *
 * Performance Benefits:
 * - Prevents unnecessary re-computations
 * - Reduces component re-renders
 * - Optimizes asset filtering
 */

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/rootReducer";

// Base selector
export const selectSwapState = (state: RootState) => state.swap;

/**
 * Select supported assets
 */
export const selectSupportedAssets = createSelector(
  [selectSwapState],
  (swapState) => ({
    assets: swapState.supportedAssets || [],
    loading: swapState.loading,
  })
);

/**
 * Select swap estimate
 */
export const selectSwapEstimate = createSelector(
  [selectSwapState],
  (swapState) => ({
    estimate: swapState.estimate,
    loading: swapState.estimateLoading,
    error: swapState.estimateError,
  })
);

/**
 * Select swap response
 */
export const selectSwapResponse = createSelector(
  [selectSwapState],
  (swapState) => ({
    response: swapState.swapResponse,
    loading: swapState.swapLoading,
    error: swapState.swapError,
  })
);

/**
 * Select all swap data
 */
export const selectSwapData = createSelector(
  [selectSupportedAssets, selectSwapEstimate],
  (assets, estimate) => ({
    supportedAssets: assets.assets,
    estimate: estimate.estimate,
    loading: assets.loading || estimate.loading,
  })
);
