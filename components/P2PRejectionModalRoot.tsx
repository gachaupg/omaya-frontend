"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import {
  subscribeToRejection,
  setGlobalRejection,
} from "@/features/p2p/services/p2pWithdrawalStatusWebSocket";

const DISMISSED_KEY = "p2p_withdraw_rejection_dismissed_";

function setDismissed(transactionId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${DISMISSED_KEY}${transactionId}`, "true");
  }
}

export default function P2PRejectionModalRoot() {
  const [rejection, setRejection] = useState<{
    transactionId: string;
    reason?: string;
    amount?: string;
    currency?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const unsub = subscribeToRejection((v) => setRejection(v));
    return () => { unsub(); };
  }, [mounted]);

  const handleDismiss = () => {
    if (rejection?.transactionId) setDismissed(rejection.transactionId);
    setGlobalRejection(null);
    setRejection(null);
    window.location.reload();
  };

  if (!rejection || !mounted || typeof document === "undefined") return null;

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4">
      <div className="absolute inset-0" onClick={handleDismiss} aria-hidden="true" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#18181D] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#E23D3A]/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#E23D3A]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Your request was rejected
            </h2>
            {rejection.reason && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Reason: {rejection.reason}
              </p>
            )}
            {rejection.amount && rejection.currency && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Amount: {rejection.amount} {rejection.currency}
              </p>
            )}
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
              This will not be shown again until your next withdrawal.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#1D8751] hover:bg-[#167a45] transition-colors"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
