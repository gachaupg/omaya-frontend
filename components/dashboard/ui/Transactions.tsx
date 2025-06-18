"use client";
import React, { useState } from "react";
import ExchangeTransactions from "../sections/ExchangeTransactions";
import P2PTransactions from "../sections/P2PTransactions";
import SwapTransactions from "../sections/SwapTransactions";
import BuyTransactions from "../sections/BuyTransactions";

type TabType = "exchange" | "p2p" | "swap" | "buy";

const Transactions = () => {
  const [activeTab, setActiveTab] = useState<TabType>("exchange");

  const renderContent = () => {
    switch (activeTab) {
      case "exchange":
        return <ExchangeTransactions />;
      case "p2p":
        return <P2PTransactions />;
      case "swap":
        return <SwapTransactions />;
      case "buy":
        return <BuyTransactions />;
      default:
        return <ExchangeTransactions />;
    }
  };

  return (
    <div className="bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          My Transactions
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab("exchange")}
            className={`${
              activeTab === "exchange"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751]"
            } px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base`}
          >
            Exchange
          </button>
          <button
            onClick={() => setActiveTab("p2p")}
            className={`${
              activeTab === "p2p"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751]"
            } px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base`}
          >
            P2P
          </button>
          <button
            onClick={() => setActiveTab("swap")}
            className={`${
              activeTab === "swap"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751]"
            } px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base`}
          >
            Swap
          </button>
          <button
            onClick={() => setActiveTab("buy")}
            className={`${
              activeTab === "buy"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751]"
            } px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base`}
          >
            Buy
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default Transactions;
