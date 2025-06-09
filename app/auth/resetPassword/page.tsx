"use client";
import { Suspense } from "react";
import ResetPassword from "@/features/auth/components/ResetPassword";

const ForgotPassword = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#18181D] items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
};

export default ForgotPassword;
