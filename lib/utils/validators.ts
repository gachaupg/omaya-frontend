/**
 * Common validators for the application
 */

export const validateP2PAd = {
  amount: (value: string) => {
    if (!value) return "Amount is required";
    if (isNaN(Number(value))) return "Amount must be a number";
    if (Number(value) <= 0) return "Amount must be greater than 0";
    if (Number(value) > 1000000) return "Amount cannot exceed 1,000,000";
    return "";
  },

  minOrderAmount: (value: string) => {
    if (!value) return "Minimum order amount is required";
    if (isNaN(Number(value))) return "Minimum order amount must be a number";
    if (Number(value) <= 0)
      return "Minimum order amount must be greater than 0";
    if (Number(value) < 10) return "Minimum order amount must be at least 10";
    return "";
  },

  maxOrderAmount: (value: string, minAmount: string) => {
    if (!value) return "Maximum order amount is required";
    if (isNaN(Number(value))) return "Maximum order amount must be a number";
    if (Number(value) <= 0)
      return "Maximum order amount must be greater than 0";
    if (Number(value) <= Number(minAmount)) {
      return "Maximum order amount must be greater than minimum order amount";
    }
    if (Number(value) > 1000000)
      return "Maximum order amount cannot exceed 1,000,000";
    return "";
  },

  commission: (value: number) => {
    if (value < 0) return "Commission cannot be negative";
    if (value > 100) return "Commission cannot exceed 100%";
    return "";
  },

  timeLimit: (value: number) => {
    if (value < 1) return "Time limit must be at least 1 minute";
    if (value > 60) return "Time limit cannot exceed 60 minutes";
    return "";
  },

  paymentMethod: (value: string) => {
    if (!value) return "Payment method is required";
    return "";
  },

  provider: (value: string) => {
    if (!value) return "Provider is required";
    return "";
  },

  terms: (value: string) => {
    if (value && value.length > 500)
      return "Terms cannot exceed 500 characters";
    return "";
  },

  autoReply: (value: string) => {
    if (value && value.length > 500)
      return "Auto-reply cannot exceed 500 characters";
    return "";
  },
};

export const validateDeposit = {
  amount: (value: string) => {
    if (!value || value.trim() === "") return "Amount is required";
    if (isNaN(Number(value)) || Number(value) <= 0) {
      return "Please enter a valid amount greater than 0";
    }
    return "";
  },

  file: (file: File | null) => {
    if (!file) return "Payment proof is required";
    return "";
  },

  confirmPayment: (confirmed: boolean) => {
    if (!confirmed) return "Please confirm that you have sent the payment";
    return "";
  },
};

export const validateWithdrawal = {
  amount: (value: string) => {
    if (!value || value.trim() === "") return "Amount is required";
    if (isNaN(Number(value)) || Number(value) <= 0) {
      return "Please enter a valid amount greater than 0";
    }
    return "";
  },

  walletAddress: (address: string) => {
    if (!address || address.trim() === "") return "Wallet address is required";
    if (!/^T[A-Za-z1-9]{33}$/.test(address)) {
      return "Please enter a valid BEP20 wallet address";
    }
    return "";
  },

  confirmPayment: (confirmed: boolean) => {
    if (!confirmed)
      return "Please confirm that you want to withdraw this amount";
    return "";
  },
};
