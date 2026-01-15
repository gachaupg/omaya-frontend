"use client";

import { Suspense } from "react";
import P2PLayout from "@/features/p2p/components/P2PLayout";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";

export default function P2PPage() {
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

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D8751]" />
    </div>}>
      <P2PLayout />
    </Suspense>
  );
}
