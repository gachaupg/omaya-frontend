"use client";
import { Suspense } from "react";
import ResetPassword from "@/features/auth/components/ResetPassword";

const ForgotPassword = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen dark:bg-[#18181D] bg-gray-50 items-center justify-center">
          <div className="dark:text-white text-gray-900">Loading...</div>
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
};

export default ForgotPassword;
