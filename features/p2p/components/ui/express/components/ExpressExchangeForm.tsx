"use client";
import React, { useState, useEffect } from "react";
import DepositForm from "./forms/deposit";
import WithdrawalForm from "./forms/withdrwal";

import { logger } from '@/lib/utils/logger';

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
  balance?: number;
  skipAmountValidation?: boolean; // New prop to skip amount validation when posting ads
  onCancel?: () => void;
}

const ExpressExchangeForm: React.FC<ExpressExchangeFormProps> = ({
  onExchange,
  initialMode = "deposit",
  balance,
  skipAmountValidation = false,
  onCancel,
}) => {
  // Debug logging for balance
  logger.debug('p2p', "ExpressExchangeForm - Received balance:", balance);
  
  const [mode, setMode] = useState<"deposit" | "withdrawal">(initialMode);

  const handleModeChange = (newMode: "deposit" | "withdrawal") => {
    setMode(newMode);
  };

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="w-full p-0">
      {/* Mode Selection */}
      

      {/* Form Component */}
      {mode === "deposit" ? (
        <DepositForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          balance={balance}
          skipAmountValidation={skipAmountValidation}
          onCancel={onCancel}
        />
      ) : (
        <WithdrawalForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={handleModeChange}
          balance={balance}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

export default ExpressExchangeForm;
