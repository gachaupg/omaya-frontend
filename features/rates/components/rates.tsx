"use client";
import React from "react";
import Link from "next/link";
import RatesCalculator from "./RatesCalculator";
import RatesTransactionHistory from "./RatesTransactionHistory";
import { useRatesI18n } from "@/lib/useRatesI18n";

const Rates = () => {
  const [activeTab, setActiveTab] = React.useState<'crypto' | 'moneyx'>('crypto');
  const { t } = useRatesI18n();
  return (
    <div className="max-w-5xl text-gray-900 dark:text-white px-4 sm:px-6 lg:px-0">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-[#788099] hover:text-[#1D8751] dark:hover:text-[#1D8751] transition-colors mb-4 sm:mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm sm:text-base font-medium">Back</span>
      </Link>

      <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold mb-2">
        {t("rates.title", "Our Exchange Rates Calculator")}
      </h1>
      <p className="text-gray-700 dark:text-[#788099] mb-4 sm:mb-6 lg:mb-8 max-w-full sm:max-w-2xl lg:max-w-4xl">
        {t(
          "rates.subtitle",
          "Check live rates andkkkkkk estimate your transaction fees."
        )}
      </p>

      {/* Tab System */}
      <div className="flex p-1 rounded-xl border-2 border-secondary w-fit bg-transparent mb-2 sm:mb-4 lg:mb-6">
        {/* Crypto */}
        <button
          onClick={() => setActiveTab('crypto')}
          className={`px-6 py-2.5 rounded-lg transition-all
      ${activeTab === 'crypto'
              ? 'bg-secondary text-muted'
              : 'bg-transparent text-muted-foreground'
            }`}
        >
          Crypto
        </button>

        {/* MoneyX with image */}
        <button
          onClick={() => setActiveTab('moneyx')}
          className={`px-4 sm:px-6 py-1 md:py-2 rounded-lg transition-all flex items-center gap-1 
      ${activeTab === 'moneyx'
              ? 'bg-secondary text-muted'
              : 'bg-transparent text-muted-foreground'
            }`}
        >
          <span>Money</span>
          <img
            src={
              activeTab === 'moneyx'
                ? "https://res.cloudinary.com/pitz/image/upload/v1764663236/Group_7_ichuyz.png"
                : "https://res.cloudinary.com/pitz/image/upload/v1764661972/Group_6_ohph9q.png"
            }
            alt="X"
            className="h-5 -mb-1 w-auto"
          />
        </button>
      </div>

      <RatesCalculator />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-8 sm:mt-10 lg:mt-12 mb-3 sm:mb-4 lg:mb-4">
        <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold">
          {t("rates.transactions", "OMAYA Transactions")}
        </h2>
        <Link
          href="/market/live-transactions"
          className="text-secondary hover:text-[#0f8f4d] font-medium text-sm sm:text-base flex items-center gap-1 transition-colors"
        >
          Live Transactions →
        </Link>
      </div>
      <RatesTransactionHistory />
    </div>
  );
};

export default Rates;
