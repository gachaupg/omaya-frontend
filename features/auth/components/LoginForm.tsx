"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/features/auth/slices/authSlice";
import { AppDispatch, RootState } from "@/features/auth/store";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "./GoogleAuthButton";
import { useI18n } from "@/lib/useI18n";

import { logger } from '@/lib/utils/logger';

export default function LoginPage() {
  const { t } = useI18n("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    rememberMe: "",
    notRobot: "",
    submitAttempted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Watch for successful authentication (including 2FA)
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [isAuthenticated, router]);

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
      notRobot: "",
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

    if (!notRobot) {
      newErrors.notRobot = "Please verify that you are not a robot to continue";
      isValid = false;
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
      const result = await dispatch(loginUser({ email, password }));

      if (loginUser.fulfilled.match(result)) {
        // Check if 2FA is required
        if (result.payload?.require_2fa) {
          // 2FA modal will be opened automatically by the slice
          // Don't navigate to dashboard yet
          setIsSubmitting(false);
          return;
        }

        // Immediately navigate to dashboard without waiting for additional API calls
        router.push("/dashboard");
        // Force a hard navigation to ensure the redirect happens immediately
        router.refresh();
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

  return (
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
                  className={`w-full py-3 px-4 pl-10 rounded-full dark:bg-[#1D1D23] bg-white border ${
                    errors.email
                      ? "border-[#FDA29B]"
                      : "dark:border-gray-700 border-gray-300"
                  } dark:text-white text-gray-900 focus:outline-none focus:border-[#13B562]`}
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
                  className={`w-full py-3 px-4 pl-10 pr-12 rounded-full dark:bg-[#1D1D23] bg-white border ${
                    errors.password
                      ? "border-[#FDA29B]"
                      : "dark:border-gray-700 border-gray-300"
                  } dark:text-white text-gray-900 focus:outline-none focus:border-[#13B562]`}
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
              <div className="flex space-x-6">
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
                      className={`opacity-0 absolute h-4 w-4 cursor-pointer ${
                        errors.rememberMe ? "ring-2 ring-[#F04438] rounded" : ""
                      }`}
                    />
                    <div
                      className={`border ${
                        errors.rememberMe
                          ? "border-[#F04438]"
                          : "border-[#1D8751]"
                      } rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 ${
                        rememberMe ? "bg-[#1D8751]" : "bg-transparent"
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
                      className={`text-sm cursor-pointer ${
                        errors.rememberMe
                          ? "text-[#F04438]"
                          : "dark:text-white text-gray-900"
                      }`}
                    >
                      {t("auth.login.remember", "Remember me")}
                    </label>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="not-robot"
                      checked={notRobot}
                      onChange={() => {
                        setNotRobot(!notRobot);
                        if (errors.submitAttempted) {
                          setErrors((prev) => ({ ...prev, notRobot: "" }));
                        }
                      }}
                      className={`opacity-0 absolute h-4 w-4 cursor-pointer ${
                        errors.notRobot ? "ring-2 ring-[#F04438] rounded" : ""
                      }`}
                    />
                    <div
                      className={`border ${
                        errors.notRobot
                          ? "border-[#F04438]"
                          : "border-[#1D8751]"
                      } rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 ${
                        notRobot ? "bg-[#1D8751]" : "bg-transparent"
                      }`}
                    >
                      {notRobot && (
                        <svg
                          className="fill-current w-2 h-2 text-white pointer-events-none"
                          viewBox="0 0 20 20"
                        >
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                    <label
                      htmlFor="not-robot"
                      className={`text-sm cursor-pointer ${
                        errors.notRobot
                          ? "text-[#F04438]"
                          : "dark:text-white text-gray-900"
                      }`}
                    >
                      {t("auth.login.notRobot", "I'm not a robot")}
                    </label>
                  </div>
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

            {/* Error messages for checkboxes - only show after submit attempt */}
            {errors.submitAttempted && (
              <div className="space-y-1 mt-2">
                {errors.notRobot && (
                  <p className="text-sm text-[#F04438] flex items-center">
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
                    {errors.notRobot}
                  </p>
                )}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#1D8751] text-white py-3 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
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
              <div className="border-t dark:border-gray-700 border-gray-300 flex-grow mt-2"></div>
            </div>

            {/* Or Login With */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <span className="mx-4 text-gray-400 text-sm">
                  {t("auth.login.or", "Or Log in with")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
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
                  <p className="text-[#788099]">Facebook</p>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
