"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";

interface P2PTradeCanceledModalProps {
  isOpen: boolean;
  /** Optional line from the server (e.g. “Trade status: canceled”). */
  message?: string;
  onClose: () => void;
  isDark?: boolean;
}

/**
 * P2P market only — trade canceled via WebSocket. Not the express FailureStatusModal.
 */
export default function P2PTradeCanceledModal({
  isOpen,
  message,
  onClose,
  isDark = false,
}: P2PTradeCanceledModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    router.push("/dashboard/p2p");
  };

  const body =
    message?.trim() ||
    "This trade has been canceled. You can return to the market to start a new trade.";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative mx-4 w-full max-w-md">
        <div
          className={`rounded-2xl border p-6 shadow-2xl ${
            isDark
              ? "border-[#35353E] bg-[#23232B]"
              : "border-gray-200 bg-white dark:border-[#35353E] dark:bg-[#23232B]"
          }`}
        >
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
              <Ban className="h-8 w-8 text-amber-500" aria-hidden />
            </div>
            <h2
              className={`text-xl font-semibold ${
                isDark ? "text-white" : "text-gray-900 dark:text-white"
              }`}
            >
              Trade canceled
            </h2>
          </div>
          <p
            className={`mb-6 text-center text-sm leading-relaxed ${
              isDark ? "text-[#A8A8B0]" : "text-gray-600 dark:text-[#A8A8B0]"
            }`}
          >
            {body}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-xl bg-[#1D8751] py-3 font-medium text-white transition-colors hover:bg-[#166b3e]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
