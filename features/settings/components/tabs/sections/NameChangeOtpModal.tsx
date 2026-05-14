"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { updateProfile, fetchProfile } from "@/features/settings/slices/settingsSlice";
import { showToast } from "@/lib/utils/toast";

interface NameChangeOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  introMessage: string;
  firstName: string;
  lastName: string;
}

const NameChangeOtpModal: React.FC<NameChangeOtpModalProps> = ({
  isOpen,
  onClose,
  introMessage,
  firstName,
  lastName,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const isOpenRef = useRef(isOpen);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendRemaining, setResendRemaining] = useState(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError(null);
      setResendRemaining(60);
    }
  }, [isOpen, firstName, lastName]);

  useEffect(() => {
    if (!isOpen || resendRemaining <= 0) return;
    const timer = setInterval(() => {
      setResendRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, resendRemaining]);

  const handleClose = () => {
    setOtp("");
    setError(null);
    onClose();
  };

  const handleResend = async () => {
    if (loading || resendRemaining > 0) return;
    setError(null);
    setLoading(true);
    try {
      const result = await dispatch(
        updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })
      ).unwrap();
      if (!isOpenRef.current) return;
      if (result.outcome === "otp_required") {
        setResendRemaining(60);
        showToast.success("OTP resent to your email");
      } else {
        showToast.info(result.outcome === "success" ? "Updated" : "Unexpected response");
      }
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
      const result = await dispatch(
        updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          otp: otp.trim(),
        })
      ).unwrap();
      if (!isOpenRef.current) return;
      if (result.outcome === "otp_required") {
        const msg =
          result.message ||
          "That code was not accepted. Request a new OTP or try again.";
        setError(msg);
        showToast.error(msg);
        return;
      }
      await dispatch(fetchProfile());
      handleClose();
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
            Confirm name change
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-[#9CA3AF] mb-2">
          {introMessage}
        </p>
        <p className="text-sm text-gray-700 dark:text-[#CBD5E1] mb-4">
          New name:{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {firstName.trim()} {lastName.trim()}
          </span>
        </p>

        <input
          type="text"
          inputMode="numeric"
          maxLength={8}
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, ""));
            setError(null);
          }}
          placeholder="Enter OTP from email"
          className="w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-[#35353e] bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751] mb-4"
        />

        {error && <p className="text-sm text-[#F04438] mb-4">{error}</p>}

        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#1D8751] text-white font-medium hover:bg-[#167a47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {loading ? "Please wait..." : "Verify & update name"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendRemaining > 0}
            className="text-sm font-medium text-[#1D8751] disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
          >
            {resendRemaining > 0 ? `Resend OTP in ${resendRemaining}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NameChangeOtpModal;
