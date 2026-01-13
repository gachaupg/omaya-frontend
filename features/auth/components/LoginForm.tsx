"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/features/auth/slices/authSlice";
import { AppDispatch, RootState } from "@/features/auth/store";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "./GoogleAuthButton";
import FacebookAuthButton from "@/features/auth/components/FacebookAuthButton";
import { useI18n } from "@/lib/useI18n";

import { logger } from '@/lib/utils/logger';
import DragFitCaptcha from "./capture";
import { useTheme } from "@/context/theme";
import { consumeAuthRedirectPath } from "@/lib/utils/authRedirect";

export default function LoginPage() {
  const { t } = useI18n("auth");
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(true);
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
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Watch for successful authentication (including 2FA)
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = consumeAuthRedirectPath() || "/dashboard";
      // Use hard navigation to ensure cookies/middleware run
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 100);
    }
  }, [isAuthenticated]);

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
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dispatch(loginUser({ email, password }));

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

  return (
    <div className="min-h-screen bg-app dark:bg-app flex flex-col md:flex-row items-start justify-center relative overflow-hidden px-6 py-16 md:pt-24 md:pb-24">
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

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 relative z-10">
        <div className="max-w-md mx-auto 2xl:max-w-3/4">
          <div className="mb-6">
            <h1 className="dark:text-white text-gray-900 text-2xl font-semibold">
              {t("auth.login.title", "Welcome")}
            </h1>
            <p className="dark:text-[#788099] text-gray-600">
              {t("auth.login.subtitle", "Please Login")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block dark:text-white text-gray-900 mb-2"
              >
                {t("auth.login.email", "Email")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full py-3 px-4 pl-10 rounded-full bg-white dark:bg-[var(--card-color)] border ${errors.email
                      ? "border-[#FDA29B]"
                      : "border-gray-300 dark:border-[#35353E]"
                    } text-gray-900 dark:text-white focus:outline-none focus:border-[#13B562]`}
                  placeholder={t(
                    "auth.login.email.placeholder",
                    "Email Address"
                  )}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    width="20"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="2"
                      y="4"
                      width="20"
                      height="16"
                      rx="2"
                      stroke="#1D8751"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M22 6L12 13L2 6"
                      stroke="#1D8751"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#F04438]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-[#F04438]">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block dark:text-white text-gray-900 font-medium mb-2"
              >
                {t("auth.login.password", "Password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full py-3 px-4 pl-10 pr-12 rounded-full bg-white dark:bg-[var(--card-color)] border ${errors.password
                      ? "border-[#FDA29B]"
                      : "border-gray-300 dark:border-[#35353E]"
                    } text-gray-900 dark:text-white focus:outline-none focus:border-[#13B562]`}
                  placeholder={t(
                    "auth.login.password.placeholder",
                    "****************"
                  )}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-[#F04438]">{errors.password}</p>
              )}
            </div>

            {/* Checkboxes Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={() => {
                      setRememberMe(!rememberMe);
                      if (errors.submitAttempted) {
                        setErrors((prev) => ({ ...prev, rememberMe: "" }));
                      }
                    }}
                    className={`opacity-0 absolute h-4 w-4 cursor-pointer ${errors.rememberMe ? "ring-2 ring-[#F04438] rounded" : ""
                      }`}
                  />
                  <div
                    className={`border ${errors.rememberMe
                        ? "border-[#F04438]"
                        : "border-[#1D8751]"
                      } rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 ${rememberMe ? "bg-[#1D8751]" : "bg-transparent"
                      }`}
                  >
                    {rememberMe && (
                      <svg
                        className="fill-current w-2 h-2 text-white pointer-events-none"
                        viewBox="0 0 20 20"
                      >
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                      </svg>
                    )}
                  </div>
                  <label
                    htmlFor="remember-me"
                    className={`text-sm cursor-pointer ${errors.rememberMe
                        ? "text-[#F04438]"
                        : "dark:text-white text-gray-900"
                      }`}
                  >
                    {t("auth.login.remember", "Remember me")}
                  </label>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div>
                <Link
                  href="/auth/forgotPassword"
                  className="text-[#1D8751] text-sm"
                >
                  {t("auth.login.forgot", "Forgot Password")}
                </Link>
              </div>
            </div>


            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#1D8751] text-white py-3 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
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
              <p className="text-gray-400">
                {t("auth.login.noAccount", "Don't have an account?")}{" "}
                <Link
                  href="/auth/register"
                  className="text-[#1D8751] hover:text-[#0E5531]"
                >
                  {t("auth.login.signUp", "Sign Up")}
                </Link>{" "}
                now
              </p>
              <div className="border-t border-gray-300 dark:border-[#35353E] flex-grow mt-2"></div>
            </div>

            {/* Or Login With */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <span className="mx-4 text-gray-400 text-sm">
                  {t("auth.login.or", "Or Log in with")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 dark:grid-cols-2">
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
                <FacebookAuthButton />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Captcha Modal - On top of form */}
      {showCaptchaModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-end pointer-events-none pr-14 md:pr-18 lg:pr-26">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 pointer-events-auto" onClick={handleCloseCaptchaModal}></div>
          {/* Modal */}
          <div
            className="relative bg-white dark:bg-[var(--card-color)] rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border border-gray-200 dark:border-[#35353E] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                {t("auth.login.captcha", "Security Verification")}
              </h2>
              <button
                onClick={handleCloseCaptchaModal}
                disabled={captchaSuccess}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500 dark:text-gray-400"
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
            <div className="flex flex-col items-center">
              {captchaSuccess ? (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-[#E6F4EC] dark:bg-[#1F3B2C] flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 text-[#1D8751]"
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
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("auth.login.captchaSuccessTitle", "Verification complete")}
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-[#9CA3AF]">
                    {t("auth.login.captchaSuccessDescription", "Redirecting to your account...")}
                  </p>
                </div>
              ) : (
                <>
                  <DragFitCaptcha
                    imgSrc="https://picsum.photos/280/140?random=10"
                    onSuccess={handleCaptchaSuccess}
                    darkMode={isDark}
                  />
                  {errors.captcha && (
                    <p className="mt-4 text-sm text-[#F04438] flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.captcha}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
