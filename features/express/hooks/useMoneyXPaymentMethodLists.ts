"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicPaymentMethods } from "@/features/p2p/api";
import { normalizePublicPaymentMethods } from "@/features/express/utils/normalizePublicPaymentMethods";
import {
  getMoneyXProviderId,
  matchMoneyXMethodById,
  pickOtherMoneyXMethod,
} from "@/features/express/utils/moneyXPaymentMethodUtils";

export type MoneyXPaymentFlow = "deposit" | "withdrawal";

/**
 * Money X only — mirrors mobile `money_x_page.dart`:
 * - `_allPaymentMethods`: full unscoped cache
 * - `_fromPaymentMethods`: full list OR scoped when To changes
 * - `_toPaymentMethods`: scoped by From provider id
 */
export function useMoneyXPaymentMethodLists({
  flow = "deposit",
}: { flow?: MoneyXPaymentFlow } = {}) {
  const allFromMethodsRef = useRef<any[]>([]);
  const lastToFetchForFromRef = useRef<string | null>(null);
  const lastFromFetchForToRef = useRef<string | null>(null);
  const toFetchSeq = useRef(0);
  const fromScopedFetchSeq = useRef(0);

  const [fromMethods, setFromMethods] = useState<any[]>([]);
  const [toMethods, setToMethods] = useState<any[]>([]);
  const [fromLoading, setFromLoading] = useState(true);
  const [toLoading, setToLoading] = useState(false);
  const [fromError, setFromError] = useState<string | null>(null);
  const [toError, setToError] = useState<string | null>(null);
  const [allFromReady, setAllFromReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFromLoading(true);
    setFromError(null);

    getPublicPaymentMethods()
      .then((data) => {
        if (cancelled) return;
        const normalized = normalizePublicPaymentMethods(data);
        allFromMethodsRef.current = normalized;
        setFromMethods(normalized);
        setAllFromReady(true);
      })
      .catch((err: any) => {
        if (cancelled) return;
        allFromMethodsRef.current = [];
        setFromMethods([]);
        setFromError(err?.message || "Failed to load payment methods");
      })
      .finally(() => {
        if (!cancelled) setFromLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const restoreFromFullList = useCallback(() => {
    lastFromFetchForToRef.current = null;
    setFromMethods(allFromMethodsRef.current);
  }, []);

  /** To list: ?flow=deposit&selected_provider_id=<fromProviderId> */
  const refreshToForFrom = useCallback(
    async (
      fromPayment: any | null,
      currentToPayment: any | null,
      options?: { force?: boolean }
    ): Promise<any | null> => {
      const fromId = getMoneyXProviderId(fromPayment);
      if (!fromId) {
        setToMethods([]);
        return null;
      }

      const force = options?.force ?? false;
      if (!force && fromId === lastToFetchForFromRef.current) {
        return currentToPayment;
      }

      const seq = ++toFetchSeq.current;
      setToLoading(true);
      setToError(null);

      try {
        const data = await getPublicPaymentMethods({
          flow,
          selected_provider_id: fromId,
        });
        if (seq !== toFetchSeq.current) return currentToPayment;

        const scoped = normalizePublicPaymentMethods(data);
        lastToFetchForFromRef.current = fromId;

        const previousToId = getMoneyXProviderId(currentToPayment);
        let matchedTo = matchMoneyXMethodById(scoped, previousToId);
        if (matchedTo && getMoneyXProviderId(matchedTo) === fromId) {
          matchedTo = null;
        }
        matchedTo ??= pickOtherMoneyXMethod(scoped, fromId);

        setToMethods(scoped);
        return matchedTo;
      } catch (err: any) {
        if (seq !== toFetchSeq.current) return currentToPayment;
        setToMethods([]);
        setToError(err?.message || "Failed to load destination payment methods");
        return null;
      } finally {
        if (seq === toFetchSeq.current) setToLoading(false);
      }
    },
    [flow]
  );

  /** From list when To changes: ?flow=deposit&selected_provider_id=<toProviderId> */
  const refreshFromForTo = useCallback(
    async (
      toPayment: any | null,
      currentFromPayment: any | null,
      options?: { force?: boolean }
    ): Promise<any | null> => {
      const toId = getMoneyXProviderId(toPayment);
      if (!toId) return currentFromPayment;

      const force = options?.force ?? false;
      if (!force && toId === lastFromFetchForToRef.current) {
        return currentFromPayment;
      }

      const seq = ++fromScopedFetchSeq.current;
      setFromLoading(true);
      setFromError(null);

      try {
        const data = await getPublicPaymentMethods({
          flow,
          selected_provider_id: toId,
        });
        if (seq !== fromScopedFetchSeq.current) return currentFromPayment;

        const scoped = normalizePublicPaymentMethods(data);
        lastFromFetchForToRef.current = toId;

        const previousFromId = getMoneyXProviderId(currentFromPayment);
        let matchedFrom = matchMoneyXMethodById(scoped, previousFromId);
        if (matchedFrom && getMoneyXProviderId(matchedFrom) === toId) {
          matchedFrom = null;
        }
        matchedFrom ??= pickOtherMoneyXMethod(scoped, toId);

        setFromMethods(scoped);
        return matchedFrom;
      } catch (err: any) {
        if (seq !== fromScopedFetchSeq.current) return currentFromPayment;
        setFromError(err?.message || "Failed to load payment methods");
        return currentFromPayment;
      } finally {
        if (seq === fromScopedFetchSeq.current) setFromLoading(false);
      }
    },
    [flow]
  );

  const matchFromInAll = useCallback((fromPayment: any | null) => {
    const fromId = getMoneyXProviderId(fromPayment);
    if (!fromId) return fromPayment;
    return (
      matchMoneyXMethodById(fromMethods, fromId) ??
      matchMoneyXMethodById(allFromMethodsRef.current, fromId) ??
      fromPayment
    );
  }, [fromMethods]);

  return {
    fromMethods,
    toMethods,
    allFromMethods: allFromMethodsRef.current,
    allFromReady,
    fromLoading,
    toLoading,
    fromError,
    toError,
    isLoading: fromLoading || toLoading,
    restoreFromFullList,
    refreshToForFrom,
    refreshFromForTo,
    matchFromInAll,
    getProviderId: getMoneyXProviderId,
  };
}
