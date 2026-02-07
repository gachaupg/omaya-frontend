"use client";

import Settings from "@/features/settings/components/settings";
import { SettingsDataProvider } from "@/features/settings/components/SettingsDataProvider";
import React from "react";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";

const Page = () => {
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
    <SettingsDataProvider>
      <div className="w-full overflow-x-hidden">
        <Settings />
      </div>
    </SettingsDataProvider>
  );
};

export default Page;
