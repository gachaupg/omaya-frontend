/**
 * ForgotPasswordForm.tsx – auto‑generated placeholder
 * ForgotPasswordForm.tsx – auto‑generated placeholder
 */

"use client";
import Image from "next/image";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  forgotPassword,
  resetPassword,
} from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/features/auth/store";
import { storage } from "../utils/storage";
import { showToast } from "@/lib/utils/toast";
import { useI18n } from "@/lib/useI18n";

const ForgetPassword = () => {
  const { t } = useI18n("auth");
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState(() => storage.getUserEmail());
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Step 1: Submit email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
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
      setEmailSent(true);
      storage.setUserEmail(email);
      showToast.success(
        "Password Reset Email Sent",
        "Check your email for a password reset link.",
        { position: "top-center" }
      );
    } catch (err: any) {
      setEmailError(err?.message || "Failed to send reset email");
      showToast.error(
        "Password Reset Failed",
        err?.message || "Failed to send reset email",
        { position: "top-center" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app dark:bg-app flex-col md:flex-row items-start justify-center relative overflow-hidden px-4 py-8 md:pt-24">
      {/* Left Side - Mobile App Preview */}
      <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative z-10">
        {/* Background Glow Effect */}
        <div className="w-[438px] h-[403px] bg-[#1D8751] blur-[60px]  absolute left-16 2xl:left-54 opacity-60"></div>
        <div className="relative">
          <Image
            src="/images/iphone_vn7ejc.webp"
            alt="OMAYA Exchange Mobile App"
            width={350}
            height={650}
            className="mx-auto "
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

      {/* Right side - Forgot password flow */}
      <div className="w-full md:w-1/2 p-0 md:p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full 2xl:max-w-3/4">
          <h1 className="text-2xl font-semibold dark:text-white text-gray-900 mb-2">
            {t("auth.forgot.title", "Forgot Password")}
          </h1>
          <p className="dark:text-[#788099] text-gray-600 mb-1">
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
