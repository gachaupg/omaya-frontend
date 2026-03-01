/**
 * RegisterForm.tsx – auto‑generated placeholder
 */
"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { registerUser, verifyOTP } from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/features/auth/store";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/lib/utils/toast";
import axios from "axios";
import { toast } from "react-toastify";
// Dynamic import for GoogleAuthButton
const GoogleAuthButton = React.lazy(() => import("./GoogleAuthButton"));
// Dynamic import for FacebookAuthButton
const FacebookAuthButton = React.lazy(() => import("./FacebookAuthButton"));
import { useI18n } from "@/lib/useI18n";
import { countries } from "./countries";

// Email Verification Modal Component
interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: (code: string) => void;
  onResendCode: () => void;
}

function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerify,
  onResendCode,
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
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reset timer when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeLeft(300);
      setCanResend(false);
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
    try {
      await onVerify(code);
    } catch (error) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCanResend(false);
    setVerificationCode(["", "", "", "", "", ""]);
    setError("");
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

    await onResendCode();
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
            Email Verification Code
          </h2>

          {/* Description */}
          <p className="text-[#788099] text-sm mb-6">
            Enter Verification code sent to{" "}
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
                  className="text-[#1D8751] hover:text-[#0E5531] cursor-pointer font-medium"
                >
                  Resend OTP
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

export default function RegistrationPage() {
  const { t } = useI18n("auth");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const termsAgreementError = t(
    "auth.register.mustAgree",
    "You must agree to the terms and conditions"
  );

  // Get referral code from URL parameter
  const refCodeFromUrl = searchParams?.get("ref") ?? "";

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refCodeFromUrl);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("SO"); // Default to Somalia
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const countryTriggerRef = useRef<HTMLDivElement>(null);
  const [countryDropdownRect, setCountryDropdownRect] = useState({ top: 0, left: 0, width: 240 });
  const [showReferralTooltip, setShowReferralTooltip] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const referralTooltipRef = React.useRef<HTMLDivElement | null>(null);
  const referralTooltipButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const errorBannerRef = React.useRef<HTMLDivElement | null>(null);

  // Facebook login state
  const [profile, setProfile] = useState<any>(null);

  // Filter countries based on search term
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
      country.dialCode.includes(countrySearchTerm)
  );

  // Position dropdown when it opens (viewport coords for position: fixed)
  useEffect(() => {
    if (!showCountryDropdown || !countryTriggerRef.current) return;
    const el = countryTriggerRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setCountryDropdownRect({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
    };
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [showCountryDropdown]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showCountryDropdown &&
        !target.closest(".country-dropdown-container") &&
        !target.closest(".country-dropdown-panel")
      ) {
        setShowCountryDropdown(false);
        setCountrySearchTerm(""); // Clear search when closing
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showCountryDropdown]);

  // Effect to scroll to error banner when form errors appear
  React.useEffect(() => {
    if (formErrors.length === 0 || typeof document === "undefined") {
      return;
    }

    if (errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [formErrors]);

  // Effect to handle referral tooltip click outside and escape key
  React.useEffect(() => {
    if (!showReferralTooltip) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        referralTooltipRef.current &&
        !referralTooltipRef.current.contains(event.target as Node) &&
        referralTooltipButtonRef.current &&
        !referralTooltipButtonRef.current.contains(event.target as Node)
      ) {
        setShowReferralTooltip(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowReferralTooltip(false);
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [showReferralTooltip]);

  // Validation errors
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: "",
  });

  const parseApiErrors = (errorData: unknown): string[] => {
    if (
      errorData &&
      typeof errorData === "object" &&
      !(errorData instanceof Error) &&
      !Array.isArray(errorData)
    ) {
      const fieldErrors: Record<string, string> = {};
      const generalMessages: string[] = [];
      const errorObj = errorData as Record<string, unknown>;
      const fieldMap: Record<string, keyof typeof errors> = {
        first_name: "firstName",
        last_name: "lastName",
        email: "email",
        phone_number: "phone",
        password: "password",
        confirm_password: "confirmPassword",
      };

      Object.entries(errorObj).forEach(([key, value]) => {
        const messages: string[] = Array.isArray(value)
          ? (value.filter((msg): msg is string => typeof msg === "string"))
          : typeof value === "string"
            ? [value]
            : [];

        if (messages.length === 0) {
          return;
        }

        const mappedField = fieldMap[key];
        if (mappedField) {
          fieldErrors[mappedField] = messages[0];
        } else if (key === "terms" || key === "agreement") {
          fieldErrors.terms = messages[0];
        } else {
          generalMessages.push(...messages);
        }
      });

      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          ...fieldErrors,
        }));
      }

      // Return only general (non-field) errors for the banner - field errors show inline under each field
      return generalMessages.length > 0
        ? generalMessages
        : [];
    }

    if (typeof errorData === "string") {
      const normalizedMessages = errorData
        .split("\n")
        .map((msg) => msg.trim())
        .filter((msg) => msg.length > 0);
      if (normalizedMessages.length > 0) {
        return normalizedMessages;
      }
    }

    return ["Registration failed. Please check your inputs."];
  };

  // Password validation states
  const hasMinChars = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_~`[\]\\;'\/+= -]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: "",
    };
    const validationMessages: string[] = [];

    // First name validation
    if (!firstName.trim()) {
      const message = "First name is required";
      newErrors.firstName = message;
      validationMessages.push(message);
      isValid = false;
    }

    // Last name validation
    if (!lastName.trim()) {
      const message = "Last name is required";
      newErrors.lastName = message;
      validationMessages.push(message);
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      const message = "Email is required";
      newErrors.email = message;
      validationMessages.push(message);
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      const message = "Email is invalid";
      newErrors.email = message;
      validationMessages.push(message);
      isValid = false;
    }

    // Phone validation
    if (!phone.trim()) {
      const message = "Phone number is required";
      newErrors.phone = message;
      validationMessages.push(message);
      isValid = false;
    }

    // Password validation
    if (!password) {
      const message = "Password is required";
      newErrors.password = message;
      validationMessages.push(message);
      isValid = false;
    } else if (!hasMinChars || !hasNumber || !hasSymbol || !hasMixedCase) {
      const message = "Password doesn't meet requirements";
      newErrors.password = message;
      validationMessages.push(message);
      isValid = false;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      const message = "Passwords do not match";
      newErrors.confirmPassword = message;
      validationMessages.push(message);
      isValid = false;
    }

    // Terms agreement validation
    if (!agreeToTerms) {
      newErrors.terms = termsAgreementError;
      isValid = false;
      validationMessages.push(termsAgreementError);
      if (typeof document !== "undefined") {
        document.getElementById("terms-container")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }

    setErrors(newErrors);
    if (isValid) {
      setFormErrors([]);
    } else {
      setFormErrors(validationMessages);
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateForm()) {
      return;
    }

    setFormErrors([]);
    setErrors({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", terms: "" });
    setIsSubmitting(true);

    try {
      const selectedCountryData = countries.find(
        (c) => c.code === selectedCountry
      );
      const phoneNumber = `${selectedCountryData?.dialCode}${phone}`;

      const result = await dispatch(
        registerUser({
          email,
          password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          user_type: "individual",
          phone_number: phoneNumber,
          referred_by: referralCode || undefined,
          country: selectedCountryData?.name || selectedCountry,
        })
      );

      if (registerUser.fulfilled.match(result)) {
        setShowVerificationModal(true);
        setFormErrors([]);
      } else if (registerUser.rejected.match(result) && result.payload) {
        const errorData = result.payload;
        setErrors({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", terms: "" });
        setFormErrors(parseApiErrors(errorData));
      } else if (result.error && result.error.message) {
        setFormErrors([
          result.error.message === "Rejected"
            ? "Registration failed. Please check your inputs."
            : result.error.message,
        ]);
      }
    } catch (error: any) {
      // Handle unexpected errors
      console.error("Registration error:", error);
      const errorMessage = error?.message || "An error occurred during registration";

      setErrors((prev) => ({
        ...prev,
        email: typeof errorMessage === "string" ? errorMessage : "An error occurred during registration",
      }));
      setFormErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle email verification
  const handleVerifyEmail = async (code: string) => {
    try {
      const result = await dispatch(
        verifyOTP({
          email,
          otp: code,
        })
      );

      if (verifyOTP.fulfilled.match(result)) {
        setShowVerificationModal(false);
        router.push("/auth/login");
      } else if (verifyOTP.rejected.match(result)) {
        throw new Error(
          (result.payload as unknown as string) || "Verification failed"
        );
      }
    } catch (error: any) {
      throw new Error(error.message || "Verification failed");
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    try {
      // Re-register to get a new OTP
      const selectedCountryData = countries.find(
        (c) => c.code === selectedCountry
      );
      const phoneNumber = `${selectedCountryData?.dialCode}${phone}`;

      const result = await dispatch(
        registerUser({
          email,
          password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          user_type: "individual",
          phone_number: phoneNumber,
          referred_by: referralCode || undefined,
          country: selectedCountryData?.name || selectedCountry,
        })
      );

      if (registerUser.rejected.match(result)) {
        throw new Error(
          (result.payload as unknown as string) || "Failed to resend code"
        );
      }
    } catch (error: any) {
      console.error("Failed to resend code:", error);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowVerificationModal(false);
  };

  const handleGoogleSuccess = (userData: any) => {
    // Handle successful Google authentication
    if (userData.user) {
    }
  };

  const handleGoogleError = (error: any) => {
    // console.error("Google authentication error:", error);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col md:flex-row items-start justify-center relative overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:pt-24 md:pb-24">
        {/* Left Side - Mobile App Preview */}
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative z-10">
          {/* Background Glow Effect */}
          <div className="w-[438px] h-[403px] bg-[#1D8751] blur-[60px] absolute left-16 2xl:left-54 opacity-60"></div>
          <div className="relative">
            <Image
              src="/images/iphone_vn7ejc.webp"
              alt="OMAYA Exchange Mobile App"
              width={350}
              height={650}
              className="mx-auto"
              style={{ width: "auto", height: "auto" }}
              priority
            />
            {/* App store badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {/* Google Play Badge */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] hover:bg-gray-50 dark:hover:bg-[#2A2A32] transition-colors cursor-pointer min-w-[140px]">
                <div className="relative w-6 h-6 shrink-0">
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746787514/Google_Play-Icon-Logo.wine_dqxxk7.svg"
                    alt="Google Play"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Download on the</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Google Play</span>
                </div>
              </div>

              {/* App Store Badge */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] hover:bg-gray-50 dark:hover:bg-[#2A2A32] transition-colors cursor-pointer min-w-[140px]">
                <div className="relative w-6 h-6 shrink-0">
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747288173/dark_apple_rwpgwi.png"
                    alt="App Store"
                    fill
                    className="object-contain brightness-0 dark:brightness-100"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Download on the</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">App Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full md:w-1/2 relative z-10 px-4 sm:px-6 md:px-8 lg:px-0 flex justify-center md:justify-start">
          <div className="max-w-xl mx-auto 2xl:max-w-2xl w-full rounded-2xl p-6 sm:p-8 bg-white dark:bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.7),0_20px_60px_rgba(0,0,0,0.8),0_40px_100px_rgba(0,0,0,0.6)]">
            <div className="mb-6">
              <h1 className="text-gray-900 dark:text-white text-2xl sm:text-3xl font-bold">
                {t("auth.register.title", "Registration")}
              </h1>
              <p className="text-gray-600 dark:text-[#9CA3AF] text-sm mt-1">
                {t(
                  "auth.register.subtitle",
                  "Please register with correct information"
                )}
              </p>
              {formErrors.length > 0 && (
                <div
                  ref={errorBannerRef}
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 rounded-xl border border-red-200 dark:border-[#F04438] bg-red-50 dark:bg-[#FDECEC]/10 px-4 py-3 text-left"
                >
                  <p className="text-red-800 dark:text-[#B42318] text-sm font-semibold mb-2">
                    {t(
                      "auth.register.fixIssues",
                      "Please resolve the following:"
                    )}
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-red-800 dark:text-[#B42318] text-sm">
                    {formErrors.map((message, index) => (
                      <li key={`summary-${message}-${index}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="first-name"
                    className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
                  >
                    {t("auth.register.firstName", "First Name")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="company-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full py-2.5 px-4 pl-10 rounded-lg bg-transparent border ${errors.firstName
                        ? "border-[#FDA29B]"
                        : "border-gray-300 dark:border-[#35353e]"
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751]`}
                      placeholder={t("auth.register.firstName", "Full Name")}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17 19V17C17 15.9391 16.5786 14.9217 15.8284 14.1716C15.0783 13.4214 14.0609 13 13 13H7C5.93913 13 4.92172 13.4214 4.17157 14.1716C3.42143 14.9217 3 15.9391 3 17V19"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-[#F04438]">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="establishment-date"
                    className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
                  >
                    {t("auth.register.lastName", "Last Name")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="establishment-date"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full py-2.5 px-4 pl-10 rounded-lg bg-transparent border ${errors.lastName ? "border-[#FDA29B]" : "border-gray-300 dark:border-[#35353e]"
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751]`}
                      placeholder={t("auth.register.lastName", "Last Name")}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17 19V17C17 15.9391 16.5786 14.9217 15.8284 14.1716C15.0783 13.4214 14.0609 13 13 13H7C5.93913 13 4.92172 13.4214 4.17157 14.1716C3.42143 14.9217 3 15.9391 3 17V19"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-[#F04438]">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
                  >
                    {t("auth.register.email", "Email")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full py-2.5 px-4 pl-10 rounded-lg bg-transparent border ${errors.email ? "border-[#FDA29B]" : "border-gray-300 dark:border-[#35353e]"
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751]`}
                      placeholder={t(
                        "auth.login.email.placeholder",
                        "Email Address"
                      )}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="2"
                          y="4"
                          width="16"
                          height="12"
                          rx="2"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M18 6L10 11L2 6"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#F04438]">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone: one input with country code (flag +252) on the left */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
                  >
                    {t("auth.register.phone", "Phone")} <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-stretch rounded-lg border bg-transparent overflow-visible ${errors.phone ? "border-[#FDA29B]" : "border-gray-300 dark:border-[#35353e]"}`}
                  >
                    <div ref={countryTriggerRef} className="relative country-dropdown-container flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowCountryDropdown(!showCountryDropdown);
                        }}
                        className="h-full py-2.5 pl-3 pr-2 flex items-center gap-1.5 border-r border-gray-300 dark:border-[#35353e] text-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1D8751] focus:ring-inset min-w-0 cursor-pointer"
                      >
                        <img
                          src={`https://flagcdn.com/16x12/${selectedCountry.toLowerCase()}.png`}
                          alt=""
                          className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="text-sm text-gray-600 dark:text-[#9CA3AF] whitespace-nowrap">
                          {countries.find((c) => c.code === selectedCountry)?.dialCode || "+252"}
                        </span>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="flex-shrink-0 text-gray-500 dark:text-[#9CA3AF]"
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {showCountryDropdown &&
                        typeof document !== "undefined" &&
                        createPortal(
                          <div
                            className="country-dropdown-panel fixed z-[9999] max-h-[60vh] overflow-hidden bg-white dark:bg-[var(--card-color)] border border-gray-200 dark:border-[#35353E] rounded-lg shadow-xl"
                            style={{
                              top: countryDropdownRect.top,
                              left: countryDropdownRect.left,
                              width: countryDropdownRect.width,
                            }}
                          >
                            <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-[#35353E]">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search countries..."
                                  value={countrySearchTerm}
                                  onChange={(e) =>
                                    setCountrySearchTerm(e.target.value)
                                  }
                                  className="w-full py-2 px-3 pl-9 rounded-md bg-gray-50 dark:bg-[#2A2A30] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#13B562] text-xs sm:text-sm"
                                  autoFocus
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                    <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#788099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 19L14.65 14.65" stroke="#788099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(country.code);
                                      setShowCountryDropdown(false);
                                      setCountrySearchTerm("");
                                    }}
                                    className="w-full px-3 sm:px-4 py-3 text-left hover:bg-[#13B562] hover:bg-opacity-10 flex items-center text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#35353E] last:border-b-0 min-h-[48px] cursor-pointer"
                                  >
                                    <img
                                      src={`https://flagcdn.com/16x12/${country.code.toLowerCase()}.png`}
                                      alt=""
                                      className="w-4 h-3 object-cover rounded-sm mr-2 sm:mr-3 flex-shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    <div className="flex-1 min-w-0 text-left">
                                      <span className="font-medium text-sm truncate block">{country.name}</span>
                                      <span className="text-gray-500 dark:text-[#788099] text-xs">{country.dialCode}</span>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-center text-gray-500 dark:text-[#788099] text-sm">No countries found</div>
                              )}
                            </div>
                          </div>,
                          document.body
                        )}
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className={`w-full h-full py-2.5 px-4 rounded-r-lg bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#1D8751] focus:ring-inset ${errors.phone ? "border-[#FDA29B]" : ""}`}
                        placeholder="612345678"
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-[#F04438]">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
                  >
                    {t("auth.register.password", "Password")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (submitAttempted) setSubmitAttempted(false);
                      }}
                      autoComplete="new-password"
                      className={`w-full py-2.5 px-4 pl-10 rounded-lg bg-transparent border ${errors.password ? "border-[#FDA29B]" : "border-gray-300 dark:border-[#35353e]"
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751]`}
                      placeholder={t(
                        "auth.register.password.placeholder",
                        "Enter password"
                      )}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="20"
                      >
                        <path
                          d="M8,10 L8,7 C8,4.791 9.791,3 12,3 C14.209,3 16,4.791 16,7 L16,10"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <rect
                          x="7"
                          y="10"
                          width="10"
                          height="8"
                          rx="1"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <line
                          x1="12"
                          y1="13.5"
                          x2="12"
                          y2="14.5"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4.5 4.5L15.5 15.5"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M11.843 11.844C11.5128 12.1745 11.1023 12.4138 10.6513 12.5398C10.2003 12.6658 9.72401 12.6745 9.26875 12.565C8.81348 12.4555 8.39456 12.2315 8.05372 11.9155C7.71288 11.5994 7.4619 11.2024 7.325 10.763"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8.5 5.016C9.017 4.926 9.549 4.879 10.093 4.879C14.5 4.879 17 10 17 10C17 10 16.307 11.323 15 12.5"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 10C2 10 4 6 8.5 4.5"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 7L13 13"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-[#F04438]">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
                  >
                    {t("auth.register.confirm", "Confirm")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`w-full py-2.5 px-4 pl-10 rounded-lg bg-transparent border ${errors.confirmPassword
                        ? "border-[#FDA29B]"
                        : "border-gray-300 dark:border-[#35353e]"
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751]`}
                      placeholder={t(
                        "auth.register.confirm.placeholder",
                        "Confirm password"
                      )}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="20"
                      >
                        <path
                          d="M8,10 L8,7 C8,4.791 9.791,3 12,3 C14.209,3 16,4.791 16,7 L16,10"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <rect
                          x="7"
                          y="10"
                          width="10"
                          height="8"
                          rx="1"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <line
                          x1="12"
                          y1="13.5"
                          x2="12"
                          y2="14.5"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4.5 4.5L15.5 15.5"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M11.843 11.844C11.5128 12.1745 11.1023 12.4138 10.6513 12.5398C10.2003 12.6658 9.72401 12.6745 9.26875 12.565C8.81348 12.4555 8.39456 12.2315 8.05372 11.9155C7.71288 11.5994 7.4619 11.2024 7.325 10.763"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8.5 5.016C9.017 4.926 9.549 4.879 10.093 4.879C14.5 4.879 17 10 17 10C17 10 16.307 11.323 15 12.5"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 10C2 10 4 6 8.5 4.5"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 7L13 13"
                            stroke="#88898e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-[#F04438]">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 ml-1 text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${hasMinChars
                      ? "bg-[#1D8751]"
                      : submitAttempted
                        ? "bg-red-500"
                        : "border border-gray-400 dark:border-[#6B7280] bg-transparent"
                      }`}
                  ></div>
                  <span className="text-gray-600 dark:text-[#9CA3AF]">
                    {t("auth.register.requirements.8chars", "8+ characters")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${hasNumber || hasSymbol
                      ? "bg-[#1D8751]"
                      : submitAttempted
                        ? "bg-red-500"
                        : "border border-gray-400 dark:border-[#6B7280] bg-transparent"
                      }`}
                  ></div>
                  <span className="text-gray-600 dark:text-[#9CA3AF]">
                    {t("auth.register.requirements.numberSymbol", "Number or symbol")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${hasMixedCase
                      ? "bg-[#1D8751]"
                      : submitAttempted
                        ? "bg-red-500"
                        : "border border-gray-400 dark:border-[#6B7280] bg-transparent"
                      }`}
                  ></div>
                  <span className="text-gray-600 dark:text-[#9CA3AF]">
                    {t("auth.register.requirements.mixedCase", "Mixed case")}
                  </span>
                </div>
              </div>

              {/* Referral Code */}
              <div>
                <label
                  htmlFor="referral-code"
                  className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
                >
                  {t("auth.register.referral", "Referral Code")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="referral-code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full py-2.5 px-4 pl-10 rounded-lg bg-transparent border border-gray-300 dark:border-[#35353e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751]"
                    placeholder={t(
                      "auth.register.referral.placeholder",
                      "Paste here your referral code"
                    )}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img
                      src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747313820/link-svgrepo-com_pnpakl.svg"
                      className="w-4 h-4"
                      alt=""
                    />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="relative">
                      <button
                        type="button"
                        ref={referralTooltipButtonRef}
                        onClick={() => setShowReferralTooltip((prev) => !prev)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:text-[#1D8751] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D8751] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1D1D23]"
                        aria-label={t(
                          "auth.register.referral.tooltipLabel",
                          "Learn about the referral system"
                        )}
                        aria-expanded={showReferralTooltip}
                      >
                        <svg
                          viewBox="0 0 100 100"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                        >
                          <circle cx="50" cy="50" r="45" fill="none" />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5"
                          />
                          <path
                            d="M40 35 A10 10 0 0 1 50 25 A10 10 0 0 1 60 35 Q60 40 57.5 45 Q55 50 52.5 52.5 Q50 55 50 60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                          <circle cx="50" cy="70" r="5" fill="currentColor" />
                        </svg>
                      </button>
                      {showReferralTooltip && (
                        <div
                          ref={referralTooltipRef}
                          className="absolute right-0 bottom-full z-20 mb-2 w-64 rounded-xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] p-4 text-left shadow-lg"
                        >
                          <div className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {t(
                              "auth.register.referral.tooltipTitle",
                              "Referral System"
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {t(
                              "auth.register.referral.tooltipDescription",
                              "Share your code with friends so you both earn rewards when they sign up and start trading."
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div
                id="terms-container"
                className={`mt-4 ${!agreeToTerms && (submitAttempted || errors.terms) ? "ring-2 ring-[#F04438] rounded-lg p-2" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <div className="relative flex items-start pt-0.5">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeToTerms}
                      onChange={() => {
                        const nextValue = !agreeToTerms;
                        setAgreeToTerms(nextValue);
                        if (errors.terms) {
                          setErrors((prev) => ({ ...prev, terms: "" }));
                        }
                        if (nextValue) {
                          setFormErrors((prev) =>
                            prev.filter((message) => message !== termsAgreementError)
                          );
                        }
                      }}
                      className="opacity-0 absolute h-5 w-5 sm:h-4 sm:w-4 cursor-pointer"
                    />
                    <div
                      className={`border ${!agreeToTerms && (submitAttempted || errors.terms) ? "border-[#F04438]" : "border-[#1D8751]"} rounded h-5 w-5 sm:h-4 sm:w-4 flex flex-shrink-0 justify-center items-center ${agreeToTerms ? "bg-[#1D8751]" : "bg-transparent"}`}
                    >
                      {agreeToTerms && (
                        <svg
                          className="fill-current w-3 h-3 sm:w-2 sm:h-2 text-white pointer-events-none"
                          viewBox="0 0 20 20"
                        >
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <label
                    htmlFor="terms"
                    className="text-xs sm:text-sm text-gray-600 dark:text-[#9CA3AF] cursor-pointer break-words leading-relaxed flex-1"
                  >
                    {t(
                      "auth.register.terms",
                      "By clicking Register, you agree to our Terms of Services and that you have read our Data Use Policy, including our Cookie Use"
                    ).split(/(Terms of Services|Data Use Policy|Cookie Use)/).map((part, i) =>
                      ["Terms of Services", "Data Use Policy", "Cookie Use"].includes(part) ? (
                        <Link key={i} href="/legal/terms" className="text-[#1D8751] hover:underline">{part}</Link>
                      ) : (
                        part
                      )
                    )}
                  </label>
                </div>
                {errors.terms && (
                  <p className="mt-1 text-xs text-[#F04438]">
                    {errors.terms}
                  </p>
                )}
              </div>

              {/* Global form errors */}
              {/* {formErrors.length > 0 && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 rounded-xl border border-[#F04438] bg-[#FDECEC] px-4 py-3 text-left"
                >
                  <p className="text-[#B42318] text-sm font-semibold mb-2">
                    {t(
                      "auth.register.fixIssues",
                      "Please resolve the following:"
                    )}
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-[#B42318] text-sm">
                    {formErrors.map((message, index) => (
                      <li key={`button-${message}-${index}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              )} */}

              {/* Register Button */}
              <button
                type="submit"
                disabled={isSubmitting || !agreeToTerms}
                className="w-full bg-[#1D8751] hover:bg-[#167a47] text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>
                      {t("auth.register.registering", "Registering...")}
                    </span>
                  </>
                ) : (
                  t("auth.register.submit", "Register")
                )}
              </button>

              {/* Login Link */}
              <div className="text-center mt-4">
                <p className="text-gray-600 dark:text-[#9CA3AF] text-sm">
                  {t("auth.register.haveAccount", "Already have an account?")}{" "}
                  <Link
                    href="/auth/login"
                    className="text-[#1D8751] hover:text-[#00D28E] font-medium cursor-pointer"
                  >
                    {t("auth.register.login", "Log In")}
                  </Link>
                </p>
              </div>

              {/* Or Sign Up with */}
              <div className="mt-4">
                <div className="relative flex items-center justify-center">
                  <span className="mx-4 text-gray-600 dark:text-[#9CA3AF] text-sm">
                    {t("auth.register.or", "Or Sign Up with")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center py-3 px-4 rounded-lg border border-gray-300 dark:border-[#35353E] bg-white dark:bg-transparent w-full">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Loading Google...
                        </span>
                      </div>
                    }
                  >
                    <GoogleAuthButton
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                    />
                  </React.Suspense>
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center py-3 px-4 rounded-lg border border-gray-300 dark:border-[#35353E] bg-white dark:bg-transparent w-full">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Loading Facebook...
                        </span>
                      </div>
                    }
                  >
                    <FacebookAuthButton
                      onSuccess={(userData) => {
                        setProfile(userData);
                        showToast.success(
                          "Facebook authentication successful!"
                        );
                      }}
                      onError={(error) => {
                        console.error("Facebook authentication error:", error);
                        showToast.error(
                          "Facebook authentication failed. Please try again."
                        );
                      }}
                    />
                  </React.Suspense>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={handleCloseModal}
        email={email}
        onVerify={handleVerifyEmail}
        onResendCode={handleResendCode}
      />
    </>
  );
}
