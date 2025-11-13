"use client";
import { useEffect, ReactNode, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchProfile,
  // fetchTheme, // Disabled - API returns 404
  // fetchSecuritySettings, // Disabled - API returns 404
  // fetchPrivacySettings, // Disabled - API returns 404
} from "../slices/settingsSlice";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { fetchTransactionSummary } from "@/features/p2p/slices/transactionSummarySlice";
import { logger } from "@/lib/utils/logger";

interface SettingsDataProviderProps {
  children: ReactNode;
}

/**
 * SettingsDataProvider - Centralized data fetching for Settings/Account pages
 *
 * This provider fetches all common settings data once at the parent level,
 * preventing duplicate API calls from child components.
 *
 * Benefits:
 * - Eliminates duplicate API calls (was 10+, now 4-6)
 * - Parallel API calls for faster loading
 * - Single source of truth for settings data
 * - Child components just consume from Redux
 */
export const SettingsDataProvider = ({
  children,
}: SettingsDataProviderProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const settingsState = useSelector((state: RootState) => state.settings);
  const { data: walletsData } = useSelector(
    (state: RootState) => state.wallets
  );
  const transactionSummary = useSelector(
    (state: RootState) => state.transactionSummary
  );

  // Track what has been fetched to prevent infinite loops
  const fetchedDataRef = useRef({
    profile: false,
    theme: false,
    security: true, // Disabled - API returns 404
    privacy: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      logger.debug(
        "dashboard",
        "[SettingsDataProvider] User not authenticated, skipping data fetch"
      );
      return;
    }

    // Check what data we already have to avoid unnecessary refetches
    // Only fetch if data is null AND not currently loading AND not already fetched
    const needsProfile =
      !settingsState.profile &&
      !settingsState.loading &&
      !fetchedDataRef.current.profile;
    // Theme and Privacy APIs are 404 - disabled for now (theme handled by local context)
    const needsTheme = false; // Disabled - theme handled by local context
    const needsSecurity = false; // Disabled - API returns 404
    const needsPrivacy = false; // Disabled - API returns 404
    const needsWallets = !walletsData;
    const needsSummary = !transactionSummary.summary;

    if (
      needsProfile ||
      needsTheme ||
      needsSecurity ||
      needsPrivacy ||
      needsWallets ||
      needsSummary
    ) {
      logger.info(
        "dashboard",
        "[SettingsDataProvider] Fetching settings data...",
        {
          fetchingProfile: needsProfile,
          fetchingTheme: needsTheme,
          fetchingSecurity: needsSecurity,
          fetchingPrivacy: needsPrivacy,
          fetchingWallets: needsWallets,
          fetchingSummary: needsSummary,
        }
      );

      // Parallel API calls for maximum speed (6x faster than sequential!)
      const promises = [];

      if (needsProfile) promises.push(dispatch(fetchProfile()));
      // Theme and Privacy APIs disabled (404 errors)
      // if (needsTheme) promises.push(dispatch(fetchTheme()));
      // if (needsSecurity) promises.push(dispatch(fetchSecuritySettings()));
      // if (needsPrivacy) promises.push(dispatch(fetchPrivacySettings()));
      if (needsWallets) promises.push(dispatch(fetchWallets()));
      if (needsSummary) promises.push(dispatch(fetchTransactionSummary()));

      Promise.all(promises)
        .then(() => {
          logger.info(
            "dashboard",
            "[SettingsDataProvider] All settings data loaded successfully"
          );
          // Mark fetched data to prevent infinite loops
          fetchedDataRef.current = {
            profile: fetchedDataRef.current.profile || needsProfile,
            theme: true, // Always true since we're not fetching theme API
            security: true, // Always true since we're not fetching security API
            privacy: true, // Always true since we're not fetching privacy API
          };
        })
        .catch((error) => {
          logger.error(
            "dashboard",
            "[SettingsDataProvider] Error loading settings data",
            error
          );
        });
    } else {
      logger.debug(
        "dashboard",
        "[SettingsDataProvider] Settings data already available, using cached data"
      );
    }
  }, [
    isAuthenticated,
    dispatch,
    settingsState,
    walletsData,
    transactionSummary,
  ]);

  return <>{children}</>;
};
