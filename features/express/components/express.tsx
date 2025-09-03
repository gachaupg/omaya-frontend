"use client";
import React, { useState } from "react";
import ExpressExchangeForm from "./ExpressExchangeForm";
import Exchanging from "./exchnaging";
import SuccessPage from "./success";

const Express = () => {
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<"deposit" | "withdrawal">("deposit");

  const handleModeToggle = () => {
    setCurrentMode(currentMode === "deposit" ? "withdrawal" : "deposit");
  };

  return (
    <div className="max-w-4xl w-full mx-auto">
      <div className=" mb-1">
        <button 
          onClick={handleModeToggle}
          className="hover:opacity-80 transition-opacity"
          title={`Switch to ${currentMode === "deposit" ? "withdrawal" : "deposit"} mode`}
        >
          <span className="flex items-center justify-center">
            <img
              src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
              alt=""
            />
            <img
              className="mt-2"
              src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
              alt=""
            />
          </span>
        </button>
        {/* <div className="mt-2 text-sm text-gray-600">
          Current Mode: <span className="font-semibold capitalize">{currentMode}</span>
        </div> */}
      </div>
      {showExchanging ? (
        <Exchanging transactionData={transactionData} />
      ) : (
        <ExpressExchangeForm
          onExchange={(data) => {
            setTransactionData(data);
            setShowExchanging(true);
          }}
          initialMode={currentMode}
        />
      )}
       {/* <SuccessPage transactionData={transactionData} /> */}
  
    </div>
  );
};

export default Express;
