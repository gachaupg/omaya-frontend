"use client";

import React from "react";
import AllTransactions from "./AllTransactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

/** MoneyX tab — unified transactions API (`type=moneyx`) with View Details. */
const MoneyXTransactions = () => {
  const { t } = useDashboardI18n();

  return (
    <AllTransactions
      key="dashboard-moneyx-transactions"
      apiType="moneyx"
      emptyTitle={t("transactions.noMoneyXTransactions", "No MoneyX Transactions Found")}
      emptyMessage={t(
        "transactions.noMoneyXTransactionsMessage",
        "There are currently no MoneyX transactions to display. Please check back later or try adjusting your filters."
      )}
    />
  );
};

export default MoneyXTransactions;
