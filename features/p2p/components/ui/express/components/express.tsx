"use client";
import React, { useState } from "react";
import ExpressExchangeForm from "./ExpressExchangeForm";
import Exchanging from "./exchnaging";
import SuccessPage from "./success";
import { useTheme } from "@/context/theme";
import { scrollAppToHalfway } from "@/lib/utils/scrollAppToTop";

interface ExpressProps {
  mode?: "deposit" | "withdrawal";
  balance?: number;
  skipAmountValidation?: boolean; // New prop to skip amount validation when posting ads
  onCancel?: () => void;
  onBeforeLegalNavigate?: () => void;
}

const Express = ({
  mode = "deposit",
  balance,
  skipAmountValidation = false,
  onCancel,
  onBeforeLegalNavigate,
}: ExpressProps) => {
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const { isDark } = useTheme();

  return (
    <div className="w-full">
      
      {showExchanging ? (
        <Exchanging transactionData={transactionData} />
      ) : (
        <ExpressExchangeForm
          onExchange={(data) => {
            setTransactionData(data);
            setShowExchanging(true);
            scrollAppToHalfway();
          }}
          initialMode={mode}
          balance={balance}
          skipAmountValidation={skipAmountValidation}
          onCancel={onCancel}
          onBeforeLegalNavigate={onBeforeLegalNavigate}
        />
      )}
       {/* <SuccessPage transactionData={transactionData} /> */}
      {/* ddhhdhdgdhhdhd */}
  
    </div>
  );
};

export default Express;
