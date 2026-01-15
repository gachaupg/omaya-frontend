"use client";

import React from "react";
import Express from "@/features/express/components/express";
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
    <div className="w-full px-0 overflow-x-hidden">
      <Express />
    </div>
  );
};

export default Page;
