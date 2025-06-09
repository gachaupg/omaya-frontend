import { validateWalletAddress } from "@/lib/addressValidaion";
import {
  TransactionValidator,
  ValidationContext,
} from "@/features/p2p/utils/transactionValidation";
import { showToast } from "@/lib/utils/toast";

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
    const error = {
      field: "amount",
      message: "Amount is required",
    };
    errors.push(error);
    showToast.error(error.message);
  } else if (isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    const error = {
      field: "amount",
      message: "Please enter a valid amount greater than 0",
    };
    errors.push(error);
    showToast.error(error.message);
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
        const validationError = {
          field: error.field,
          message: error.message,
        };
        errors.push(validationError);
        showToast.error(error.message);
      });
    }
  }

  // File validation
  if (!data.file) {
    const error = {
      field: "file",
      message: "Payment proof is required",
    };
    errors.push(error);
    showToast.error(error.message);
  }

  // Payment confirmation validation
  if (!data.confirmPayment) {
    const error = {
      field: "confirmPayment",
      message: "Please confirm that you have sent the payment",
    };
    errors.push(error);
    showToast.error(error.message);
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
    const error = {
      field: "amount",
      message: "Amount is required",
    };
    errors.push(error);
    showToast.error(error.message);
  } else if (isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    const error = {
      field: "amount",
      message: "Please enter a valid amount greater than 0",
    };
    errors.push(error);
    showToast.error(error.message);
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
        const validationError = {
          field: error.field,
          message: error.message,
        };
        errors.push(validationError);
        showToast.error(error.message);
      });
    }
  }

  // Wallet address validation
  if (!data.walletAddress || data.walletAddress.trim() === "") {
    const error = {
      field: "walletAddress",
      message: "Wallet address is required",
    };
    errors.push(error);
    showToast.error(error.message);
  } else {
    // Validate based on network type
    let validation;
    switch (networkType) {
      case "TRC20":
      case "BEP20":
        validation = validateWalletAddress(data.walletAddress, networkType);
        if (!validation.isValid) {
          const error = {
            field: "walletAddress",
            message: validation.message!,
          };
          errors.push(error);
          showToast.error(validation.message!);
        }
        break;
      default:
        const error = {
          field: "walletAddress",
          message: "Please select a valid network first",
        };
        errors.push(error);
        showToast.error(error.message);
    }
  }

  // Payment confirmation validation
  if (!data.confirmPayment) {
    const error = {
      field: "confirmPayment",
      message: "Please confirm that you want to withdraw this amount",
    };
    errors.push(error);
    showToast.error(error.message);
  }

  return errors;
};

export const getFieldError = (
  field: string,
  errors: ValidationError[]
): string | undefined => {
  return errors.find((error) => error.field === field)?.message;
};
