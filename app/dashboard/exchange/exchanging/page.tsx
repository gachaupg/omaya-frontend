"use client";

import React, { Suspense } from "react";
import Exchanging from "@/features/moneyX/components/Exchanging";

function ExchangingContent() {
  return <Exchanging />;
}

function ExchangingLoading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading transaction...</p>
      </div>
    </div>
  );
}

export default function ExchangingPage() {
  return (
    <Suspense fallback={<ExchangingLoading />}>
      <ExchangingContent />
    </Suspense>
  );
}


