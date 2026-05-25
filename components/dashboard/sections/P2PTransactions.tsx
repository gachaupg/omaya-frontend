"use client";

import React from "react";
import AllTransactions from "./AllTransactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

/** P2P buy/sell tab — unified API with trade rows only (no deposit/withdrawal). */
const P2PTransactions = () => {
  const { t } = useDashboardI18n();

  return (
    <AllTransactions
      key="dashboard-p2p-transactions"
      apiType="p2p"
      excludeSubTypes={["deposit", "withdrawal"]}
      emptyTitle={t("transactions.noP2PTransactions", "No P2P Transactions Found")}
      emptyMessage={t(
        "transactions.noP2PTransactionsMessage",
        "There are currently no P2P transactions to display. Please check back later or try adjusting your filters."
      )}
    />
  );
};

export default P2PTransactions;
