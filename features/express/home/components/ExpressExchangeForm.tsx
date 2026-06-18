"use client";
import React, { useState, useEffect, useRef } from "react";
import DepositForm from "./forms/deposit";
import WithdrawalForm from "./forms/withdrwal";
import {
  peekExpressHomeLegalReturnState,
  clearExpressHomeLegalReturnState,
  finalizeExpressHomeLegalReturnState,
} from "@/lib/utils/authRedirect";

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
  const hasRestoredLegalRef = useRef(false);
  const [restoreReady, setRestoreReady] = useState(!isHomePage);
  const [legalRestoreState, setLegalRestoreState] = useState<
    Record<string, any> | null
  >(null);
  const [mode, setMode] = useState<"deposit" | "withdrawal">(initialMode);

  useEffect(() => {
    if (!isHomePage || hasRestoredLegalRef.current) {
      setRestoreReady(true);
      return;
    }

    hasRestoredLegalRef.current = true;
    const saved = peekExpressHomeLegalReturnState();
    if (saved) {
      setLegalRestoreState(saved);
      if (saved.mode === "deposit" || saved.mode === "withdrawal") {
        setMode(saved.mode);
      }
      clearExpressHomeLegalReturnState();

      const savedScrollY = saved.scrollY;
      if (typeof savedScrollY === "number" && !Number.isNaN(savedScrollY)) {
        window.setTimeout(() => {
          window.scrollTo({ top: Math.max(0, savedScrollY), behavior: "auto" });
        }, 0);
      }

      window.setTimeout(() => {
        finalizeExpressHomeLegalReturnState();
      }, 1000);
    }
    setRestoreReady(true);
  }, [isHomePage]);

  const handleModeChange = (newMode: "deposit" | "withdrawal") => {
    setMode(newMode);
  };

  useEffect(() => {
    if (legalRestoreState?.mode) return;
    setMode(initialMode);
  }, [initialMode, legalRestoreState?.mode]);

  if (!restoreReady) {
    return null;
  }

  const formKey = legalRestoreState
    ? `legal-restore-${legalRestoreState.mode}-${legalRestoreState.isFirstCardSubmitted ? "expanded" : "collapsed"}`
    : `default-${mode}`;

  return (
    <div className="w-full mx-auto p-0">
      {mode === "deposit" ? (
        <DepositForm
          key={formKey}
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={legalRestoreState ?? undefined}
        />
      ) : (
        <WithdrawalForm
          key={formKey}
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={legalRestoreState ?? undefined}
        />
      )}
    </div>
  );
};

export default ExpressExchangeForm;
