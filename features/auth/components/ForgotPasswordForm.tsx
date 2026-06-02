/**
 * ForgotPasswordForm.tsx – auto‑generated placeholder
 * ForgotPasswordForm.tsx – auto‑generated placeholder
 */

"use client";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  forgotPassword,
  resetPassword,
} from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/features/auth/store";
import { useI18n } from "@/lib/useI18n";

const ForgetPassword = () => {
  const { t } = useI18n("auth");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Step 1: Submit email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setFormMessage(null);
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is invalid");
      return;
    }
    setIsLoading(true);
    try {
      const message = await dispatch(forgotPassword({ email })).unwrap();
      setFormMessage({
        type: "success",
        text: "Password reset email sent to your email. Redirecting in 7 seconds...",
      });
      setTimeout(() => {
        router.push("/auth/login");
      }, 7000);
    } catch (err: any) {
      setEmailError(err?.message || "Failed to send reset email");
      setFormMessage({
        type: "error",
        text: err?.message || "Failed to send reset email",
      });
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

      {/* Forgot password form — full width on mobile */}
      <div className="w-full md:flex-1 relative z-10 flex flex-col justify-center min-h-0 flex-1 md:min-h-0 px-0 sm:px-2 md:px-8 lg:px-10">
        <div className="max-w-md w-full mx-auto rounded-2xl p-6 sm:p-8 bg-white dark:bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.7),0_20px_60px_rgba(0,0,0,0.8),0_40px_100px_rgba(0,0,0,0.6)]">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-gray-900 mb-2">
            {t("auth.forgot.title", "Forgot Password")}
          </h1>
          <p className="dark:text-[#788099] text-gray-600 text-sm mb-4">
            {t(
              "auth.forgot.subtitle",
              "Enter your email to receive the instruction to reset your password"
            )}
          </p>
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block dark:text-white text-gray-900 text-sm mb-2"
                >
                  {t("auth.forgot.email", "Email*")}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t(
                      "auth.forgot.email.placeholder",
                      "Email Address"
                    )}
                    className="w-full py-2 px-4 pl-9 bg-white dark:bg-[var(--card-color)] border border-gray-300 dark:border-[#35353E] rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent"
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
                {emailError && (
                  <p className="text-[#F04438] text-sm mt-1">{emailError}</p>
                )}
              </div>
            </div>
            {formMessage && (
              <div
                className={`text-sm rounded-lg px-3 py-2 ${
                  formMessage.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {formMessage.text}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-[#1D8751] text-white py-2 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 mt-4"
              disabled={isLoading}
            >
              {isLoading
                ? t("auth.forgot.submitting", "Sending...")
                : t("auth.forgot.submit", "Confirm")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
