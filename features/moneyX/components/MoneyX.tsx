"use client";

import React from "react";
import TransferForm from "./TransferForm";

interface MoneyXProps {
  onTransferComplete?: (data: {
    fromPaymentMethod: any;
    toPaymentMethod: any;
    amount: number;
    receiveAmount: number;
    bankAccountAddress?: string;
    moneyxTransactionId?: string;
    moneyXTransaction?: any;
  }) => void;
  initialState?: Record<string, any>;
}

const MoneyX = ({ onTransferComplete, initialState }: MoneyXProps) => {
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
      createdAt: Date.now(),
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
    <div className="w-full max-w-5xl mx-auto box-border px-4 sm:px-6 pt-0 mb-0 overflow-x-hidden">
      <TransferForm onTransfer={handleTransfer} initialState={initialState} />
    </div>
  );
};

export default MoneyX;

