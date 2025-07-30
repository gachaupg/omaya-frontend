"use client";
import React from "react";
import { useSearchParams } from "next/navigation";

const MatchedOrder = () => {
  const searchParams = useSearchParams();
  const orderData = searchParams?.get("orderData");

  return (
    <div className="p-4 dark:bg-[#1D1D23] bg-white min-h-screen">
      <h1 className="text-xl font-bold mb-4 dark:text-white text-gray-900">
        Matched Order Details
      </h1>
      {orderData && (
        <pre className="dark:bg-[#23232B] bg-gray-100 dark:text-white text-gray-900 p-4 rounded dark:border-[#35353E] border-gray-200 border">
          {JSON.stringify(JSON.parse(orderData), null, 2)}
        </pre>
      )}
    </div>
  );
};

export default MatchedOrder;
