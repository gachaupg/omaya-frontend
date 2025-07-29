"use client";
import React, { useState } from "react";
import ExchangeTransactions from "../sections/ExchangeTransactions";
import P2PTransactions from "../sections/P2PTransactions";
import SwapTransactions from "../sections/SwapTransactions";
import BuyTransactions from "../sections/BuyTransactions";

type TabType = "exchange" | "p2p" | "swap" | "buy";

// Reusable NoDataFound component
export const NoDataFound = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => (
  <div className="w-full text-center py-8">
    <div className="flex flex-col items-center justify-center border border-[#35353E] rounded-[24px] p-8 bg-[#23232B]">
      <div className="w-16 h-16 mb-4 rounded-full bg-[#35353E] flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#788099]"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 8V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 16H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#788099] mb-2">{title}</h3>
      <p className="text-sm text-[#8C8CA1] text-center max-w-md">{message}</p>
    </div>
  </div>
);

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
    <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] border-2 border-[#35353E] rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold dark:text-white text-[#0D0D0D]">
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
