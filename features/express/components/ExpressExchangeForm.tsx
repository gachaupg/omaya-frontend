"use client";
import React, { useState, useEffect } from "react";
import WithdrawalForm from "./forms/withdrwal";
import DepositForm from "./forms/deposit";

interface ExpressExchangeFormProps {
  onExchange: (transactionData: {
    type: "deposit" | "withdrawal";
    amount: number;
    receiveAmount?: number; // Net amount from form "You Receive"
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
  const [prefillState, setPrefillState] = useState<any>(null);
  // Preserve state when switching modes
  const [preservedState, setPreservedState] = useState<any>(null);

  const handleModeChange = (newMode: "deposit" | "withdrawal", currentState?: any) => {
    // Save current state before switching
    if (currentState) {
      setPreservedState(currentState);
    }
    setMode(newMode);
  };

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("prefill");
    if (prefill) {
      try {
        const parsed = JSON.parse(decodeURIComponent(prefill));
        setPrefillState(parsed);
      } catch (error) {
        console.warn("Failed to parse prefill state", error);
      }
    }
  }, [initialMode]);

  return (
    <div className="w-full mt-0">
      {/* Mode Selection */}
      

      {/* Form Component  sgsgsggs*/}
      {mode === "deposit" ? (
        <DepositForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={preservedState || prefillState}
        />
      ) : (
        <WithdrawalForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={preservedState || prefillState}
        />
      )}
    </div>
  );
};

export default ExpressExchangeForm;
