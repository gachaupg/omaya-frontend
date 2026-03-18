"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { resetMoneyXState } from "../slices/moneyXSlice";
import TransferForm from "./TransferForm";
import Exchanging from "./Exchanging";

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
  /** Used for range-commissions API: commission_type=deposit | withdrawal */
  commissionType?: "deposit" | "withdrawal";
}

const MoneyX = ({ isHomePage = false, onTransferComplete, commissionType = "deposit" }: MoneyXProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

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
      createdAt: Date.now(), // Store transaction creation timestamp for timer
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

    // Set state to show Exchanging component
    setTransactionData(moneyxTransactionData);
    setShowExchanging(true);

    // Call callback if provided (for external state management)
    if (onTransferComplete) {
      onTransferComplete(data);
    }
  };

  // If showing exchanging, render it
  if (showExchanging && transactionData) {
    return (
      <Exchanging
        transactionData={transactionData}
        onBackToTransfer={() => {
          setShowExchanging(false);
          setTransactionData(null);
          // Clear Redux MoneyX state so next transfer starts fresh (terms and form reset)
          dispatch(resetMoneyXState());
          localStorage.removeItem("moneyx_transaction_data");
          localStorage.removeItem("express_transaction_data");
        }}
      />
    );
  }

  // Otherwise show the transfer form
  return (
    <div className="w-full pt-0 mb-0">
      <TransferForm isHomePage={isHomePage} onTransfer={handleTransfer} commissionType={commissionType} />
    </div>
  );
};

export default MoneyX;

