"use client";
import React, { useState } from "react";
import DepositForm from "./forms/deposit";
import WithdrawalForm from "./forms/withdrwal";

interface ExpressExchangeFormProps {
  onExchange?: (transactionData: any) => void;
}

export default function ExpressExchangeForm({
  onExchange,
}: ExpressExchangeFormProps) {
  const [mode, setMode] = useState<"deposit" | "withdrawal">("deposit");

  return (
    <div className="w-full min-h-screen flex flex-col justify-center bg-[#18181f]">
      {/* Mode Toggle Button */}
      {/* <div className="flex">
        <div className="bg-[#23232b] border border-[#39394a] rounded-2xl p-1 flex">
          <button
            onClick={() => setMode("deposit")}
            className={`px-6 py-2 rounded-xl font-medium transition-colors ${
              mode === "deposit"
                ? "bg-[#1D8751] text-white"
                : "text-[#788099] hover:text-white"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setMode("withdrawal")}
            className={`px-6 py-2 rounded-xl font-medium transition-colors ${
              mode === "withdrawal"
                ? "bg-[#dc2626] text-white"
                : "text-[#788099] hover:text-white"
            }`}
          >
            Withdrawal
          </button>
        </div>
      </div> */}

      {/* Render the appropriate form based on mode */}
      {mode === "deposit" ? (
        <DepositForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={setMode}
        />
      ) : (
        <WithdrawalForm
          onExchange={onExchange}
          mode={mode}
          onModeChange={setMode}
        />
      )}
    </div>
  );
}
