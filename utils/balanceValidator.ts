import { TransactionSummary } from "@/features/p2p/types";

interface BalanceValidationResult {
  isValid: boolean;
  availableBalance: number;
  errorMessage?: string;
}

interface BalanceValidationParams {
  walletBalance: number;
  transactionSummary: TransactionSummary | null;
  amount: number;
  minAmount?: number;
  maxAmount?: number;
  tradeType?: "buy" | "sell";
}

export const validateBalance = ({
  walletBalance,
  transactionSummary,
  amount,
  minAmount = 0,
  maxAmount = Infinity,
  tradeType = "buy",
}: BalanceValidationParams): BalanceValidationResult => {
  // Calculate available balance
  const pendingWithdrawals =
    transactionSummary?.total_pending_exchange_withdrawals || 0;
  const pendingSellOrders =
    transactionSummary?.total_sell_orders_by_status?.pending || 0;
  const availableBalance = Math.max(
    0,
    walletBalance - pendingWithdrawals - pendingSellOrders
  );

  // For sell orders, check against available balance
  if (tradeType === "sell" && amount > availableBalance) {
    return {
      isValid: false,
      availableBalance,
      errorMessage: `Insufficient balance. Available: ${availableBalance.toFixed(
        2
      )} USDT`,
    };
  }

  // Check minimum amount
  if (amount < minAmount) {
    return {
      isValid: false,
      availableBalance,
      errorMessage: `Minimum amount is ${minAmount} USDT`,
    };
  }

  // Check maximum amount
  if (amount > maxAmount) {
    return {
      isValid: false,
      availableBalance,
      errorMessage: `Maximum amount is ${maxAmount} USDT`,
    };
  }

  return {
    isValid: true,
    availableBalance,
  };
};
