"use client";
import React, { useState } from "react";
import ExchangeTransactions from "../sections/ExchangeTransactions";
import P2PTransactions from "../sections/P2PTransactions";
import SwapTransactions from "../sections/SwapTransactions";
import P2PWithdrawalDepositTransactions from "../sections/P2PWithdrawalDepositTransactions";
import MoneyXTransactions from "../sections/MoneyXTransactions";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

type TabType = "exchange" | "p2p" | "swap" | "p2pWithdrawalDeposit" | "moneyx";

// Reusable NoDataFound component
export const NoDataFound = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => {
  const { t } = useDashboardI18n();

  return (
    <div className="w-full text-center py-4 sm:py-6 md:py-8">
      <div className="flex flex-col items-center justify-center dark:border-[#35353E] border-gray-200 border rounded-[24px] p-4 sm:p-6 md:p-8 bg-card">
        <div className="w-16 h-16 mb-4 rounded-full dark:bg-[#35353E] bg-gray-200 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:text-[#788099] text-gray-500"
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
        <h3 className="text-lg font-semibold dark:text-[#788099] text-gray-600 mb-2">
          {title}
        </h3>
        <p className="text-sm dark:text-[#8C8CA1] text-gray-500 text-center max-w-md">
          {message}
        </p>
      </div>
    </div>
  );
};

const Transactions = () => {
  const [activeTab, setActiveTab] = useState<TabType>("exchange");
  const { t } = useDashboardI18n();

  const renderContent = () => {
    switch (activeTab) {
      case "exchange":
        return <ExchangeTransactions />;
      case "p2p":
        return <P2PTransactions />;
      case "swap":
        return <SwapTransactions />;
      case "p2pWithdrawalDeposit":
        return <P2PWithdrawalDepositTransactions />;
      case "moneyx":
        return <MoneyXTransactions />;
      default:
        return <ExchangeTransactions />;
    }
  };

  return (
    <div className="bg-card border border-[#E8EFF5] dark:border-accent rounded-xl sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-4 lg:mb-4 gap-3 sm:gap-4 lg:gap-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold dark:text-white text-[#0D0D0D]">
          {t("transactions.title", "Recent Transactions")}
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("exchange")}
            className={`${
              activeTab === "exchange"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751] dark:text-[#1D8751]"
            } px-3 sm:px-4 lg:px-6 py-2 rounded-full font-medium text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center transition-colors`}
          >
            {t("transactions.types.exchange", "Exchange")}
          </button>
          <button
            onClick={() => setActiveTab("p2p")}
            className={`${
              activeTab === "p2p"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751] dark:text-[#1D8751]"
            } px-3 sm:px-4 lg:px-6 py-2 rounded-full font-medium text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center transition-colors`}
          >
            {t("transactions.types.p2pBuy", "P2P")}
          </button>
          <button
            onClick={() => setActiveTab("moneyx")}
            className={`${
              activeTab === "moneyx"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751] dark:text-[#1D8751]"
            } px-3 sm:px-4 lg:px-6 py-2 rounded-full font-medium text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center transition-colors`}
          >
            {t("transactions.types.moneyx", "MoneyX")}
          </button>
          <button
            onClick={() => setActiveTab("swap")}
            className={`${
              activeTab === "swap"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751] dark:text-[#1D8751]"
            } px-3 sm:px-4 lg:px-6 py-2 rounded-full font-medium text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center transition-colors`}
          >
            {t("transactions.types.swap", "Swap")}
          </button>
          <button
            onClick={() => setActiveTab("p2pWithdrawalDeposit")}
            className={`${
              activeTab === "p2pWithdrawalDeposit"
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751] dark:text-[#1D8751]"
            } px-3 sm:px-4 lg:px-6 py-2 rounded-full font-medium text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center transition-colors`}
          >
            {t("transactions.types.p2pWithdrawalDeposit", "P2P Withdrawal/Deposit")}
          </button>
          
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default Transactions;
