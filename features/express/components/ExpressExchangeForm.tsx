"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import WithdrawalForm from "./forms/withdrwal";
import DepositForm from "./forms/deposit";
import {
  consumeExpressPrefillState,
  peekExpressDashboardLegalReturnStateIfReturning,
  clearExpressDashboardLegalReturnFlag,
  finalizeExpressDashboardLegalReturnState,
} from "@/lib/utils/authRedirect";

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

const readDashboardLegalReturnState = (): Record<string, any> | null => {
  if (typeof window === "undefined") return null;
  return peekExpressDashboardLegalReturnStateIfReturning();
};

interface ExpressExchangeFormProps {
  onExchange: (transactionData: {
    type: "deposit" | "withdrawal";
    amount: number;
    receiveAmount?: number;
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
  const hasConsumedLegalRef = useRef(false);
  const prefillFromUrl = useMemo(
    () => parsePrefillFromUrl(searchParams),
    [searchParams]
  );
  const [legalReturnState, setLegalReturnState] = useState<
    Record<string, any> | null
  >(() => readDashboardLegalReturnState());
  const [mode, setMode] = useState<"deposit" | "withdrawal">(() => {
    const saved = readDashboardLegalReturnState();
    if (saved?.mode === "deposit" || saved?.mode === "withdrawal") {
      return saved.mode;
    }
    return initialMode;
  });
  const [prefillState, setPrefillState] = useState<Record<string, any> | null>(
    () => prefillFromUrl
  );
  const [preservedState, setPreservedState] = useState<any>(null);

  const handleModeChange = (newMode: "deposit" | "withdrawal", currentState?: any) => {
    if (currentState) {
      setPreservedState({ ...currentState, __source: "modeSwitch" });
    }
    setMode(newMode);
  };

  useEffect(() => {
    if (hasConsumedLegalRef.current) return;
    hasConsumedLegalRef.current = true;

    const saved = legalReturnState ?? peekExpressDashboardLegalReturnStateIfReturning();
    if (saved) {
      setLegalReturnState(saved);
      if (saved.mode === "deposit" || saved.mode === "withdrawal") {
        setMode(saved.mode);
      }
      clearExpressDashboardLegalReturnFlag();

      const savedScrollY = saved.scrollY;
      if (typeof savedScrollY === "number" && !Number.isNaN(savedScrollY)) {
        window.setTimeout(() => {
          window.scrollTo({ top: Math.max(0, savedScrollY), behavior: "auto" });
        }, 0);
      }

      window.setTimeout(() => {
        finalizeExpressDashboardLegalReturnState();
      }, 1000);
    }
  }, [legalReturnState]);

  useEffect(() => {
    if (legalReturnState?.mode) return;
    setMode(initialMode);
  }, [initialMode, legalReturnState?.mode]);

  useEffect(() => {
    if (prefillState) return;
    const fromStorage = consumeExpressPrefillState();
    if (fromStorage) setPrefillState(fromStorage);
  }, [prefillState]);

  const effectiveInitialState =
    legalReturnState || preservedState || prefillState;
  const isFormExpanded = Boolean(
    effectiveInitialState?.isTransactionSubmitted ??
      effectiveInitialState?.isFirstCardSubmitted
  );
  const formKey = legalReturnState
    ? `legal-restore-${legalReturnState.mode}-${isFormExpanded ? "expanded" : "collapsed"}`
    : `default-${mode}`;

  return (
    <div className="w-full mt-0">
      {mode === "deposit" ? (
        <DepositForm
          key={formKey}
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={effectiveInitialState}
        />
      ) : (
        <WithdrawalForm
          key={formKey}
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          isHomePage={isHomePage}
          initialState={effectiveInitialState}
        />
      )}
    </div>
  );
};

export default ExpressExchangeForm;
