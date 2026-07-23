"use client";

import type { AllTransactionItem } from "@/features/transactions/api";
import { getDashboardTransactionTypeSide } from "@/lib/utils/dashboardTransactionDisplay";

type TransactionTypeSideCellProps = {
  tx: Pick<AllTransactionItem, "type" | "sub_type">;
};

const cellClassName =
  "text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap";

export function TransactionTypeCell({ tx }: TransactionTypeSideCellProps) {
  const { typeLabel } = getDashboardTransactionTypeSide(tx);

  return <span className={cellClassName}>{typeLabel}</span>;
}

export function TransactionSideCell({ tx }: TransactionTypeSideCellProps) {
  const { sideLabel } = getDashboardTransactionTypeSide(tx);

  return <span className={`${cellClassName} uppercase`}>{sideLabel}</span>;
}
