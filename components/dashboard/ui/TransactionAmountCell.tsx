"use client";

import React from "react";
import type { AllTransactionItem } from "@/features/transactions/api";
import { getDashboardTransactionAmounts } from "@/lib/utils/dashboardTransactionAmounts";

type TransactionAmountCellProps = {
  tx: AllTransactionItem;
  variant: "asset" | "usd";
  /** Deposit-style green vs withdrawal red (exchange asset column). */
  amountTone?: "positive" | "negative" | "neutral";
};

export function TransactionAmountCell({
  tx,
  variant,
  amountTone = "neutral",
}: TransactionAmountCellProps) {
  const { assetAmount, usdValue } = getDashboardTransactionAmounts(tx);
  const value = variant === "asset" ? assetAmount : usdValue;

  if (!value) {
    return <span className="text-sm text-gray-400 dark:text-[#788099]">—</span>;
  }

  const toneClass =
    variant === "asset" && amountTone === "positive"
      ? "text-[#1D8751]"
      : variant === "asset" && amountTone === "negative"
        ? "text-red-500 dark:text-red-400"
        : variant === "usd"
          ? "text-gray-800 dark:text-[#E8E9ED]"
          : "text-gray-900 dark:text-white";

  return (
    <span className={`text-sm sm:text-base font-semibold whitespace-nowrap ${toneClass}`}>
      {value}
    </span>
  );
}
