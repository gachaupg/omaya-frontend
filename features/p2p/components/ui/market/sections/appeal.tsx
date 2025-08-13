import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
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
  const [reason, setReason] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging for state changes
  useEffect(() => {
    console.log("AppealModal state:", {
      open,
      tradeId,
      reason,
      loading,
      success,
    });
  }, [open, tradeId, reason, loading, success]);

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
      setReason("");
      setScreenshot(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name);
      setScreenshot(file);
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedReason = e.target.value;
    console.log("Reason changed to:", selectedReason);
    setReason(selectedReason);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit attempted with:", {
      reason,
      tradeId,
      hasScreenshot: !!screenshot,
    });

    if (!reason || !tradeId) {
      console.log("Form validation failed:", { reason, tradeId });
      return;
    }

    const formData = new FormData();
    formData.append("trade_id", tradeId);
    formData.append("reason_for_appeal", reason);
    if (screenshot) {
      formData.append("screenshot", screenshot);
    }

    console.log("Submitting appeal with:", {
      tradeId,
      reason,
      hasScreenshot: !!screenshot,
    });
    dispatch(createAppealThunk(formData) as any);
  };

  // Simplified validation - only require reason to be selected
  const isFormValid = reason.trim() !== "";

  console.log("Form validation:", { isFormValid, reason, tradeId });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="dark:bg-[#23232A] bg-white rounded-[24px] p-8 w-full max-w-md shadow-lg relative">
        <h2 className="text-[13px] text-center dark:text-white text-gray-900 mb-6">
          Submit Appeal
        </h2>
        {/* Instruction Box */}
        <div className="bg-[#A05C2F] bg-opacity-30 rounded-xl p-4 mb-6">
          <div className="text-[#FFB37A] text-[13px] mb-1">
            1. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sedl
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
                className="w-full rounded-xl px-4 py-3 dark:bg-[#18181D] bg-gray-100 dark:text-white text-gray-900 dark:border-[#35353E] border-gray-300 border focus:outline-none appearance-none"
                value={reason}
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
            {reason && (
              <div className="text-green-500 text-[11px] mt-1">
                ✓ Reason selected: {reason}
              </div>
            )}
          </div>
          {/* Upload Proof */}
          <div>
            <label className="block dark:text-white text-gray-900 text-[13px] mb-2">
              Upload Proof Documents (Optional)
            </label>
            <div className="text-[#888] text-[13px] mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                className="py-2 px-10 rounded-full dark:bg-[#35353E] bg-gray-200 flex items-center justify-center"
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
                console.log("Button clicked! Form valid:", isFormValid)
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
