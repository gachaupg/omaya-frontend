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
  // For consistency with P2pProfile, treat available balance
  // as the same P2P wallet balance shown there.
  const availableBalance = walletBalance;

  // For sell orders, check against this balance
  if (tradeType === "sell" && amount > walletBalance) {
    return {
      isValid: false,
      availableBalance,
      errorMessage: `Insufficient balance. Available: ${walletBalance.toFixed(
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
