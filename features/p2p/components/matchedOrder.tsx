"use client";
import React from "react";
import { useSearchParams } from "next/navigation";

const MatchedOrder = () => {
  const searchParams = useSearchParams();
  const orderData = searchParams.get("orderData");

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Matched Order Details</h1>
      {orderData && (
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(JSON.parse(orderData), null, 2)}
        </pre>
      )}
    </div>
  );
};

export default MatchedOrder;
