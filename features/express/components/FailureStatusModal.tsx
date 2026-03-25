'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FailureStatusModalProps {
  isOpen: boolean;
  status: string;
  /** When set, replaces the default title derived from `status` (e.g. P2P "Trade canceled"). */
  title?: string;
  message?: string;
  onClose: () => void;
  onBackToForm: () => void;
  isDark?: boolean;
}

const DEFAULT_BODY =
  'Your transaction could not be completed. Please try again or contact support if the issue persists.';

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    failed: 'Transaction Failed',
    rejected: 'Your has been Transaction Rejected',
    stopped: 'Transaction Stopped',
  };
  return labels[status?.toLowerCase()] || `Transaction ${status}`;
};

/** Splits resolver output "reason\n\ndetail" into two parts. */
function splitReasonAndDetail(text: string): { reason: string; detail?: string } {
  const trimmed = text.trim();
  const parts = trimmed
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const [reason, ...rest] = parts;
    return { reason, detail: rest.join('\n\n') };
  }
  return { reason: trimmed };
}

const FailureStatusModal: React.FC<FailureStatusModalProps> = ({
  isOpen,
  status,
  title,
  message,
  onClose,
  onBackToForm,
  isDark = false,
}) => {
  if (!isOpen) return null;

  const statusLabel = title?.trim() || getStatusLabel(status);

  const handleClose = () => {
    onClose();
    if (typeof window !== 'undefined') window.location.reload();
  };

  const trimmedMessage = message?.trim();
  const hasCustomReason = Boolean(trimmedMessage);
  const { reason, detail } = hasCustomReason
    ? splitReasonAndDetail(trimmedMessage!)
    : { reason: '', detail: undefined };

  const muted = isDark ? 'text-[#7B7B7B]' : 'text-gray-600 dark:text-[#7B7B7B]';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-md mx-4">
        <div
          className={`rounded-2xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#23232B] border-[#35353E]' : 'bg-white border-gray-200 dark:bg-[#23232B] dark:border-[#35353E]'
          }`}
        >
          {/* Icon & Title */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2
              className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}
            >
              {statusLabel}
            </h2>
          </div>

          {/* Reason / detail / default */}
          <div className={`mb-6 ${hasCustomReason ? 'text-left' : 'text-center'}`}>
            {hasCustomReason ? (
              <div className={`space-y-3 text-sm leading-relaxed ${muted}`}>
                <p className="whitespace-pre-line break-words">
                  <span
                    className={`font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    Reason:
                  </span>{' '}
                  <span className="font-medium">{reason}</span>
                </p>
                {detail ? (
                  <p className="whitespace-pre-line break-words border-t border-gray-200 pt-3 dark:border-[#35353E]">
                    <span
                      className={`font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      Details:
                    </span>{' '}
                    {detail}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className={`whitespace-pre-line text-sm leading-relaxed ${muted}`}>{DEFAULT_BODY}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onBackToForm}
              className="w-full flex items-center justify-center gap-2 bg-[#1D8751] hover:bg-[#166b3e] text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className={`w-full border font-medium py-3 px-4 rounded-xl transition-colors duration-200 ${
                isDark
                  ? 'border-[#35353E] text-[#7B7B7B] hover:bg-[#35353E]'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-[#35353E] dark:text-[#7B7B7B] dark:hover:bg-[#35353E]'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailureStatusModal;
