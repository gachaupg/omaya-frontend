"use client";

import React from "react";
import AllTransactions from "./AllTransactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

type TransactionTypeFilter = "deposit" | "withdrawal" | "all";

interface P2PWithdrawalDepositTransactionsProps {
  /** Filter by transaction type — "deposit" | "withdrawal" | "all" */
  filterByType?: TransactionTypeFilter;
}

const P2PWithdrawalDepositTransactions = ({
  filterByType = "all",
}: P2PWithdrawalDepositTransactionsProps) => {
  const { t } = useDashboardI18n();

  const includeSubTypes =
    filterByType === "all" ? ["deposit", "withdrawal"] : [filterByType];

  const emptyTitle =
    filterByType === "all"
      ? t(
          "transactions.noP2PWithdrawalDeposit",
          "No P2P Withdrawal/Deposit Transactions Found"
        )
      : t(
          "transactions.noP2PWithdrawalDepositFiltered",
          `No ${filterByType} transactions found`
        );

  const emptyMessage =
    filterByType === "all"
      ? t(
          "transactions.noP2PWithdrawalDepositMessage",
          "There are currently no P2P withdrawal or deposit transactions to display."
        )
      : t(
          "transactions.noP2PWithdrawalDepositFilteredMessage",
          `There are currently no ${filterByType} transactions to display.`
        );

  return (
    <AllTransactions
      key={`dashboard-p2p-wd-${filterByType}`}
      apiType="p2p"
      includeSubTypes={includeSubTypes}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
    />
  );
};

export default P2PWithdrawalDepositTransactions;
