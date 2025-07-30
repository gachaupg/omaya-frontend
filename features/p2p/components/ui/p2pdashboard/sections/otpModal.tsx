"use client";
import React, { useState, useEffect, useRef } from "react";
import Card from "../../../Common/Card";
import Button from "../../../Common/Button";
import Loader from "../../../Common/Loader";
import { showToast } from "@/lib/utils/toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { verifyWithdrawal } from "@/features/p2p/slices/withdrawSlice";
import { useRouter } from "next/navigation";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawalId: string;
  amount: string;
  onSuccess: () => void;
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  withdrawalId,
  amount,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [isRouterReady, setIsRouterReady] = useState(false);

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    const digits = pastedData.slice(0, 6).split("");

    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      showToast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(
        verifyWithdrawal({
          withdrawal_id: withdrawalId,
          otp: otpString,
        })
      );

      if (verifyWithdrawal.rejected.match(resultAction)) {
        throw new Error(resultAction.error.message || "Failed to verify OTP");
      }

      if (verifyWithdrawal.fulfilled.match(resultAction)) {
        console.log("OTP Verification Response:", resultAction.payload);
        showToast.success("Withdrawal verified successfully!");
        if (isRouterReady) {
          router.push("/dashboard/p2p/");
        }
        onSuccess();
        onClose();
      }
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      // You'll need to implement resend OTP API call here
      // const resultAction = await dispatch(resendWithdrawalOTP({ withdrawal_id: withdrawalId }));

      showToast.success("OTP resent successfully!");
      setCountdown(60); // 60 seconds countdown
    } catch (error) {
      showToast.error("Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md dark:bg-[#1D1D23] bg-white dark:border-[#35353E] border-gray-200 rounded-[24px] p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold dark:text-white text-gray-900 mb-2">
            Verify Withdrawal
          </h2>
          <p className="text-gray-400 text-sm">
            Enter the 6-digit code sent to your email/phone
          </p>
          <div className="mt-3 p-3 dark:bg-[#35353E] bg-gray-100 rounded-lg">
            <span className="dark:text-white text-gray-900 font-medium">
              Amount:{" "}
            </span>
            <span className="text-[#1D8751] font-semibold">${amount} USDT</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Enter OTP Code
            </label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-semibold dark:bg-[#35353E] bg-gray-100 dark:border-[#23232B] border-gray-200 border rounded-lg dark:text-white text-gray-900 focus:border-[#1D8751] focus:outline-none focus:ring-1 focus:ring-[#1D8751]"
                  placeholder=""
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              height={45}
              borderRadius={18}
              disabled={isSubmitting || otp.join("").length !== 6}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Withdrawal"
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isResending || countdown > 0}
              className="text-[#1D8751] hover:text-[#1D8751]/80 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isResending ? (
                <>
                  <Loader size="sm" className="mr-1" />
                  Resending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                "Resend Code"
              )}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#35353E]">
            <Button
              type="button"
              variant="outline"
              borderColor="#788099"
              className="w-full"
              height={40}
              borderRadius={18}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OTPModal;
