"use client";
import React, { useState } from "react";
import MoneyX from "@/features/moneyX/components/MoneyX";
import Exchanging from "@/features/moneyX/components/Exchanging";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";

const ExchangePage = () => {
  const { isChecking, isVerified } = useRouteProtection();
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  const handleTransferComplete = (data: any) => {
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
      walletAddress: data.bankAccountAddress || "",
      network: { network_type: "Bank Transfer" },
      fromPaymentMethod: data.fromPaymentMethod,
      toPaymentMethod: data.toPaymentMethod,
      transactionId: data.moneyxTransactionId || "",
      moneyxTransactionId: data.moneyxTransactionId || "",
      isMoneyX: true,
      moneyXTransaction: data.moneyXTransaction,
    };

    setTransactionData(moneyxTransactionData);
    setShowExchanging(true);
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" color="#1D8751" />
      </div>
    );
  }

  if (isVerified === false) {
    return null; // Modal will be shown by the hook
  }

  return (
    <div className="container mx-auto overflow-x-hidden">
      {showExchanging && transactionData ? (
        <Exchanging 
          transactionData={transactionData}
          onBackToTransfer={() => {
            setShowExchanging(false);
            setTransactionData(null);
            // Clear localStorage to reset on refresh
            localStorage.removeItem("moneyx_transaction_data");
            localStorage.removeItem("express_transaction_data");
          }}
        />
      ) : (
        <MoneyX onTransferComplete={handleTransferComplete} />
      )}
    </div>
  );
};

export default ExchangePage;
