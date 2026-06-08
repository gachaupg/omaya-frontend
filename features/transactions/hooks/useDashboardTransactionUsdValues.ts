"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AllTransactionItem } from "@/features/transactions/api";
import {
  fetchTransactionUsdtEquivalents,
  resolveUsdtLookupParams,
} from "@/lib/utils/transactionUsdtConversion";

/** Per-transaction USDT equivalent (displayed as USD value; 1 USDT ≈ $1). */
export function useDashboardTransactionUsdValues(
  transactions: AllTransactionItem[]
): Record<string, number> {
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  const fetchKey = useMemo(
    () =>
      transactions
        .map((tx) => {
          const params = resolveUsdtLookupParams(tx);
          return params
            ? `${tx.id}:${params.amount}:${params.from_currency}:${params.from_network}:${params.type}`
            : "";
        })
        .filter(Boolean)
        .join(","),
    [transactions]
  );

  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!fetchKey) {
      setValues((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    let cancelled = false;
    void fetchTransactionUsdtEquivalents(transactionsRef.current).then((next) => {
      if (!cancelled) setValues(next);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  return values;
}
