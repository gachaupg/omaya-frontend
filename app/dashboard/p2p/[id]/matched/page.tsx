"use client";

import MatchedOrder from "@/features/p2p/components/matchedOrder";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";

// This tells Next.js that this is a dynamic route that should be generated at request time
export const dynamic = "force-dynamic";

export default function MatchedOrderPage() {
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

  return <MatchedOrder />;
}
