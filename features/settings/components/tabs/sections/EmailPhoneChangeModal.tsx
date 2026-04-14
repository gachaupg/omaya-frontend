"use client";

import React, { useState, useEffect, useRef } from "react";
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
const PROFILE_CHANGE_OTP_PENDING_KEY = "profile_change_otp_pending_v1";

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
  const isOpenRef = useRef(isOpen);
  const [value, setValue] = useState(initialValue ?? currentValue);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendRemaining, setResendRemaining] = useState(0);

  const label = type === "email" ? "Email" : "Phone Number";
  const placeholder =
    type === "email" ? "newemail@example.com" : "+254712345678";
  const otpDestinationText =
    type === "email" ? "your new email address" : "your registered email address";

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const handleCloseModal = () => {
    try {
      localStorage.removeItem(PROFILE_CHANGE_OTP_PENDING_KEY);
    } catch {
      // Ignore localStorage errors
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const fallbackValue = initialValue ?? currentValue;
      let pendingValue: string | null = null;
      let pendingSentAt = 0;
      try {
        const raw = localStorage.getItem(PROFILE_CHANGE_OTP_PENDING_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            type?: ChangeType;
            value?: string;
            sentAt?: number;
          };
          if (parsed?.type === type && parsed?.value) {
            pendingValue = parsed.value;
            pendingSentAt = Number(parsed.sentAt || 0);
          }
        }
      } catch {
        // Ignore malformed persisted OTP state
      }
      const initialStep = pendingValue ? "otp" : "input";
      const now = Date.now();
      const remaining = pendingSentAt
        ? Math.max(0, 60 - Math.floor((now - pendingSentAt) / 1000))
        : 0;

      setValue(pendingValue ?? fallbackValue);
      setOtp("");
      setStep(initialStep);
      setError(null);
      setResendRemaining(remaining);
    }
  }, [isOpen, currentValue, initialValue, type]);

  useEffect(() => {
    if (!isOpen || step !== "otp" || resendRemaining <= 0) return;
    const timer = setInterval(() => {
      setResendRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, resendRemaining]);

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
      if (!isOpenRef.current) return;
      localStorage.setItem(
        PROFILE_CHANGE_OTP_PENDING_KEY,
        JSON.stringify({
          type,
          value: valueToSend,
          sentAt: Date.now(),
        })
      );
      showToast.success(
        `OTP sent to ${otpDestinationText}`
      );
      setStep("otp");
      setOtp("");
      setResendRemaining(60);
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

  const handleResendOtp = async () => {
    if (loading || resendRemaining > 0) return;
    setError(null);
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
      if (!isOpenRef.current) return;
      localStorage.setItem(
        PROFILE_CHANGE_OTP_PENDING_KEY,
        JSON.stringify({
          type,
          value: valueToSend,
          sentAt: Date.now(),
        })
      );
      setResendRemaining(60);
      showToast.success("OTP resent successfully");
    } catch (err: any) {
      const message =
        typeof err === "string"
          ? err
          : err?.error ?? err?.message ?? err?.detail ?? "Failed to resend OTP";
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
      localStorage.removeItem(PROFILE_CHANGE_OTP_PENDING_KEY);

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
      handleCloseModal();
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
            onClick={handleCloseModal}
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
              Enter your new {label.toLowerCase()}.
              {type === "email"
                ? " We’ll send a verification code to that email to confirm."
                : " We’ll send a verification code to your registered email to confirm."}
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
              Enter the verification code sent to {otpDestinationText}
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
        {step === "otp" && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || resendRemaining > 0}
              className="text-sm font-medium text-[#1D8751] disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
            >
              {resendRemaining > 0
                ? `Resend OTP in ${resendRemaining}s`
                : "Resend OTP"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPhoneChangeModal;
