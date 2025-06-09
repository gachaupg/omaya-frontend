// File: features/p2p/types/businessRules.ts
export interface TransactionLimits {
  min: string;
  max: string;
  dailyLimit: string;
  monthlyLimit: string;
  currency: string;
  network?: string;
}

export interface UserLimits {
  verified: TransactionLimits;
  unverified: TransactionLimits;
  premium: TransactionLimits;
}

export const TRANSACTION_LIMITS: Record<string, UserLimits> = {
  USDT: {
    unverified: {
      min: "10.00",
      max: "10000000.00",
      dailyLimit: "2000000.00",
      monthlyLimit: "20000000.00",
      currency: "USDT",
    },
    verified: {
      min: "10.00",
      max: "10000000.00",
      dailyLimit: "200000.00",
      monthlyLimit: "20000000.00",
      currency: "USDT",
    },
    premium: {
      min: "10.00",
      max: "200000.00",
      dailyLimit: "200000.00",
      monthlyLimit: "2000000.00",
      currency: "USDT",
    },
  },
};
