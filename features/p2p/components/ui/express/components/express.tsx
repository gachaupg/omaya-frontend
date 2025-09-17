"use client";
import React, { useState } from "react";
import ExpressExchangeForm from "./ExpressExchangeForm";
import Exchanging from "./exchnaging";
import SuccessPage from "./success";
import { useTheme } from "@/context/theme";

interface ExpressProps {
  mode?: "deposit" | "withdrawal";
}

const Express = ({ mode = "deposit" }: ExpressProps) => {
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
        />
      )}
       {/* <SuccessPage transactionData={transactionData} /> */}
      {/* ddhhdhdgdhhdhd */}
  
    </div>
  );
};

export default Express;
