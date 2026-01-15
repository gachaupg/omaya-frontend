"use client";

import React, { Suspense } from "react";
import Exchanging from "@/features/moneyX/components/Exchanging";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";

function ExchangingContent() {
  const { isChecking, isVerified } = useRouteProtection();

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" color="#1D8751" />
      </div>
    );
  }

  if (isVerified === false) {
    return null; // Modal will be shown by the hook
  }

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







