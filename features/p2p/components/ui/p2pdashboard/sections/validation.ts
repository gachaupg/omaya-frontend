import { validateWalletAddress } from "@/lib/addressValidaion";
import {
  TransactionValidator,
  ValidationContext,
} from "@/features/p2p/utils/transactionValidation";

export interface ValidationError {
  field: string;
  message: string;
}

export interface DepositFormData {
  amount: string;
  file: File | null;
  confirmPayment: boolean;
}

export interface WithdrawalFormData extends DepositFormData {
  walletAddress: string;
}

export const validateDepositForm = (
  data: DepositFormData,
  currency?: string,
  networkType?: string,
  transactionValidation?: (
    amount: number,
    currency: string,
    network: string,
    type: "deposit"
  ) => ReturnType<typeof TransactionValidator.validateTransaction>
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Amount validation
  if (!data.amount || data.amount.trim() === "") {
    errors.push({
      field: "amount",
      message: "Amount is required",
    });
  } else if (isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.push({
      field: "amount",
      message: "Please enter a valid amount greater than 0",
    });
  } else if (currency && networkType && transactionValidation) {
    // Transaction validation
    const validationResult = transactionValidation(
      Number(data.amount),
      currency,
      networkType,
      "deposit"
    );

    if (!validationResult.isValid) {
      // Add all validation errors from the transaction validation
      validationResult.errors.forEach((error) => {
        errors.push({
          field: error.field,
          message: error.message,
        });
      });
    }
  }

  // File validation
  if (!data.file) {
    errors.push({
      field: "file",
      message: "Payment proof is required",
    });
  }

  // Payment confirmation validation
  if (!data.confirmPayment) {
    errors.push({
      field: "confirmPayment",
      message: "Please confirm that you have sent the payment",
    });
  }

  return errors;
};

export const validateWithdrawalForm = (
  data: WithdrawalFormData,
  networkType?: string,
  currency?: string,
  transactionValidation?: (
    amount: number,
    currency: string,
    network: string,
    type: "withdrawal"
  ) => ReturnType<typeof TransactionValidator.validateTransaction>
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Amount validation
  if (!data.amount || data.amount.trim() === "") {
    errors.push({
      field: "amount",
      message: "Amount is required",
    });
  } else if (isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.push({
      field: "amount",
      message: "Please enter a valid amount greater than 0",
    });
  } else if (currency && networkType && transactionValidation) {
    // Transaction validation
    const validationResult = transactionValidation(
      Number(data.amount),
      currency,
      networkType,
      "withdrawal"
    );

    if (!validationResult.isValid) {
      // Add all validation errors from the transaction validation
      validationResult.errors.forEach((error) => {
        errors.push({
          field: error.field,
          message: error.message,
        });
      });
    }
  }

  // Wallet address validation
  if (!data.walletAddress || data.walletAddress.trim() === "") {
    errors.push({
      field: "walletAddress",
      message: "Wallet address is required",
    });
  } else {
    // Validate based on network type
    let validation;
    switch (networkType) {
      case "TRC20":
      case "BEP20":
        validation = validateWalletAddress(data.walletAddress, networkType);
        if (!validation.isValid) {
          errors.push({
            field: "walletAddress",
            message: validation.message!,
          });
        }
        break;
      default:
        errors.push({
          field: "walletAddress",
          message: "Please select a valid network first",
        });
    }
  }

  // Payment confirmation validation
  if (!data.confirmPayment) {
    errors.push({
      field: "confirmPayment",
      message: "Please confirm that you want to withdraw this amount",
    });
  }

  return errors;
};

export const getFieldError = (
  field: string,
  errors: ValidationError[]
): string | undefined => {
  return errors.find((error) => error.field === field)?.message;
};
