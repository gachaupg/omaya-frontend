"use client";

import React from "react";
import AllTransactions from "./AllTransactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

/** Swap tab — unified transactions API (`type=swap`) with View Details. */
const SwapTransactions = () => {
  const { t } = useDashboardI18n();

  return (
    <AllTransactions
      key="dashboard-swap-transactions"
      apiType="swap"
      emptyTitle={t("swapTransactions.noTransactionsFound", "No Swap Transactions Found")}
      emptyMessage={t(
        "swapTransactions.noTransactionsDescription",
        "There are currently no swap transactions to display. Please check back later or try adjusting your filters."
      )}
    />
  );
};

export default SwapTransactions;
