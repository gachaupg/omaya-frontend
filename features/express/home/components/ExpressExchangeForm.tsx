"use client";
import React, { useState, useEffect } from "react";
import DepositForm from "./forms/deposit";
import WithdrawalForm from "./forms/withdrwal";
import { getExpressHomeFormState } from "@/lib/utils/authRedirect";

interface ExpressExchangeFormProps {
  onExchange: (transactionData: {
    type: "deposit" | "withdrawal";
    amount: number;
    asset: any;
    paymentDetail?: any;
    paymentDetails?: any[];
    walletAddress: string;
    network: any;
    transactionId?: string;
    depositCode?: string;
    totalAmountDue?: string;
    commission?: string;
    networkFee?: string;
    currency?: string;
    websocketUrl?: string;
    websocket_url?: string;
    status?: string;
    message?: string;
    withdrawalAddress?: string;
    details?: {
      withdrawal_address?: string;
      payout_address?: string;
      from_currency?: string;
      to_currency?: string;
      to_network?: string;
      estimated_amount?: number;
      changenow_id?: string;
    };
  }) => void;
  initialMode?: "deposit" | "withdrawal";
  isHomePage?: boolean;
}

const ExpressExchangeForm: React.FC<ExpressExchangeFormProps> = ({
  onExchange,
  initialMode = "deposit",
  isHomePage = false,
}) => {
  const [mode, setMode] = useState<"deposit" | "withdrawal">(initialMode);
  const [initialState, setInitialState] = useState<Record<string, any> | null>(null);

  const handleModeChange = (newMode: "deposit" | "withdrawal") => {
    setMode(newMode);
  };

  // Restore amount/asset from localStorage when on home (logged-out form state)
  useEffect(() => {
    if (isHomePage && typeof window !== "undefined") {
      const saved = getExpressHomeFormState();
      if (saved) setInitialState(saved);
    }
  }, [isHomePage]);

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="w-full mx-auto p-0">
      {/* Mode Selection */}
      

      {/* Form Component */}
      {mode === "deposit" ? (
        <DepositForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={initialState ?? undefined}
        />
      ) : (
        <WithdrawalForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={initialState ?? undefined}
        />
      )}
    </div>
  );
};

export default ExpressExchangeForm;
