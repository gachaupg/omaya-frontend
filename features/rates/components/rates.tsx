"use client";
import React from "react";
import Link from "next/link";
import RatesCalculator from "./RatesCalculator";
import RatesTransactionHistory from "./RatesTransactionHistory";
import { useRatesI18n } from "@/lib/useRatesI18n";

const Rates = () => {
  const { t } = useRatesI18n();
  return (
    <div className="text-gray-900 dark:text-white px-4 sm:px-6 lg:px-0">
      <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold mb-2">
        {t("rates.title", "Our Exchange Rates Calculator")}
      </h1>
      <p className="text-gray-700 dark:text-[#788099] mb-6 sm:mb-8 lg:mb-8 max-w-full sm:max-w-2xl lg:max-w-4xl">
        {t(
          "rates.subtitle",
          "Check live rates andkkkkkk estimate your transaction fees."
        )}
      </p>

      <RatesCalculator />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-8 sm:mt-10 lg:mt-12 mb-3 sm:mb-4 lg:mb-4">
        <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold">
          {t("rates.transactions", "OMAYA Transactions")}
        </h2>
        <Link 
          href="/market/live-transactions"
          className="text-[#13B562] hover:text-[#0f8f4d] font-medium text-sm sm:text-base flex items-center gap-1 transition-colors"
        >
          Live Transactions →
        </Link>
      </div>
      <RatesTransactionHistory />
    </div>
  );
};

export default Rates;
