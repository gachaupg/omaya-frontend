"use client";

import SwapWidget from "@/features/swap/components/SwapWidget";
import { SwapDataProvider } from "@/features/swap/components/SwapDataProvider";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";

export default function SwapPage() {
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
    <SwapDataProvider>
      <div className="w-full overflow-x-hidden mt-3">
        <SwapWidget />
      </div>
    </SwapDataProvider>
  );
}
