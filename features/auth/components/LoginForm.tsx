"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/features/auth/slices/authSlice";
import { AppDispatch, RootState } from "@/features/auth/store";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleAuthButton from "./GoogleAuthButton";
import FacebookAuthButton from "@/features/auth/components/FacebookAuthButton";
import { useI18n } from "@/lib/useI18n";

import { logger } from '@/lib/utils/logger';
import DragFitCaptcha from "./capture";
import { useTheme } from "@/context/theme";
import { consumeAuthRedirectPath } from "@/lib/utils/authRedirect";
import { storage } from "../utils/storage";

export default function LoginPage() {
  const { t } = useI18n("auth");
  const { isDark } = useTheme();
  const autofillGuardId = useId().replace(/:/g, "");
  const [credentialFieldsActive, setCredentialFieldsActive] = useState(false);
  const emailInputId = `login-email-${autofillGuardId}`;
  const passwordInputId = `login-password-${autofillGuardId}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    rememberMe: "",
    captcha: "",
    submitAttempted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaSuccess, setCaptchaSuccess] = useState(false);
  const captchaSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const normalizeRedirectPath = (rawPath: string | null): string | null => {
    if (!rawPath) return null;
    const path = rawPath.trim();
    if (!path.startsWith("/")) return null;
    // Prevent protocol-relative / external redirects
    if (path.startsWith("//")) return null;
    return path;
  };

  // Watch for successful authentication (including 2FA)
  useEffect(() => {
    if (isAuthenticated) {
      const redirectFromQuery = normalizeRedirectPath(
        searchParams?.get("redirect") ?? null
      );
      const redirectPath =
        redirectFromQuery ||
        normalizeRedirectPath(consumeAuthRedirectPath()) ||
        "/dashboard";
      // Use hard navigation to ensure cookies/middleware run
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 100);
    }
  }, [isAuthenticated, searchParams]);

  const handleGoogleSuccess = (userData: any) => {
    logger.debug('auth', "Google authentication successful:", userData);
    // Handle successful Google authentication
    if (userData.user) {
      // You can dispatch to Redux store here if needed
      logger.debug('auth', "User authenticated:", userData.user);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Google authentication error:", error);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: "",
      password: "",
      rememberMe: "",
      captcha: "",
      submitAttempted: true,
    };

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const proceedWithLogin = async () => {
    setCredentialFieldsActive(true);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dispatch(
        loginUser({ email, password, remember_me: rememberMe })
      );

      if (loginUser.fulfilled.match(result)) {
        // Check if 2FA is required
        if (result.payload?.require_2fa) {
          // 2FA modal will be opened automatically by the slice
          // Don't navigate to dashboard yet
          setIsSubmitting(false);
          return;
        }

        // Use hard navigation to ensure middleware sees cookie and auth state is properly initialized
        // Small delay to ensure all state is persisted
        // Subsequent redirect handled by auth effect
      } else {
        if (result.payload) {
          const errorData = result.payload as any;
          const errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorData?.details ||
            errorData ||
            "Login failed";

          // If there are field-specific errors, set them
          if (errorData?.errors) {
            const fieldErrors: Record<string, string> = {};
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                fieldErrors[field] = messages[0];
              } else if (typeof messages === "string") {
                fieldErrors[field] = messages;
              }
            });
            setErrors((prev) => ({
              ...prev,
              ...fieldErrors,
            }));
          } else {
            // Set general error message
            setErrors((prev) => ({
              ...prev,
              email: errorMessage,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors((prev) => ({
        ...prev,
        email: "An unexpected error occurred during login",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearCaptchaSuccessState = () => {
    if (captchaSuccessTimeoutRef.current) {
      clearTimeout(captchaSuccessTimeoutRef.current);
      captchaSuccessTimeoutRef.current = null;
    }
    setCaptchaSuccess(false);
  };

  const handleCaptchaSuccess = () => {
    setCaptchaVerified(true);
    setErrors(prev => ({ ...prev, captcha: "" }));
    setCaptchaSuccess(true);

    if (captchaSuccessTimeoutRef.current) {
      clearTimeout(captchaSuccessTimeoutRef.current);
    }

    captchaSuccessTimeoutRef.current = setTimeout(() => {
      setShowCaptchaModal(false);
      clearCaptchaSuccessState();
      // Proceed with form submission after captcha is verified
      proceedWithLogin();
    }, 2000);
  };

  const handleCaptchaFail = () => {
    setCaptchaVerified(false);
    setErrors(prev => ({ ...prev, captcha: "Captcha verification failed. Please try again." }));
    clearCaptchaSuccessState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialFieldsActive(true);

    // Validate email and password first
    if (!validateForm()) {
      return;
    }

    // If captcha is already verified, proceed directly
    if (captchaVerified) {
      proceedWithLogin();
      return;
    }

    // Otherwise, show captcha modal
    clearCaptchaSuccessState();
    setShowCaptchaModal(true);
  };

  const handleCloseCaptchaModal = () => {
    clearCaptchaSuccessState();
    setShowCaptchaModal(false);
    setCaptchaVerified(false);
  };

  useEffect(() => {
    return () => {
      if (captchaSuccessTimeoutRef.current) {
        clearTimeout(captchaSuccessTimeoutRef.current);
      }
    };
  }, []);

  // Never surface another user's email from app storage on a shared device (legacy key from forgot-password flow).
  useEffect(() => {
    storage.removeUserEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col md:flex-row items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20 gap-10 md:gap-14 lg:gap-16">
      {/* Left Side - Mobile App Preview */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-none md:w-[40%] lg:w-[38%] flex justify-center shrink-0 relative z-10 mb-6 md:mb-0">
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

      {/* Right Side - Login Form (card like register + shadow) */}
      <div className="w-full md:flex-1 relative z-10 px-4 sm:px-6 md:px-8 lg:px-10 flex justify-center">
        <div className="max-w-md w-full rounded-2xl p-6 sm:p-8 bg-white dark:bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.7),0_20px_60px_rgba(0,0,0,0.8),0_40px_100px_rgba(0,0,0,0.6)]">
          <div className="mb-6">
            <h1 className="text-gray-900 dark:text-white text-2xl sm:text-3xl font-bold">
              {t("auth.login.title", "Welcome")}
            </h1>
            <p className="text-gray-600 dark:text-[#9CA3AF] text-sm mt-1">
              {t("auth.login.subtitle", "Please Login")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4 relative"
            autoComplete="off"
          >
            {/*
              Browsers/password managers often ignore autocomplete=off on visible login fields.
              Decoy fields + readonly-until-focus keep another user's saved credentials off-screen until this user engages.
            */}
            <div
              className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
              aria-hidden
            >
              <input
                type="text"
                name="fakeusernameremembered"
                tabIndex={-1}
                autoComplete="username"
                readOnly
              />
              <input
                type="password"
                name="fakepasswordremembered"
                tabIndex={-1}
                autoComplete="current-password"
                readOnly
              />
            </div>
            {/* Email Field - same design as register */}
            <div>
              <label
                htmlFor={emailInputId}
                className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
              >
                {t("auth.login.email", "Email")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  id={emailInputId}
                  name={`signin_email_${autofillGuardId}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setCredentialFieldsActive(true)}
                  readOnly={!credentialFieldsActive}
                  autoComplete="off"
                  inputMode="email"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full py-2.5 px-4 pl-10 rounded-lg bg-transparent border ${errors.email
                    ? "border-[#FDA29B]"
                    : "border-gray-300 dark:border-[#35353e]"
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
                <p className="mt-1 text-xs text-[#F04438]">{errors.email}</p>
              )}
            </div>

            {/* Password Field - same design as register */}
            <div>
              <label
                htmlFor={passwordInputId}
                className="block text-gray-600 dark:text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide mb-2"
              >
                {t("auth.login.password", "Password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id={passwordInputId}
                  name={`signin_password_${autofillGuardId}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setCredentialFieldsActive(true)}
                  readOnly={!credentialFieldsActive}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full py-2.5 px-4 pl-10 pr-12 rounded-lg bg-transparent border ${errors.password
                    ? "border-[#FDA29B]"
                    : "border-gray-300 dark:border-[#35353e]"
                    } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#1D8751] focus:ring-1 focus:ring-[#1D8751]`}
                  placeholder={t(
                    "auth.login.password.placeholder",
                    "****************"
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
                <p className="mt-1 text-xs text-[#F04438]">{errors.password}</p>
              )}
            </div>

            {/* Checkboxes Row - same design as register */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id={`remember-me-${autofillGuardId}`}
                    checked={rememberMe}
                    onChange={() => {
                      setRememberMe(!rememberMe);
                      if (errors.submitAttempted) {
                        setErrors((prev) => ({ ...prev, rememberMe: "" }));
                      }
                    }}
                    autoComplete="off"
                    name={`remember_session_${autofillGuardId}`}
                    className={`opacity-0 absolute h-5 w-5 sm:h-4 sm:w-4 cursor-pointer ${errors.rememberMe ? "ring-2 ring-[#F04438] rounded" : ""
                      }`}
                  />
                  <div
                    className={`border ${errors.rememberMe
                      ? "border-[#F04438]"
                      : "border-[#1D8751]"
                      } rounded h-5 w-5 sm:h-4 sm:w-4 flex flex-shrink-0 justify-center items-center mr-2 ${rememberMe ? "bg-[#1D8751]" : "bg-transparent"
                      }`}
                  >
                    {rememberMe && (
                      <svg
                        className="fill-current w-3 h-3 sm:w-2 sm:h-2 text-white pointer-events-none"
                        viewBox="0 0 20 20"
                      >
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                      </svg>
                    )}
                  </div>
                  <label
                    htmlFor={`remember-me-${autofillGuardId}`}
                    className={`text-xs sm:text-sm cursor-pointer ${errors.rememberMe
                      ? "text-[#F04438]"
                      : "text-gray-600 dark:text-[#9CA3AF]"
                      }`}
                  >
                    {t("auth.login.remember", "Remember me")}
                  </label>
                </div>
              </div>

              {/* Forgot Password Link - same as register login link */}
              <div>
                <Link
                  href="/auth/forgotPassword"
                  className="text-[#1D8751] hover:text-[#00D28E] font-medium cursor-pointer text-sm"
                >
                  {t("auth.login.forgot", "Forgot Password")}
                </Link>
              </div>
            </div>


            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#1D8751] hover:bg-[#167a47] text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-300 mt-4 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("auth.login.submitting", "Logging in...")}
                </div>
              ) : (
                t("auth.login.submit", "Log In")
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center mt-4">
              <p className="text-gray-600 dark:text-[#9CA3AF] text-sm">
                {t("auth.login.noAccount", "Don't have an account?")}{" "}
                <Link
                  href="/auth/register"
                  className="text-[#1D8751] hover:text-[#00D28E] font-medium cursor-pointer"
                >
                  {t("auth.login.signUp", "Sign Up")}
                </Link>{" "}
                now
              </p>
            </div>

            {/* Or Login With */}
            <div className="mt-4">
              <div className="relative flex items-center justify-center">
                <span className="mx-4 text-gray-600 dark:text-[#9CA3AF] text-sm">
                  {t("auth.login.or", "Or Log in with")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
                <FacebookAuthButton />
              </div>
            </div>
          </form>

          {/* Captcha Modal - Perfectly centered on screen */}
          {showCaptchaModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-2 sm:p-4">
              {/* Backdrop - covers the entire screen */}
              <div
                className="absolute inset-0 bg-[#18181D]/90 backdrop-blur-sm pointer-events-auto"
                onClick={handleCloseCaptchaModal}
              ></div>
              {/* Modal */}
              <div
                className="relative bg-white dark:bg-[var(--card-color)] rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg pointer-events-auto border border-gray-200 dark:border-[#35353E] z-10 p-3 sm:p-4 md:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold dark:text-white text-gray-900">
                    {t("auth.login.captcha", "Security Verification")}
                  </h2>
                  <button
                    onClick={handleCloseCaptchaModal}
                    disabled={captchaSuccess}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-full transition-colors flex-shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Captcha Content */}
                <div className="flex flex-col items-center w-full">
                  {captchaSuccess ? (
                    <div className="flex flex-col items-center text-center py-4 sm:py-6 w-full">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#E6F4EC] dark:bg-[#1F3B2C] flex items-center justify-center mb-3 sm:mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 sm:w-8 sm:h-8 text-[#1D8751]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.42l-7.778 7.777a1 1 0 01-1.414 0L3.296 10.27a1 1 0 111.414-1.414l3.095 3.094 7.071-7.071a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white px-2">
                        {t("auth.login.captchaSuccessTitle", "Verification complete")}
                      </p>
                      <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-[#9CA3AF] px-2">
                        {t("auth.login.captchaSuccessDescription", "Redirecting to your account...")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-full flex justify-center">
                        <DragFitCaptcha
                          imgSrc="https://picsum.photos/280/140?random=10"
                          onSuccess={handleCaptchaSuccess}
                          darkMode={isDark}
                        />
                      </div>
                      {errors.captcha && (
                        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-[#F04438] flex items-center px-2 text-center">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{errors.captcha}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
