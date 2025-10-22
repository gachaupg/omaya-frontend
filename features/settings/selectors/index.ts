/**
 * Memoized Redux Selectors for Settings Feature
 *
 * Performance Benefits:
 * - Prevents unnecessary re-computations
 * - Reduces component re-renders
 * - Optimizes settings data access
 */

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/rootReducer";

// Base selector
export const selectSettingsState = (state: RootState) => state.settings;
export const selectReferralState = (state: RootState) => state.referral;
export const selectReferralWalletState = (state: RootState) =>
  state.referralWallet;

/**
 * Select user profile
 */
export const selectUserProfile = createSelector(
  [selectSettingsState],
  (settingsState) => ({
    profile: settingsState.profile,
    loading: settingsState.loading,
  })
);

/**
 * Select security settings
 */
export const selectSecuritySettings = createSelector(
  [selectSettingsState],
  (settingsState) => ({
    security: settingsState.security,
    loading: settingsState.loading,
  })
);

/**
 * Select all settings data
 */
export const selectAllSettings = createSelector(
  [selectSettingsState],
  (settingsState) => ({
    profile: settingsState.profile,
    security: settingsState.security,
    theme: settingsState.theme,
    privacy: settingsState.privacy,
    loading: settingsState.loading,
    error: settingsState.error,
  })
);

/**
 * Select referral data
 */
export const selectReferralData = createSelector(
  [selectReferralState, selectReferralWalletState],
  (referralState, walletState) => ({
    referredUsers: referralState.referredUsers || [],
    referralWallet: walletState.data,
    loading: referralState.loading || walletState.loading,
  })
);
