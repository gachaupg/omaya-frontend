"use client";

import React, { useState } from "react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: (code: string) => void | Promise<void>;
  onResendCode: () => void | Promise<void>;
  title?: string;
  description?: string;
  /** Optional highlighted banner shown above the description, e.g. explaining why verification is required. */
  notice?: string;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerify,
  onResendCode,
  title = "Email Verification Code",
  description = "Enter Verification code sent to",
  notice,
}: EmailVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reset timer when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeLeft(300);
      setCanResend(false);
      setVerificationCode(["", "", "", "", "", ""]);
      setError("");
    } else {
      // Clear timer when modal closes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isOpen]);

  // Timer countdown - runs continuously while modal is open and timeLeft > 0
  React.useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start the countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle paste event for OTP
  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    activeIndex: number
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Only allow numeric codes
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("").slice(0, 6); // Take first 6 digits
      const newCode = [...verificationCode];

      // Fill the codes starting from the current active input
      for (let i = 0; i < digits.length; i++) {
        if (activeIndex + i < 6) {
          newCode[activeIndex + i] = digits[i];
        }
      }

      setVerificationCode(newCode);
      setError("");

      // Focus the next empty input or submit if all are filled
      const nextEmptyIndex = newCode.findIndex(
        (digit, idx) => idx >= activeIndex && digit === ""
      );

      if (typeof document !== "undefined") {
        if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
          const nextInput = document.getElementById(`code-${nextEmptyIndex}`);
          nextInput?.focus();
        } else if (newCode.every((digit) => digit !== "")) {
          const submitButton = document.getElementById("verify-button");
          submitButton?.focus();
        }
      }
    }
  };

  // Handle input change for verification code
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5 && typeof document !== "undefined") {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (
      e.key === "Backspace" &&
      !verificationCode[index] &&
      index > 0 &&
      typeof document !== "undefined"
    ) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle verification
  const handleVerify = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setError("Please enter the complete verification code");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await onVerify(code);
    } catch (error: any) {
      setError(error?.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    setIsResending(true);
    setError("");
    try {
      await onResendCode();

      // Clear existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setCanResend(false);
      setVerificationCode(["", "", "", "", "", ""]);
      setTimeLeft(300); // Reset timer

      // Restart timer manually
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setError(error?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(24, 24, 29, 0.5)" }}
    >
      <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-8 max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Modal content */}
        <div className="text-center">
          {/* Title */}
          <h2 className="dark:text-white text-gray-900 text-2xl font-semibold mb-2">
            {title}
          </h2>

          {/* Notice - explains why verification is required, e.g. on login */}
          {notice && (
            <p className="text-[#1D8751] bg-[#1D8751]/10 border border-[#1D8751]/30 rounded-lg px-3 py-2 text-sm mb-4">
              {notice}
            </p>
          )}

          {/* Description */}
          <p className="text-[#788099] text-sm mb-6">
            {description}{" "}
            <span className="dark:text-white text-gray-900 font-medium">
              {email}
            </span>
          </p>

          {/* Verification code inputs */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-6">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(e, index)}
                onFocus={(e) => e.target.select()}
                className={`w-10 h-12 sm:w-12 sm:h-14 text-center dark:text-white text-gray-900 text-xl font-semibold dark:bg-[#35353E] bg-gray-100 border ${error
                  ? "border-[#F04438]"
                  : "border-gray-300 dark:border-[#35353E]"
                  } rounded-lg focus:outline-none focus:border-[#1D8751] transition-colors`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && <p className="text-[#F04438] text-sm mb-4">{error}</p>}

          {/* Timer */}
          <div className="mb-4">
            <p className="text-[#788099] text-sm">
              Having trouble?{" "}
              {canResend ? (
                <button
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="text-[#1D8751] hover:text-[#0E5531] cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? "Resending..." : "Resend OTP"}
                </button>
              ) : (
                <span className="text-[#788099]">
                  Request a new OTP in{" "}
                  <span className="text-[#1D8751]">
                    {formatTime(timeLeft)}s
                  </span>
                </span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-[#1D8751] text-[#1D8751]  transition-colors"
            >
              Close
            </button>
            <button
              id="verify-button"
              onClick={handleVerify}
              disabled={isLoading || verificationCode.join("").length !== 6}
              className="flex-1 bg-[#1D8751] text-white py-3 px-4 rounded-full hover:bg-[#0E5531] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationModal;
