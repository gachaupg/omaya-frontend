/**
 * RegisterForm.tsx – auto‑generated placeholder
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { registerUser, verifyOTP } from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/features/auth/store";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/utils/toast";

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

  // Timer countdown
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
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

      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        const nextInput = document.getElementById(`code-${nextEmptyIndex}`);
        nextInput?.focus();
      } else if (newCode.every((digit) => digit !== "")) {
        const submitButton = document.getElementById("verify-button");
        submitButton?.focus();
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
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
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
    setCanResend(false);
    setTimeLeft(120);
    setVerificationCode(["", "", "", "", "", ""]);
    setError("");
    await onResendCode();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(24, 24, 29, 0.5)" }}
    >
      <div className="dark:bg-[#1D1D23] bg-white rounded-2xl p-8 max-w-md w-full relative">
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
          <div className="flex justify-center space-x-3 mb-6">
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
                className={`w-12 h-12 text-center dark:text-white text-gray-900 text-xl font-semibold dark:bg-[#35353E] bg-gray-100 border ${
                  error
                    ? "border-[#F04438]"
                    : "dark:border-gray-700 border-gray-300"
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
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

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
    };

    // First name validation
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    // Last name validation
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    // Phone validation
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (!hasMinChars || !hasNumber || !hasSymbol || !hasMixedCase) {
      newErrors.password = "Password doesn't meet requirements";
      isValid = false;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Terms agreement validation
    if (!agreeToTerms) {
      isValid = false;
      document.getElementById("terms-container")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumber = `${phone}`;

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
        })
      );

      if (registerUser.fulfilled.match(result)) {
        setShowVerificationModal(true);
      } else {
        // Handle API errors
        if (result.payload) {
            if (result.payload) {
            showToast.error(result.payload as string); // <-- Show all errors in a toast
          }
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors((prev) => ({
        ...prev,
        email: "An error occurred during registration",
      }));
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
      const result = await dispatch(
        registerUser({
          email,
          password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          user_type: "individual",
          phone_number: phone,
          referred_by: referralCode || undefined,
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

  return (
    <>
      <div className="min-h-screen dark:bg-[#18181D] bg-gray-50 flex flex-col md:flex-row items-start justify-center relative overflow-hidden px-6 py-16 md:pt-24 md:pb-24">
        {/* Left Side - Mobile App Preview */}
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative z-10">
          {/* Background Glow Effect */}
          <div className="w-[438px] h-[403px] bg-[#1D8751] blur-[60px] absolute left-16 2xl:left-54 opacity-60"></div>
          <div className="relative">
            <Image
              src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747220053/iphone_vn7ejc.png"
              alt="OMAYA Exchange Mobile App"
              width={350}
              height={650}
              className="mx-auto"
              priority
            />
            {/* App store badges */}
            <div className="flex space-x-1 mt-4 justify-center">
              <div className="rounded px-2 flex items-center border border-gray-700 bg-white">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746787514/Google_Play-Icon-Logo.wine_dqxxk7.svg"
                  alt="Google Play Store"
                  width={40}
                  height={13}
                  className="mr-2"
                />
                <div>
                  <p className="text-[#051015] text-xs">Download on the</p>
                  <span className="text-[#051015] text-sm font-bold">
                    Google Play
                  </span>
                </div>
              </div>
              <div className="rounded px-2 flex items-center border border-gray-700 bg-white">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747288173/dark_apple_rwpgwi.png"
                  alt="Apple App Store"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <div>
                  <p className="text-[#051015] text-xs">Download on the</p>
                  <span className="text-[#051015] text-sm font-bold">
                    App Store
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full md:w-1/2 relative z-10">
          <div className="max-w-md mx-auto 2xl:max-w-3/4">
            <div className="mb-6">
              <h1 className="dark:text-white text-gray-900 text-2xl font-semibold">
                Registration
              </h1>
              <p className="dark:text-[#788099] text-gray-600">
                Please Register with correct Information
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first-name"
                    className="block dark:text-white text-gray-900 text-sm mb-2"
                  >
                    First Name*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="company-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full py-2 px-4 pl-9 rounded-full dark:bg-[#1D1D23] bg-white border ${
                        errors.firstName
                          ? "border-[#FDA29B]"
                          : "border-gray-700"
                      } dark:text-[#788099] text-gray-900 focus:outline-none focus:border-[#13B562]`}
                      placeholder="Full Name"
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
                    className="block dark:text-white text-gray-900 text-sm mb-2"
                  >
                    Last Name*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="establishment-date"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full py-2 px-4 pl-9 rounded-full dark:bg-[#1D1D23] bg-white border ${
                        errors.lastName ? "border-[#FDA29B]" : "border-gray-700"
                      } dark:text-[#788099] text-gray-900 focus:outline-none focus:border-[#13B562]`}
                      placeholder="Last Name"
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block dark:text-white text-gray-900 text-sm mb-2"
                  >
                    Email*
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full py-2 px-4 pl-9 rounded-full dark:bg-[#1D1D23] bg-white border ${
                        errors.email ? "border-[#FDA29B]" : "border-gray-700"
                      } dark:text-[#788099] text-gray-900 focus:outline-none focus:border-[#13B562]`}
                      placeholder="Email Address"
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="country-code"
                    className="block dark:text-white text-gray-900 text-sm mb-2"
                  >
                    Country Code*
                  </label>
                  <div className="relative">
                    <select
                      id="country-code"
                      className="w-full py-2 px-4 pl-9 pr-8 rounded-full dark:bg-[#1D1D23] bg-white border dark:border-gray-700 border-gray-300 dark:text-white text-gray-900 focus:outline-none focus:border-[#13B562] appearance-none"
                    >
                      <option value="50">So</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="#788099"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="mr-1 text-[#788099] text-sm">+252</span>
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
                          stroke="#98A2B3"
                          strokeWidth="5"
                        />
                        <path
                          d="M40 35 A10 10 0 0 1 50 25 A10 10 0 0 1 60 35 Q60 40 57.5 45 Q55 50 52.5 52.5 Q50 55 50 60"
                          fill="none"
                          stroke="#98A2B3"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <circle cx="50" cy="70" r="5" fill="#98A2B3" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="phone"
                    className="block dark:text-white text-gray-900 text-sm mb-2"
                  >
                    Phone*
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full py-2 px-4 pl-9 rounded-full dark:bg-[#1D1D23] bg-white border ${
                        errors.phone ? "border-[#FDA29B]" : "border-gray-700"
                      } dark:text-[#788099] text-gray-900 focus:outline-none focus:border-[#13B562]`}
                      placeholder="+12345678"
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
                          d="M17 13V16C17 16.5304 16.7893 17.0391 16.4142 17.4142C16.0391 17.7893 15.5304 18 15 18C12.6266 18 10.3065 17.1571 8.3432 15.6569C6.5276 14.2921 5.0461 12.4787 4.0567 10.375C3.35236 8.77321 2.99913 7.0312 3 5.27276C3 4.74232 3.21071 4.23363 3.58579 3.85855C3.96086 3.48348 4.46957 3.27277 5 3.27277H8C8.47171 3.27132 8.92936 3.46188 9.26542 3.8049C9.60148 4.14793 9.79281 4.61042 9.79 5.08213C9.78207 5.87858 9.86506 6.67266 10.0367 7.44455C10.1549 7.90095 10.1367 8.3877 9.98511 8.83222C9.83357 9.27674 9.55903 9.65729 9.2 9.92277L8.21 10.9128C9.1654 12.7952 10.6348 14.2646 12.5172 15.22L13.507 14.23C13.7725 13.871 14.153 13.5964 14.5976 13.4449C15.0421 13.2933 15.5288 13.2751 15.9852 13.3933C16.7571 13.5649 17.5512 13.6479 18.3476 13.64C18.8202 13.6372 19.2834 13.8293 19.6263 14.1666C19.9692 14.5039 20.158 14.9629 20.1547 15.4355V18.0001C20.1547 18.5305 19.944 19.0392 19.5689 19.4143C19.1938 19.7893 18.6851 20.0001 18.1547 20.0001"
                          stroke="#1D8751"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-[#F04438]">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block dark:text-white text-gray-900 text-sm mb-2"
                  >
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full py-2 px-4 pl-9 rounded-full dark:bg-[#1D1D23] bg-white border ${
                        errors.password ? "border-[#FDA29B]" : "border-gray-700"
                      } dark:text-[#788099] text-gray-900 focus:outline-none focus:border-[#13B562]`}
                      placeholder="Enter password"
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
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
                            stroke="#788099"
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
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M11.843 11.844C11.5128 12.1745 11.1023 12.4138 10.6513 12.5398C10.2003 12.6658 9.72401 12.6745 9.26875 12.565C8.81348 12.4555 8.39456 12.2315 8.05372 11.9155C7.71288 11.5994 7.4619 11.2024 7.325 10.763"
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8.5 5.016C9.017 4.926 9.549 4.879 10.093 4.879C14.5 4.879 17 10 17 10C17 10 16.307 11.323 15 12.5"
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 10C2 10 4 6 8.5 4.5"
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 7L13 13"
                            stroke="#788099"
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
                    className="block dark:text-white text-gray-900 text-sm mb-2"
                  >
                    Confirm password*
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full py-2 px-4 pl-9 rounded-full dark:bg-[#1D1D23] bg-white border ${
                        errors.confirmPassword
                          ? "border-[#FDA29B]"
                          : "border-gray-700"
                      } dark:text-[#788099] text-gray-900 focus:outline-none focus:border-[#13B562]`}
                      placeholder="Confirm password"
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
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
                            stroke="#788099"
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
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M11.843 11.844C11.5128 12.1745 11.1023 12.4138 10.6513 12.5398C10.2003 12.6658 9.72401 12.6745 9.26875 12.565C8.81348 12.4555 8.39456 12.2315 8.05372 11.9155C7.71288 11.5994 7.4619 11.2024 7.325 10.763"
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8.5 5.016C9.017 4.926 9.549 4.879 10.093 4.879C14.5 4.879 17 10 17 10C17 10 16.307 11.323 15 12.5"
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 10C2 10 4 6 8.5 4.5"
                            stroke="#788099"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 7L13 13"
                            stroke="#788099"
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
              <div className="flex flex-col space-y-1 ml-1">
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${hasMinChars ? "bg-[#1D8751]" : "bg-[#1D8751]"}`}
                  ></div>
                  <span className="text-sm dark:text-white text-gray-900">
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${hasNumber || hasSymbol ? "bg-[#1D8751]" : "bg-[#1D8751]"}`}
                  ></div>
                  <span className="text-sm dark:text-white text-gray-900">
                    At least one number or symbol
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${hasMixedCase ? "bg-[#1D8751]" : "bg-[#1D8751]"}`}
                  ></div>
                  <span className="text-sm dark:text-white text-gray-900">
                    Both uppercase and lowercase letters
                  </span>
                </div>
              </div>

              {/* Referral Code */}
              <div>
                <label
                  htmlFor="referral-code"
                  className="block dark:text-white text-gray-900 text-sm mb-2"
                >
                  Referral Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="referral-code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full py-2 px-4 pl-9 rounded-full dark:bg-[#1D1D23] bg-white border dark:border-gray-700 border-gray-300 dark:text-[#788099] text-gray-900 focus:outline-none focus:border-[#13B562]"
                    placeholder="Paste here your referral code"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img
                      src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747313820/link-svgrepo-com_pnpakl.svg"
                      className="w-4 h-4"
                      alt=""
                    />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
                        stroke="#98A2B3"
                        strokeWidth="5"
                      />
                      <path
                        d="M40 35 A10 10 0 0 1 50 25 A10 10 0 0 1 60 35 Q60 40 57.5 45 Q55 50 52.5 52.5 Q50 55 50 60"
                        fill="none"
                        stroke="#98A2B3"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <circle cx="50" cy="70" r="5" fill="#98A2B3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div
                id="terms-container"
                className={`mt-4 ${!agreeToTerms && errors.firstName ? "ring-2 ring-[#F04438] rounded-lg p-2" : ""}`}
              >
                <div className="flex items-center">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeToTerms}
                      onChange={() => setAgreeToTerms(!agreeToTerms)}
                      className="opacity-0 absolute h-4 w-4 cursor-pointer"
                    />
                    <div
                      className={`border border-[#1D8751] rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 ${agreeToTerms ? "bg-[#1D8751]" : "bg-transparent"}`}
                    >
                      {agreeToTerms && (
                        <svg
                          className="fill-current w-2 h-2 text-white pointer-events-none"
                          viewBox="0 0 20 20"
                        >
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                    <label
                      htmlFor="terms"
                      className="text-sm dark:text-white text-gray-900 cursor-pointer"
                    >
                      By clicking Register, you agree to our Terms of Services
                      and that you have read our Data Use Policy, including our
                      Cookie Use
                    </label>
                  </div>
                </div>
                {!agreeToTerms && errors.firstName && (
                  <p className="mt-1 text-xs text-[#F04438]">
                    You must agree to the terms and conditions
                  </p>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="w-full bg-[#1D8751] text-white py-3 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 mt-4"
              >
                Register
              </button>

              {/* Login Link */}
              <div className="text-center mt-2">
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-[#1D8751] hover:text-[#0E5531] cursor-pointer"
                  >
                    Log In
                  </Link>
                </p>
                <div className="border-t dark:border-gray-700 border-gray-300 flex-grow mt-2"></div>
              </div>

              {/* Or Sign Up with */}
              <div className="mt-4">
                <div className="relative flex items-center justify-center">
                  <span className="mx-4 text-gray-400 text-sm">
                    Or Sign Up with
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    className="flex items-center justify-center py-2 px-4 rounded-lg border dark:border-gray-700 border-gray-300 dark:bg-[#1D1D23] bg-white dark:text-white text-gray-900 dark:hover:bg-[#1a1a1a] hover:bg-gray-100 transition-colors duration-300"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center py-2 px-4 rounded-lg border dark:border-gray-700 border-gray-300 dark:bg-[#1D1D23] bg-white dark:text-white text-gray-900 dark:hover:bg-[#1a1a1a] hover:bg-gray-100 transition-colors duration-300"
                  >
                    <svg
                      className="w-6 h-6 mr-2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="12" fill="#1877F2" />
                      <path
                        d="M15.117 8.667h-1.55c-.486 0-.867.381-.867.867v1.55h2.417l-.317 2.417h-2.1v6.05h-2.417v-6.05h-2.1v-2.417h2.1v-1.55c0-1.486 1.2-2.683 2.683-2.683h1.55v2.417z"
                        fill="#FFFFFF"
                      />
                    </svg>
                    Facebook
                  </button>
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
