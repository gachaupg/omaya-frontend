"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import type { RejectionData } from "@/features/p2p/hooks/useP2PWithdrawalStatusWebSocket";

interface P2PWithdrawalRejectionModalProps {
  isOpen: boolean;
  data: RejectionData | null;
  onDismiss: () => void;
}

export default function P2PWithdrawalRejectionModal({
  isOpen,
  data,
  onDismiss,
}: P2PWithdrawalRejectionModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4">
      <div
        className="absolute inset-0"
        onClick={onDismiss}
        aria-hidden="true"
      />
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
            {data?.reason && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Reason: {data.reason}
              </p>
            )}
            {data?.amount && data?.currency && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Amount: {data.amount} {data.currency}
              </p>
            )}
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
              This will not be shown again until your next withdrawal.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
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
