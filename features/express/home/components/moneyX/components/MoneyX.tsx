"use client";

import React from "react";
import TransferForm from "./TransferForm";

interface MoneyXProps {
  isHomePage?: boolean;
  onTransferComplete?: (data: {
    fromPaymentMethod: any;
    toPaymentMethod: any;
    amount: number;
    receiveAmount: number;
    bankAccountAddress?: string;
    moneyxTransactionId?: string;
    moneyXTransaction?: any;
  }) => void;
}

const MoneyX = ({ isHomePage = false, onTransferComplete }: MoneyXProps) => {
  const handleTransfer = (data: {
    fromPaymentMethod: any;
    toPaymentMethod: any;
    amount: number;
    receiveAmount: number;
    bankAccountAddress?: string;
    moneyxTransactionId?: string;
    moneyXTransaction?: any;
  }) => {
    // Create transaction data for exchanging page
    const moneyxTransactionData = {
      type: "deposit" as const,
      amount: data.amount,
      receiveAmount: data.receiveAmount,
      asset: {
        ticker: "USD",
        symbol: "USD",
        name: "US Dollar",
      },
      paymentDetail: data.fromPaymentMethod,
      toPaymentDetail: data.toPaymentMethod,
      walletAddress: data.bankAccountAddress || "", // Bank account address
      network: { network_type: "Bank Transfer" },
      fromPaymentMethod: data.fromPaymentMethod,
      toPaymentMethod: data.toPaymentMethod,
      transactionId: data.moneyxTransactionId || "", // MoneyX transaction ID for WebSocket
      moneyxTransactionId: data.moneyxTransactionId || "", // MoneyX transaction ID
      isMoneyX: true, // Flag to identify MoneyX transactions
      moneyXTransaction: data.moneyXTransaction, // Full MoneyX transaction data
    };

    // Store in localStorage
    localStorage.setItem(
      "moneyx_transaction_data",
      JSON.stringify(moneyxTransactionData)
    );
    localStorage.setItem(
      "express_transaction_data",
      JSON.stringify(moneyxTransactionData)
    );

    // Call callback to switch tab instead of navigating
    if (onTransferComplete) {
      onTransferComplete(data);
    }
  };

  return (
    <div className="w-full pl-0 sm:pl-4 pr-2 sm:pr-0 pt-0 mb-0 overflow-x-hidden">
      <TransferForm isHomePage={isHomePage} onTransfer={handleTransfer} />
    </div>
  );
};

export default MoneyX;

