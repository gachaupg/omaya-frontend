import React from "react";
import Button from "@/features/p2p/components/Common/Button";
import { X, AlertTriangle } from "lucide-react";

interface DeleteErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string | null;
  /** When set, show guidance and a link to the active trade */
  onViewActiveTrade?: () => void;
}

const DeleteErrorModal: React.FC<DeleteErrorModalProps> = ({
  isOpen,
  onClose,
  error,
  onViewActiveTrade,
}) => {
  if (!isOpen || !error) return null;

  const showActiveTradeAction = Boolean(onViewActiveTrade);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1D1D23] rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-200 dark:border-accent transform transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-accent">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {showActiveTradeAction ? "Ad cannot be removed" : "Deletion Failed"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              {error}
            </p>
            {showActiveTradeAction && (
              <p className="text-gray-500 dark:text-[#8C8CA1] text-sm mt-3 leading-relaxed">
                Complete or cancel the active trade first, or open it below to
                continue.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-accent flex flex-col sm:flex-row gap-2 sm:justify-end">
          {showActiveTradeAction && (
            <Button
              onClick={() => {
                onViewActiveTrade?.();
                onClose();
              }}
              variant="primary"
              className="w-full sm:w-auto px-6 py-2 order-1 sm:order-2"
            >
              View Active Trade
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full sm:w-auto px-6 py-2 order-2 sm:order-1"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteErrorModal;
