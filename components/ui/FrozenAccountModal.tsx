"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface FrozenAccountModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function FrozenAccountModal({
  isOpen,
  onClose,
}: FrozenAccountModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1D1D23] border border-[#E5E7EB] dark:border-[#35353E] p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#E23D3A]">
          Account Frozen
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-[#C7CAD8] leading-relaxed">
          Your account is frozen. Please contact Customer Support to unfreeze
          your account.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/contactUs")}
            className="flex-1 rounded-xl bg-[#1D8751] hover:bg-[#17683f] text-white font-medium py-2.5"
          >
            Contact Support
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#D1D5DB] dark:border-[#4B5563] text-gray-700 dark:text-[#D1D5DB] px-4 py-2.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

