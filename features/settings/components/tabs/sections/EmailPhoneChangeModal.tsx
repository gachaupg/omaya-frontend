"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  requestProfileChange,
  verifyProfileChange,
  fetchProfile,
} from "@/features/settings/slices/settingsSlice";
import { updateUser } from "@/features/auth/slices/authSlice";
import { showToast } from "@/lib/utils/toast";

type ChangeType = "email" | "phone";

interface EmailPhoneChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ChangeType;
  currentValue: string;
  initialValue?: string;
}

const EmailPhoneChangeModal: React.FC<EmailPhoneChangeModalProps> = ({
  isOpen,
  onClose,
  type,
  currentValue,
  initialValue,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [value, setValue] = useState(initialValue ?? currentValue);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = type === "email" ? "Email" : "Phone Number";
  const placeholder =
    type === "email" ? "newemail@example.com" : "+254712345678";

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue ?? currentValue);
      setOtp("");
      setStep("input");
      setError(null);
    }
  }, [isOpen, currentValue, initialValue, type]);

  const validateValue = (): boolean => {
    if (type === "email") {
      const valid = /\S+@\S+\.\S+/.test(value.trim());
      if (!valid) {
        setError("Please enter a valid email address");
        return false;
      }
    } else {
      if (!value.trim() || value.replace(/\D/g, "").length < 9) {
        setError("Please enter a valid phone number");
        return false;
      }
    }
    return true;
  };

  const handleSendOtp = async () => {
    setError(null);
    if (!validateValue()) return;
    if (value.trim() === currentValue) {
      setError(`Please enter a different ${label.toLowerCase()} than your current one`);
      return;
    }

    setLoading(true);
    try {
      const valueToSend =
        type === "phone"
          ? value.startsWith("+")
            ? value
            : `+${value.replace(/\D/g, "")}`
          : value.trim();
      await dispatch(
        requestProfileChange({
          type,
          value: valueToSend,
        })
      ).unwrap();
      showToast.success(
        type === "email"
          ? "OTP sent to your new email address"
          : "OTP sent to your email address"
      );
      setStep("otp");
      setOtp("");
    } catch (err: any) {
      const message =
        typeof err === "string"
          ? err
          : err?.error ?? err?.message ?? err?.detail ?? "Failed to send OTP";
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (!otp.trim() || otp.length < 4) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const valueToSend =
        type === "phone"
          ? value.startsWith("+")
            ? value
            : `+${value.replace(/\D/g, "")}`
          : value.trim();
      await dispatch(
        verifyProfileChange({
          otp: otp.trim(),
          value: valueToSend,
          field: type === "email" ? "email" : "phone_number",
        })
      ).unwrap();

      dispatch(
        updateUser(
          type === "email"
            ? { email: value.trim() }
            : { phone_number: valueToSend }
        )
      );
      // Refetch profile so BasicInfoSection and other components display updated data
      dispatch(fetchProfile());
      showToast.success(
        type === "email"
          ? "Your email has been updated successfully"
          : "Your phone number has been updated successfully"
      );
      onClose();
    } catch (err: any) {
      const message =
        typeof err === "string"
          ? err
          : err?.error ?? err?.message ?? err?.detail ?? "Verification failed";
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(24, 24, 29, 0.5)" }}
    >
      <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-gray-200 dark:border-[#35353E]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Change {label}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "input" ? (
          <>
            <p className="text-sm text-gray-600 dark:text-[#9CA3AF] mb-4">
              Enter your new {label.toLowerCase()}. We&apos;ll send a verification code to confirm.
            </p>
            <input
              type={type === "email" ? "email" : "tel"}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder={placeholder}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-[#35353e] bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751] mb-4"
            />
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-[#9CA3AF] mb-4">
              Enter the verification code sent to your new {label.toLowerCase()}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="Enter OTP"
              className="w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-[#35353e] bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751] mb-4"
            />
          </>
        )}

        {error && (
          <p className="text-sm text-[#F04438] mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          {step === "otp" && (
            <button
              type="button"
              onClick={() => setStep("input")}
              className="flex-1 py-2.5 rounded-lg border border-[#1D8751] text-[#1D8751] font-medium hover:bg-[#1D8751]/10 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={step === "input" ? handleSendOtp : handleVerify}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[#1D8751] text-white font-medium hover:bg-[#167a47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Please wait..."
              : step === "input"
                ? "Send OTP"
                : "Verify & Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPhoneChangeModal;
