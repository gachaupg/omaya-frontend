"use client";
import Image from "next/image";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { resetPassword } from "@/features/auth/slices/authSlice";
import { useSearchParams } from "next/navigation";
import { AppDispatch } from "@/features/auth/store";
import { useI18n } from "@/lib/useI18n";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  {
    label: "At least one number or symbol",
    test: (v: string) => /[\d!@#$%^&*(),.?":{}|<>_~`[\]\\;'\/=+ -]/.test(v),
  },
  {
    label: "Both uppercase and lowercase letters",
    test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
];

const ResetPassword = () => {
  const { t } = useI18n("auth");
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const token = searchParams?.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const hasMinChars = PASSWORD_REQUIREMENTS[0].test(password);
  const hasNumberOrSymbol = PASSWORD_REQUIREMENTS[1].test(password);
  const hasMixedCase = PASSWORD_REQUIREMENTS[2].test(password);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setResetError("");
    if (!token.trim()) {
      setResetError("Reset link is invalid or expired. Please request a new password reset email.");
      return;
    }
    if (!email.trim()) {
      setResetError("Reset link is missing an email. Please use the link from your password reset email.");
      return;
    }
    if (!password) {
      setResetError("Password is required");
      return;
    }
    if (!hasMinChars || !hasNumberOrSymbol || !hasMixedCase) {
      setResetError("Password doesn't meet requirements");
      return;
    }
    if (password !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await dispatch(
        resetPassword({
          token,
          email,
          password,
          confirm_password: confirmPassword,
        })
      ).unwrap();
      setSuccess(true);
    } catch (err: any) {
      setResetError(err || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col md:flex-row items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-20 gap-6 sm:gap-8 md:gap-14 lg:gap-16">
      {/* Left Side - Mobile App Preview (desktop only) */}
      <div className="hidden md:flex w-full max-w-xs sm:max-w-sm md:max-w-none md:w-[40%] lg:w-[38%] justify-center shrink-0 relative z-10">
        {/* Background Glow Effect */}
        <div className="w-[min(100%,280px)] h-[220px] md:h-[260px] bg-[#1D8751] blur-[48px] md:blur-[56px] absolute left-1/2 -translate-x-1/2 top-8 opacity-50 pointer-events-none" />
        <div className="relative flex flex-col items-center">
          <Image
            src="/images/iphone_vn7ejc.webp"
            alt="OMAYA.io Mobile App"
            width={240}
            height={448}
            className="mx-auto w-[min(100%,200px)] sm:w-[min(100%,230px)] md:w-[min(100%,250px)] lg:w-[min(100%,270px)] h-auto"
            priority
          />
          {/* App store badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {/* Google Play Badge */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] hover:bg-gray-50 dark:hover:bg-[#2A2A32] transition-colors cursor-pointer min-w-[140px]">
              <div className="relative w-6 h-6 shrink-0">
                <Image
                  src="/assets/Google_Play-Icon-Logo.wine_dqxxk7.svg"
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
                  src="/assets/dark_apple_rwpgwi.png"
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
      {/* Reset password form — full width on mobile */}
      <div className="w-full md:flex-1 relative z-10 flex flex-col justify-center min-h-0 flex-1 md:min-h-0 px-0 sm:px-2 md:px-8 lg:px-10">
        <div className="max-w-md w-full mx-auto rounded-2xl p-6 sm:p-8 bg-white dark:bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.7),0_20px_60px_rgba(0,0,0,0.8),0_40px_100px_rgba(0,0,0,0.6)]">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-gray-900 mb-2">
            {t("auth.forgot.title", "Forgot Password")}
          </h1>
          <p className="dark:text-[#788099] text-gray-600 text-sm mb-4">
            {t("auth.reset.subtitle", "Create New Password")}
          </p>
          <form className="space-y-4" onSubmit={handleResetSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-white text-sm mb-2"
                >
                  {t("auth.reset.newPassword", "New Password*")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t(
                      "auth.register.password.placeholder",
                      "Enter password"
                    )}
                    className="w-full py-2 px-4 pl-9 bg-white dark:bg-[var(--card-color)] border border-gray-300 dark:border-[#35353E] rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
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
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-white text-sm mb-2"
                >
                  {t("auth.register.confirm", "Confirm password*")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t(
                      "auth.register.confirm.placeholder",
                      "Confirm password"
                    )}
                    className="w-full py-2 px-4 pl-9 bg-white dark:bg-[var(--card-color)] border border-gray-300 dark:border-[#35353E] rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
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
              </div>
            </div>
            {/* Password requirements */}
            <div className="flex flex-col space-y-1 ml-1 mt-2 text-sm">
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${hasMinChars
                    ? "bg-[#1D8751]"
                    : submitAttempted
                    ? "bg-red-500"
                    : "border border-gray-400 dark:border-[#6B7280] bg-transparent"
                    }`}
                ></div>
                <span
                  className={`${hasMinChars
                    ? "text-[#1D8751]"
                    : submitAttempted
                    ? "text-red-500"
                    : "text-gray-600 dark:text-[#9CA3AF]"
                    }`}
                >
                  {t(
                    "auth.register.requirements.8chars",
                    "At least 8 characters"
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${hasNumberOrSymbol
                    ? "bg-[#1D8751]"
                    : submitAttempted
                    ? "bg-red-500"
                    : "border border-gray-400 dark:border-[#6B7280] bg-transparent"
                    }`}
                ></div>
                <span
                  className={`${hasNumberOrSymbol
                    ? "text-[#1D8751]"
                    : submitAttempted
                    ? "text-red-500"
                    : "text-gray-600 dark:text-[#9CA3AF]"
                    }`}
                >
                  {t(
                    "auth.register.requirements.numberSymbol",
                    "At least one number or symbol"
                  )}
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
                <span
                  className={`${hasMixedCase
                    ? "text-[#1D8751]"
                    : submitAttempted
                    ? "text-red-500"
                    : "text-gray-600 dark:text-[#9CA3AF]"
                    }`}
                >
                  {t(
                    "auth.register.requirements.mixedCase",
                    "Both uppercase and lowercase letters"
                  )}
                </span>
              </div>
            </div>
            {resetError && (
              <p className="text-[#F04438] text-sm mt-1">{resetError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#1D8751] text-white py-2 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 mt-4"
              disabled={isLoading}
            >
              {isLoading
                ? t("auth.reset.submitting", "Updating...")
                : t("auth.reset.submit", "Update Password")}
            </button>
          </form>
        </div>
      </div>
      {/* Success Modal */}
      {success && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 "
          style={{ background: "rgba(24, 24, 29, 0.5)" }}
        >
          <div className="bg-white dark:bg-[var(--card-color)] rounded-2xl p-8 max-w-sm w-full text-center relative">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-[#1D8751] rounded-full w-14 h-14 flex items-center justify-center">
                <svg
                  width="200"
                  height="130"
                  viewBox="0 0 200 130"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="200" height="130" fill="#1C1C21" />

                  <circle cx="100" cy="65" r="40" fill="#1D8751" />
                  <path
                    d="M85 65 L95 75 L115 50"
                    stroke="white"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <circle cx="25" cy="25" r="6" fill="#F79330" />
                  <circle cx="175" cy="20" r="6" fill="#1D8751" />
                  <circle cx="35" cy="105" r="6" fill="#1D8751" />
                  <circle cx="145" cy="90" r="6" fill="#4176BE" />
                </svg>
              </div>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">
              {t("auth.reset.success", "Password changed successfully")}
            </h2>
            <button
              className="w-full bg-[#1D8751] text-white py-2 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 mt-4"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/auth/login";
                }
              }}
            >
              {t("auth.register.login", "Log In")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
