import { Transaction } from "../types";

export const formatTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    p2p_buy: "P2P Buy",
    p2p_sell: "P2P Sell",
    swap: "Swap",
    exchange: "Exchange",
  };

  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export const formatAmount = (amount: number, currency: string): string => {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const transactionTime = new Date(timestamp);
  const diffInSeconds = Math.floor(
    (now.getTime() - transactionTime.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

export const getCurrencyIcon = (currency: string): string => {
  const iconMap: Record<string, string> = {
    BTC: "₿",
    ETH: "Ξ",
    USDT: "₮",
    BNB: "BNB",
    ADA: "₳",
    DOT: "●",
    LINK: "🔗",
    LTC: "Ł",
    XRP: "✕",
  };

  return iconMap[currency] || currency;
};

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    approved: "text-[#1D8751]",
    pending: "text-yellow-500",
    rejected: "text-red-500",
    cancelled: "text-gray-500",
  };

  return statusMap[status] || "text-gray-500";
};
