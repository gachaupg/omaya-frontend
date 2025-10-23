// File: features/p2p/hooks/useTransactionValidation.ts
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  TransactionValidator,
  ValidationContext,
} from "../utils/transactionValidation";
import { useCallback } from "react";

import { logger } from '@/lib/utils/logger';

export const useTransactionValidation = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: wallets } = useSelector((state: RootState) => state.wallets);
  const { summary } = useSelector(
    (state: RootState) => state.transactionSummary
  );

  const validateTransaction = useCallback(
    (
      amount: number,
      currency: string,
      network: string,
      transactionType: "deposit" | "withdrawal"
    ) => {
      const userBalance =
        wallets?.wallet?.currency === currency ? wallets.wallet.balance : "0";

      // Calculate daily spent from approved transactions
      const pendingWithdrawals = summary?.total_pending_p2p_withdrawals || 0;
      const pendingSellOrders =
        summary?.total_sell_orders_by_status?.pending || 0;
      const dailySpent = (pendingWithdrawals + pendingSellOrders).toString();

      // Calculate monthly spent (same as daily for now, as we don't have monthly data)
      const monthlySpent = dailySpent;

      const context: ValidationContext = {
        amount: amount.toString(),
        currency,
        network,
        userTier: user?.is_verified ? "verified" : "unverified",
        userBalance,
        dailySpent,
        monthlySpent,
        transactionType,
      };

      logger.debug('p2p', "Final Validation Context:", context);

      return TransactionValidator.validateTransaction(context);
    },
    [user, wallets, summary]
  );

  return { validateTransaction };
};
