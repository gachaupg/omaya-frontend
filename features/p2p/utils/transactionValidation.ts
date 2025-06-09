// File: features/p2p/utils/transactionValidation.ts
import { FinancialCalculator } from "@/lib/utils/financial";
import {
  TRANSACTION_LIMITS,
  UserLimits,
  TransactionLimits,
} from "@/lib/businessRules";

export interface ValidationContext {
  amount: string;
  currency: string;
  network: string;
  userTier: "unverified" | "verified" | "premium";
  userBalance: string;
  dailySpent: string;
  monthlySpent: string;
  transactionType: "deposit" | "withdrawal";
}

export interface TransactionValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    message: string;
    code: string;
  }>;
}

export class TransactionValidator {
  static validateTransaction(
    context: ValidationContext
  ): TransactionValidationResult {
    const result: TransactionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Get limits for user tier
    const limits = TRANSACTION_LIMITS[context.currency]?.[context.userTier];
    if (!limits) {
      result.errors.push({
        field: "currency",
        message: "Unsupported currency for your account tier",
        code: "UNSUPPORTED_CURRENCY",
      });
      result.isValid = false;
      return result;
    }

    // Validate amount format
    if (!FinancialCalculator.isValidAmount(context.amount)) {
      result.errors.push({
        field: "amount",
        message: "Invalid amount format",
        code: "INVALID_AMOUNT_FORMAT",
      });
      result.isValid = false;
    }

    // Check minimum amount
    if (FinancialCalculator.isLessThan(context.amount, limits.min)) {
      result.errors.push({
        field: "amount",
        message: `Minimum ${context.transactionType} amount is ${limits.min} ${context.currency}`,
        code: "BELOW_MINIMUM",
      });
      result.isValid = false;
    }

    // Check maximum amount
    if (FinancialCalculator.isGreaterThan(context.amount, limits.max)) {
      result.errors.push({
        field: "amount",
        message: `Maximum ${context.transactionType} amount is ${limits.max} ${context.currency}`,
        code: "ABOVE_MAXIMUM",
      });
      result.isValid = false;
    }

    // Check daily limits
    const newDailyTotal = FinancialCalculator.add(
      context.dailySpent,
      context.amount
    );
    if (FinancialCalculator.isGreaterThan(newDailyTotal, limits.dailyLimit)) {
      result.errors.push({
        field: "amount",
        message: `Daily limit of ${limits.dailyLimit} ${context.currency} would be exceeded`,
        code: "DAILY_LIMIT_EXCEEDED",
      });
      result.isValid = false;
    }

    // Check monthly limits
    const newMonthlyTotal = FinancialCalculator.add(
      context.monthlySpent,
      context.amount
    );
    if (
      FinancialCalculator.isGreaterThan(newMonthlyTotal, limits.monthlyLimit)
    ) {
      result.errors.push({
        field: "amount",
        message: `Monthly limit of ${limits.monthlyLimit} ${context.currency} would be exceeded`,
        code: "MONTHLY_LIMIT_EXCEEDED",
      });
      result.isValid = false;
    }

    // Check balance for withdrawals
    if (context.transactionType === "withdrawal") {
      if (
        FinancialCalculator.isGreaterThan(context.amount, context.userBalance)
      ) {
        result.errors.push({
          field: "amount",
          message: "Insufficient balance",
          code: "INSUFFICIENT_BALANCE",
        });
        result.isValid = false;
      }
    }

    // Add warnings for high amounts
    const highAmountThreshold = FinancialCalculator.multiply(limits.max, "0.8");
    if (
      FinancialCalculator.isGreaterThan(context.amount, highAmountThreshold)
    ) {
      result.warnings.push({
        message:
          "Large transaction detected. Please verify all details carefully.",
        code: "HIGH_AMOUNT_WARNING",
      });
    }

    return result;
  }
}
