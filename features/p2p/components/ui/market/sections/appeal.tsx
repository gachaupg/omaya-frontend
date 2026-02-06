import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { logger } from '@/lib/utils/logger';

import {
  createAppealThunk,
  resetAppealState,
} from "@/features/p2p/slices/appealSlice";

interface AppealModalProps {
  open: boolean;
  onClose: () => void;
  tradeId: string;
}

const APPEAL_REASONS = [
  { value: "Order not received", label: "Order not received" },
  { value: "Payment not confirmed", label: "Payment not confirmed" },
  { value: "Other issues", label: "Other issues" },
];

const AppealModal: React.FC<AppealModalProps> = ({
  open,
  onClose,
  tradeId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector(
    (state: RootState) => state.appeal
  );
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging for state changes
  useEffect(() => {
    logger.debug('p2p', "AppealModal state:", {
      open,
      tradeId,
      reason: selectedReason === "Other issues" ? customReason : selectedReason,
      loading,
      success,
    });
  }, [open, tradeId, selectedReason, customReason, loading, success]);

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(resetAppealState());
        onClose();
      }, 1200);
    }
  }, [success, dispatch, onClose]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setCustomReason("");
      setScreenshot(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, previewUrl]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      logger.debug('p2p', "File selected:", file.name);
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setScreenshot(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    logger.debug('p2p', "Reason changed to:", value);
    setSelectedReason(value);
    if (value !== "Other issues") {
      setCustomReason("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reasonToSubmit =
      selectedReason === "Other issues" ? customReason.trim() : selectedReason.trim();

    logger.debug('p2p', "Submit attempted with:", {
      reason: reasonToSubmit,
      tradeId,
      hasScreenshot: !!screenshot,
    });

    if (!reasonToSubmit || !tradeId) {
      logger.debug('p2p', "Form validation failed:", { reason: reasonToSubmit, tradeId });
      return;
    }

    const formData = new FormData();
    formData.append("trade_id", tradeId);
    formData.append("reason_for_appeal", reasonToSubmit);
    if (screenshot) {
      formData.append("screenshot", screenshot);
    }

    logger.debug('p2p', "Submitting appeal with:", {
      tradeId,
      reason: reasonToSubmit,
      hasScreenshot: !!screenshot,
    });
    dispatch(createAppealThunk(formData) as any);
  };

  // Simplified validation - only require reason to be selected
  const resolvedReason =
    selectedReason === "Other issues" ? customReason.trim() : selectedReason.trim();
  const isFormValid = resolvedReason !== "" && !!tradeId;

  logger.debug('p2p', "Form validation:", { isFormValid, reason: resolvedReason, tradeId });

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-12 pb-12 px-4 md:pt-16 md:pb-20 md:px-0 pointer-events-none overflow-y-auto">
      <div className="pointer-events-auto dark:bg-[var(--card-color)] bg-white rounded-[24px] p-6 md:p-8 w-full max-w-md shadow-xl border border-gray-200 dark:border-[#35353E] relative max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-6rem)] overflow-y-auto">
        <h2 className="text-[13px] text-center dark:text-white text-gray-900 mb-6">
          Submit Appeal
        </h2>
        {/* Instruction Box */}
        <div className="bg-[#A05C2F] bg-opacity-30 rounded-xl p-4 mb-6">
          <div className="text-[#FFB37A] text-[13px] mb-1">
            1. Select the reason for your appeal from the dropdown menu below
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Appeal Reason */}
          <div>
            <label className="block dark:text-white text-gray-900 text-[13px] mb-2">
              Appeal Reason *
            </label>
            <div className="relative">
              <select
                className="w-full rounded-xl px-4 py-3 dark:bg-[var(--card-color)] bg-gray-100 dark:text-white text-gray-900 dark:border-[#35353E] border-gray-300 border focus:outline-none appearance-none"
                value={selectedReason}
                onChange={handleReasonChange}
                required
              >
                <option value="">Select the reason for appeal</option>
                {APPEAL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888] pointer-events-none">
                &#9662;
              </span>
            </div>
            {selectedReason && selectedReason !== "Other issues" && (
              <div className="text-green-500 text-[11px] mt-1">
                ✓ Reason selected: {selectedReason}
              </div>
            )}
            {selectedReason === "Other issues" && (
              <div className="mt-3">
                <label className="block text-[12px] text-gray-600 dark:text-[#A3A3C2] mb-1">
                  Tell us more
                </label>
                <textarea
                  className="w-full rounded-xl px-4 py-3 dark:bg-[var(--card-color)] bg-gray-100 dark:text-white text-gray-900 dark:border-[#35353E] border-gray-300 border focus:outline-none resize-none"
                  rows={3}
                  placeholder="Describe the issue you’re experiencing"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
                {/* <div className="text-[11px] mt-1">
                  {customReason.trim() ? (
                    // <span className="text-green-500">
                    //   ✓ Reason entered: {customReason.trim()}
                    // </span>
                  ) : (
                    <span className="text-[#FFB37A]">Please describe the issue to continue.</span>
                  )}
                </div> */}
              </div>
            )}
          </div>
          {/* Upload Proof */}
          <div>
            <label className="block dark:text-white text-gray-900 text-[13px] mb-2">
              Upload Proof Documents (Optional)
            </label>
            <div className="text-[#888] text-[13px] mb-4">
              Upload screenshots or images that support your appeal. Acceptable formats include PNG, JPG, and other common image types.
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                className="py-2 px-10 rounded-full dark:bg-[#35353E] bg-gray-200 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-[#404040] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-[#1D8751]"
                >
                  <path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              <span className="text-[#888] text-[13px]">
                {screenshot ? screenshot.name : "No file selected"}
              </span>
            </div>
            {previewUrl && (
              <div className="mt-4 p-3 rounded-xl border border-gray-200 dark:border-[#35353E] bg-gray-50 dark:bg-[#23232B]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[12px] text-gray-600 dark:text-[#A3A3C2]">Preview</span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[12px] text-[#E23D3A] hover:text-[#c93429] font-medium"
                  >
                    Remove & choose another
                  </button>
                </div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 w-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-[#1D8751] bg-transparent text-[#1D8751] py-3 font-semibold hover:bg-[#1D8751]/10 transition"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
            <button
              type="submit"
              className={`flex-1 rounded-xl py-3 font-semibold transition ${
                isFormValid && !loading
                  ? "bg-[#1D8751] text-white hover:bg-[#17693f] cursor-pointer"
                  : "bg-[#35353E] text-[#888] cursor-not-allowed"
              }`}
              disabled={loading || !isFormValid}
              onClick={() =>
                logger.debug('p2p', "Button clicked! Form valid:", isFormValid)
              }
            >
              {loading ? "Submitting..." : "Appeal"}
            </button>
          </div>
          {error && (
            <div className="text-red-500 text-[13px] text-center">
              {error || "An error occurred while creating the appeal"}
            </div>
          )}
          {success && (
            <div className="text-green-500 text-[13px] text-center">
              Appeal submitted!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AppealModal;
