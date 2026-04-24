/**
 * usePublicPaymentMethods
 *
 * A shared hook that:
 *  1. Dispatches `fetchPublicPaymentMethods` on mount (served instantly from
 *     in-memory cache if data is <5 min old — zero network cost).
 *  2. Sets up a 5-minute interval that fires a background refetch with
 *     `forceRefresh: true`, keeping the data fresh without blocking the UI.
 *  3. Cleans up the interval on unmount.
 *
 * Usage (replaces every raw `fetch(…/public/payment-methods/…)` call):
 *
 *   import { usePublicPaymentMethods } from "@/hooks/usePublicPaymentMethods";
 *
 *   const { data, loading, error, lastFetchedAt } = usePublicPaymentMethods();
 */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicPaymentMethods } from "@/features/p2p/slices/paymentMethodsSlice";
import type { AppDispatch } from "@/store";

const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function usePublicPaymentMethods() {
  const dispatch = useDispatch<AppDispatch>();

  const publicPaymentMethods = useSelector(
    (state: any) => state.paymentMethods?.publicPaymentMethods
  );
  const publicMethodsLoading = useSelector(
    (state: any) => state.paymentMethods?.publicMethodsLoading
  );
  const publicMethodsError = useSelector(
    (state: any) => state.paymentMethods?.publicMethodsError
  );
  const lastFetchedAt = useSelector(
    (state: any) => state.paymentMethods?.publicMethodsLastFetchedAt ?? null
  );

  useEffect(() => {
    // Initial fetch — served from in-memory cache if still fresh
    dispatch(fetchPublicPaymentMethods());

    // Background refetch every 5 minutes
    const intervalId = setInterval(() => {
      dispatch(fetchPublicPaymentMethods({ forceRefresh: true }));
    }, REFETCH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  return {
    data: publicPaymentMethods,
    loading: publicMethodsLoading,
    error: publicMethodsError,
    lastFetchedAt,
  };
}
