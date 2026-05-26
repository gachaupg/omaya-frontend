"use client";
import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchWallets } from "../slices/walletSlice";
import { fetchMatchedTrades } from "../slices/matchedTradesSlice";
import { fetchTransactionSummary } from "../slices/transactionSummarySlice";
import { logger } from "@/lib/logger";

interface P2PDataProviderProps {
  children: ReactNode;
}

/**
 * P2PDataProvider - Centralized data fetching for P2P feature
 *
 * Fetches common P2P data once at the layout level. Never blocks the UI:
 * wallet and dashboard render immediately (persisted Redux + REST/WS fallbacks).
 * Slow matched-trades or transaction-summary calls must not hide the wallet.
 */
export const P2PDataProvider = ({ children }: P2PDataProviderProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: walletsData, loading: walletsLoading } = useSelector(
    (state: RootState) => state.wallets
  );
  const { data: tradesData, loading: tradesLoading } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const transactionSummary = useSelector(
    (state: RootState) => state.transactionSummary
  );
  const summaryData = transactionSummary.summary;
  const summaryLoading = transactionSummary.loading;

  useEffect(() => {
    if (!isAuthenticated) {
      logger.debug(
        "[P2PDataProvider] User not authenticated, skipping data fetch"
      );
      return;
    }

    const needsWallets = !walletsData && !walletsLoading;
    const needsTrades = !tradesData && !tradesLoading;
    const needsSummary = !summaryData && !summaryLoading;

    if (!needsWallets && !needsTrades && !needsSummary) {
      logger.debug(
        "[P2PDataProvider] P2P data already available, using cached data"
      );
      return;
    }

    logger.info("[P2PDataProvider] Fetching P2P data (non-blocking)...", {
      fetchingWallets: needsWallets,
      fetchingTrades: needsTrades,
      fetchingSummary: needsSummary,
    });

    // Wallet first — dashboard wallet card should populate ASAP
    if (needsWallets) {
      dispatch(fetchWallets()).catch((error) => {
        logger.error(
          "[P2PDataProvider] Wallet fetch failed (non-blocking)",
          error
        );
      });
    }

    // Trades + summary in parallel; failures do not block layout
    const secondary: Promise<unknown>[] = [];
    if (needsTrades) {
      secondary.push(
        dispatch(fetchMatchedTrades(1)).catch((error) => {
          logger.error(
            "[P2PDataProvider] Trades fetch failed (non-blocking)",
            error
          );
          return null;
        })
      );
    }
    if (needsSummary) {
      secondary.push(
        dispatch(fetchTransactionSummary()).catch((error) => {
          logger.error(
            "[P2PDataProvider] Summary fetch failed (non-blocking)",
            error
          );
          return null;
        })
      );
    }

    if (secondary.length > 0) {
      Promise.allSettled(secondary).then((results) => {
        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;
        logger.info(
          `[P2PDataProvider] Secondary fetch completed: ${successful} succeeded, ${failed} failed`
        );
      });
    }
  }, [
    isAuthenticated,
    dispatch,
    walletsData,
    tradesData,
    summaryData,
    walletsLoading,
    tradesLoading,
    summaryLoading,
  ]);

  return <>{children}</>;
};
