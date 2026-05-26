"use client";
import React, { useState } from "react";
import AllTransactions from "../sections/AllTransactions";
import ExchangeTransactions from "../sections/ExchangeTransactions";
import P2PTransactions from "../sections/P2PTransactions";
import SwapTransactions from "../sections/SwapTransactions";
import P2PWithdrawalDepositTransactions from "../sections/P2PWithdrawalDepositTransactions";
import MoneyXTransactions from "../sections/MoneyXTransactions";
import { MoneyXLabel } from "@/components/ui/MoneyXLabel";
import { useDashboardI18n } from "@/lib/useDashboardI18n";

type TabType = "all" | "exchange" | "p2p" | "swap" | "p2pWithdrawalDeposit" | "moneyx";

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
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const { t } = useDashboardI18n();

  const renderContent = () => {
    switch (activeTab) {
      case "all":
        return <AllTransactions />;
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
        return <AllTransactions />;
    }
  };

  const tabButtonClass = (isActive: boolean) =>
    `flex-shrink-0 whitespace-nowrap ${
      isActive
        ? "bg-[#1D8751] text-white"
        : "border border-[#1D8751] text-[#1D8751] dark:text-[#1D8751]"
    } px-3 sm:px-4 lg:px-6 py-2 rounded-full font-medium text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center justify-center transition-colors`;

  return (
    <div className="bg-card border border-[#E8EFF5] dark:border-accent rounded-xl sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-4 overflow-hidden">
      <div className="flex flex-col gap-3 mb-4 sm:mb-4 lg:mb-4">
        <h2 className="text-lg mt-1 sm:mt-0 sm:text-xl lg:text-2xl font-semibold dark:text-white text-[#0D0D0D]">
          {t("transactions.title", "Recent Transactions")}
        </h2>
        <div className="flex flex-nowrap items-center gap-2 sm:gap-3 lg:gap-4 overflow-x-auto scrollbar-thin w-full pb-0.5">
          <button
            onClick={() => setActiveTab("all")}
            className={tabButtonClass(activeTab === "all")}
          >
            {t("transactions.types.all", "All")}
          </button>
          <button
            onClick={() => setActiveTab("exchange")}
            className={tabButtonClass(activeTab === "exchange")}
          >
            {t("transactions.types.exchange", "Exchange")}
          </button>
          <button
            onClick={() => setActiveTab("p2p")}
            className={tabButtonClass(activeTab === "p2p")}
          >
            {t("transactions.types.p2pBuy", "P2P")}
          </button>
          <button
            onClick={() => setActiveTab("moneyx")}
            className={tabButtonClass(activeTab === "moneyx")}
          >
            <MoneyXLabel
              moneyText={t("transactions.types.moneyPrefix", "Money")}
              moneyClassName="text-inherit text-xs sm:text-sm lg:text-base font-medium"
              xClassName="h-3.5 sm:h-4 w-auto"
              active={activeTab === "moneyx"}
              onColoredBackground={activeTab === "moneyx"}
            />
          </button>
          <button
            onClick={() => setActiveTab("swap")}
            className={tabButtonClass(activeTab === "swap")}
          >
            {t("transactions.types.swap", "Swap")}
          </button>
          <button
            onClick={() => setActiveTab("p2pWithdrawalDeposit")}
            className={tabButtonClass(activeTab === "p2pWithdrawalDeposit")}
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
