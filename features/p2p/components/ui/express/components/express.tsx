"use client";
import React, { useState } from "react";
import ExpressExchangeForm from "./ExpressExchangeForm";
import Exchanging from "./exchnaging";
import SuccessPage from "./success";
import { useTheme } from "@/context/theme";

interface ExpressProps {
  mode?: "deposit" | "withdrawal";
  balance?: number;
}

const Express = ({ mode = "deposit",balance }: ExpressProps) => {
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const { isDark } = useTheme();

  return (
    <div className=" w-full mx-auto">
      
      {showExchanging ? (
        <Exchanging transactionData={transactionData} />
      ) : (
        <ExpressExchangeForm
          onExchange={(data) => {
            setTransactionData(data);
            setShowExchanging(true);
          }}
          initialMode={mode}
          balance={balance}
        />
      )}
       {/* <SuccessPage transactionData={transactionData} /> */}
      {/* ddhhdhdgdhhdhd */}
  
    </div>
  );
};

export default Express;
