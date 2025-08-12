"use client";
import React from "react";
import RatesCalculator from "./RatesCalculator";
import RatesTransactionHistory from "./RatesTransactionHistory";

const Rates = () => {
  return (
    <div className="text-gray-900 dark:text-white  ">
      <h1 className="text-2xl font-bold mb-2">Our Exchange Rates Calculator</h1>
      <p className="text-gray-700 dark:text-[#788099] mb-8 max-w-4xl">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat
      </p>

      <RatesCalculator />

      <h2 className="text-2xl font-bold mt-12 mb-4">OMAYA Transactions</h2>
      <RatesTransactionHistory />
    </div>
  );
};

export default Rates;
