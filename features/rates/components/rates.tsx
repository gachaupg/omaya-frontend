"use client";
import React from "react";
import RatesCalculator from "./RatesCalculator";
import RatesTransactionHistory from "./RatesTransactionHistory";
import { useRatesI18n } from "@/lib/useRatesI18n";

const Rates = () => {
  const { t } = useRatesI18n();
  return (
    <div className="text-gray-900 dark:text-white  ">
      <h1 className="text-2xl font-bold mb-2">
        {t("rates.title", "Our Exchange Rates Calculator")}
      </h1>
      <p className="text-gray-700 dark:text-[#788099] mb-8 max-w-4xl">
        {t(
          "rates.subtitle",
          "Check live rates andkkkkkk estimate your transaction fees."
        )}
      </p>

      <RatesCalculator />

      <h2 className="text-2xl font-bold mt-12 mb-4">
        {t("rates.transactions", "OMAYA Transactions")}
      </h2>
      <RatesTransactionHistory />
    </div>
  );
};

export default Rates;
