"use client";
import React, { useState } from "react";
import MoneyX from "@/features/moneyX/components/MoneyX";
import Exchanging from "@/features/moneyX/components/Exchanging";

const ExchangePage = () => {
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

  return (
    <div className="w-[calc(100%+4rem)] -ml-8 -mr-8 sm:w-[calc(100%+2rem)] sm:-ml-4 sm:-mr-4 md:ml-0 md:mr-0 md:w-full">
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
