"use client";

import React from "react";
import AllTransactions from "./AllTransactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

/** Exchange tab — same unified API and row layout as All (`type=exchange`). */
const ExchangeTransactions = () => {
  const { t } = useDashboardI18n();

  return (
    <AllTransactions
      key="dashboard-exchange-transactions"
      apiType="exchange"
      emptyTitle={t(
        "transactions.noTransactions",
        "No Exchange Transactions Found"
      )}
      emptyMessage={t(
        "transactions.noTransactions",
        "There are currently no exchange transactions to display. Please check back later or try adjusting your filters."
      )}
    />
  );
};

export default ExchangeTransactions;
