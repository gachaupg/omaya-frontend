"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MoneyX from "@/features/moneyX/components/MoneyX";
import Exchanging from "@/features/moneyX/components/Exchanging";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";
import { consumeMoneyXPrefillState } from "@/lib/utils/authRedirect";
import { useScrollAppToTopWhen } from "@/hooks/useScrollAppToTopWhen";
import { scrollAppToTop } from "@/lib/utils/scrollAppToTop";

const ExchangePage = () => {
  const { isChecking, isVerified } = useRouteProtection();
  const searchParams = useSearchParams();
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [moneyxPrefill, setMoneyxPrefill] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const prefillParam = searchParams?.get("prefill");
    if (prefillParam) {
      try {
        setMoneyxPrefill(JSON.parse(decodeURIComponent(prefillParam)) as Record<string, any>);
      } catch {
        // Ignore
      }
    } else {
      const fromStorage = consumeMoneyXPrefillState();
      if (fromStorage) setMoneyxPrefill(fromStorage);
    }
  }, [searchParams]);

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
    scrollAppToTop();
  };

  useScrollAppToTopWhen(showExchanging && !!transactionData);

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
    <div className="w-full overflow-x-hidden container mx-auto flex flex-col items-center">
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
        <MoneyX onTransferComplete={handleTransferComplete} initialState={moneyxPrefill ?? undefined} />
      )}
    </div>
  );
};

export default ExchangePage;
