"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import WithdrawalForm from "./forms/withdrwal";
import DepositForm from "./forms/deposit";
import { consumeExpressPrefillState } from "@/lib/utils/authRedirect";

/** Parse prefill from URL synchronously so form gets correct initial state on first render */
function parsePrefillFromUrl(searchParams: URLSearchParams | null): Record<string, any> | null {
  if (!searchParams) return null;
  const prefillParam = searchParams.get("prefill");
  if (!prefillParam) return null;
  try {
    return JSON.parse(decodeURIComponent(prefillParam)) as Record<string, any>;
  } catch {
    return null;
  }
}

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
  const searchParams = useSearchParams();
  const prefillFromUrl = useMemo(
    () => parsePrefillFromUrl(searchParams),
    [searchParams]
  );
  const [mode, setMode] = useState<"deposit" | "withdrawal">(initialMode);
  const [prefillState, setPrefillState] = useState<Record<string, any> | null>(
    () => prefillFromUrl
  );
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

  // Fallback: consume prefill from sessionStorage when URL has no prefill (e.g. truncated)
  useEffect(() => {
    if (prefillState) return;
    const fromStorage = consumeExpressPrefillState();
    if (fromStorage) setPrefillState(fromStorage);
  }, [prefillState]);

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
