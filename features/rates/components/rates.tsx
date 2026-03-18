"use client";
import React from "react";
import Link from "next/link";
import RatesCalculator from "./RatesCalculator";
import RatesTransactionHistory from "./RatesTransactionHistory";
import { useRatesI18n } from "@/lib/useRatesI18n";
const Rates = () => {
  const [activeTab, setActiveTab] = React.useState<'crypto' | 'moneyx'>('crypto');
  const { t } = useRatesI18n();

  // Allow selecting Money X tab (logged in or out). KYC can be required when user tries to perform a transaction inside the calculator.
  const handleMoneyXClick = () => {
    setActiveTab('moneyx');
  };

  // Debug
  React.useEffect(() => {
    console.log('Rates component - activeTab changed to:', activeTab);
  }, [activeTab]);
  return (
    <div className="w-full text-gray-900 dark:text-white px-0 sm:px-6 lg:px-0 max-w-6xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-[#788099] hover:text-[#1D8751] dark:hover:text-[#1D8751] transition-colors mb-4 sm:mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm sm:text-base font-medium">{t("rates.back", "Back")}</span>
      </Link>

      <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold mb-2">
        {t("rates.title", "Our Exchange Rates Calculator")}
      </h1>
      <p className="text-gray-700 dark:text-[#788099] mb-4 sm:mb-6 lg:mb-8 max-w-full sm:max-w-2xl lg:max-w-4xl">
        {t(
          "rates.subtitle",
          "Check live rates and estimate your transaction fees."
        )}
      </p>

      {/* Tab System */}
      <div className="flex p-1 rounded-xl border-2 border-[#1D8751] w-fit bg-transparent mb-2 sm:mb-4 lg:mb-6">
        {/* Crypto */}
        <button
          onClick={() => setActiveTab('crypto')}
          className={`px-6 py-2.5 rounded-lg transition-all
      ${activeTab === 'crypto'
              ? 'bg-[#155836] text-white'
              : 'bg-transparent text-gray-600 dark:text-[#788099]'
            }`}
        >
          {t("rates.crypto", "Crypto")}
        </button>

        {/* MoneyX with image */}
        <button
          onClick={handleMoneyXClick}
          className={`px-4 sm:px-6 py-1 md:py-2 rounded-lg transition-all flex items-center gap-1 
      ${activeTab === 'moneyx'
              ? 'bg-[#155836] text-white'
              : 'bg-transparent text-gray-600 dark:text-[#788099]'
            }`}
        >
          <span>{t("rates.money", "Money")}</span>
          <img
            src={
              activeTab === 'moneyx'
                ? "/assets/Group_7_ichuyz.png"
                : "/images/x.png"
            }
            alt="X"
            className="h-5 -mb-1 w-auto"
          />
        </button>
      </div>

      <RatesCalculator key={activeTab} activeTab={activeTab} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-8 sm:mt-10 lg:mt-12 mb-3 sm:mb-4 lg:mb-4">
        <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold">
          {t("rates.transactions", "OMAYA Transahhjhctions")}
        </h2>
        <Link
          href="/market/live-transactions"
          className="text-secondary hover:text-[#0f8f4d] font-medium text-sm sm:text-base flex items-center gap-1 transition-colors"
        >
          {t("rates.liveTransactions", "Live Transactions →")}
        </Link>
      </div>
      <RatesTransactionHistory />
    </div>
  );
};

export default Rates;
