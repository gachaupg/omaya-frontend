"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMoneyXPaymentProviders } from "@/features/moneyX/api";
import { normalizeMoneyXPaymentProviders } from "@/features/moneyX/utils/normalizeMoneyXPaymentProviders";
import {
  getMoneyXProviderId,
  matchMoneyXMethodById,
  pickOtherMoneyXMethod,
} from "@/features/express/utils/moneyXPaymentMethodUtils";

export type MoneyXPaymentFlow = "deposit" | "withdrawal";

/**
 * Money X payment provider lists:
 * - Initial load: GET /api/moneyx/payment-providers/ (sender dropdown)
 * - After sender selected: GET /api/moneyx/payment-providers/?sender_provider_id=<uuid> (receiver dropdown)
 */
export function useMoneyXPaymentMethodLists({
  flow: _flow = "deposit",
}: { flow?: MoneyXPaymentFlow } = {}) {
  const allFromMethodsRef = useRef<any[]>([]);
  const lastToFetchForFromRef = useRef<string | null>(null);
  const toFetchSeq = useRef(0);

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

    getMoneyXPaymentProviders()
      .then((data) => {
        if (cancelled) return;
        const normalized = normalizeMoneyXPaymentProviders(data);
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
    setFromMethods(allFromMethodsRef.current);
  }, []);

  /** Receiver list: ?sender_provider_id=<fromProviderId> */
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
        const data = await getMoneyXPaymentProviders(fromId);
        if (seq !== toFetchSeq.current) return currentToPayment;

        const scoped = normalizeMoneyXPaymentProviders(data);
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
    []
  );

  /** Sender list stays the full unscoped list; only reconcile selection locally. */
  const refreshFromForTo = useCallback(
    async (
      toPayment: any | null,
      currentFromPayment: any | null,
      _options?: { force?: boolean }
    ): Promise<any | null> => {
      const toId = getMoneyXProviderId(toPayment);
      if (!toId) return currentFromPayment;

      const previousFromId = getMoneyXProviderId(currentFromPayment);
      let matchedFrom = matchMoneyXMethodById(fromMethods, previousFromId);
      if (matchedFrom && getMoneyXProviderId(matchedFrom) === toId) {
        matchedFrom = null;
      }
      matchedFrom ??= pickOtherMoneyXMethod(fromMethods, toId);
      return matchedFrom;
    },
    [fromMethods]
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
