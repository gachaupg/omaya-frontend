"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { loginUser } from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/features/auth/store";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    rememberMe: "",
    notRobot: "",
    submitAttempted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const validateForm = () => {
    let isValid = true;
    const newErrors = { 
      email: "", 
      password: "",
      rememberMe: "",
      notRobot: "",
      submitAttempted: true
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
        router.push("/dashboard"); 
      } else {
        if (result.payload) {
          const errorData = result.payload as any;
          const errorMessage = errorData?.message || errorData?.error || errorData?.details ||errorData|| 'Login failed';
          
          // If there are field-specific errors, set them
          if (errorData?.errors) {
            const fieldErrors: Record<string, string> = {};
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                fieldErrors[field] = messages[0];
              } else if (typeof messages === 'string') {
                fieldErrors[field] = messages;
              }
            });
            setErrors(prev => ({
              ...prev,
              ...fieldErrors
            }));
          } else {
            // Set general error message
            setErrors(prev => ({
              ...prev,
              email: errorMessage
            }));
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors(prev => ({
        ...prev,
        email: "An unexpected error occurred during login"
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#18181D] flex flex-col md:flex-row items-start justify-center relative overflow-hidden px-6 py-16 md:pt-24 md:pb-24">      
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
                <span className="text-[#051015] text-sm font-bold">Google Play</span>
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
                <span className="text-[#051015] text-sm font-bold">App Store</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 relative z-10">
        <div className="max-w-md mx-auto 2xl:max-w-3/4">
          <div className="mb-6">
            <h1 className="text-white text-2xl font-semibold">Welcome</h1>
            <p className="text-[#788099]">Please Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-white mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full py-3 px-4 pl-10 rounded-full bg-[#1D1D23] border ${
                    errors.email ? "border-[#FDA29B]" : "border-gray-700"
                  } text-white focus:outline-none focus:border-[#13B562]`}
                  placeholder="Email Address"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg width="20" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="#1D8751" strokeWidth="1.5" />
                    <path d="M22 6L12 13L2 6" stroke="#1D8751" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F04438]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.email && <p className="mt-1 text-sm text-[#F04438]">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-white font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full py-3 px-4 pl-10 rounded-full bg-[#1D1D23] border ${
                    errors.password ? "border-[#FDA29B]" : "border-gray-700"
                  } text-white focus:outline-none focus:border-[#13B562]`}
                  placeholder="****************"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path d="M8,10 L8,7 C8,4.791 9.791,3 12,3 C14.209,3 16,4.791 16,7 L16,10" 
                          stroke="#1D8751" 
                          strokeWidth="1.5" 
                          fill="none" 
                          strokeLinecap="round" />
                    <rect x="7" y="10" width="10" height="8" rx="1" 
                          stroke="#1D8751" 
                          strokeWidth="1.5" 
                          fill="none" />
                    <line x1="12" y1="13.5" x2="12" y2="14.5" stroke="#1D8751" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              {errors.password && <p className="mt-1 text-sm text-[#F04438]">{errors.password}</p>}
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
                          setErrors(prev => ({ ...prev, rememberMe: "" }));
                        }
                      }}
                      className={`opacity-0 absolute h-4 w-4 cursor-pointer ${errors.rememberMe ? 'ring-2 ring-[#F04438] rounded' : ''}`}
                    />
                    <div className={`border ${errors.rememberMe ? "border-[#F04438]" : "border-[#1D8751]"} rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 ${rememberMe ? 'bg-[#1D8751]' : 'bg-transparent'}`}>
                      {rememberMe && (
                        <svg className="fill-current w-2 h-2 text-white pointer-events-none" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                    <label htmlFor="remember-me" className={`text-sm cursor-pointer ${errors.rememberMe ? 'text-[#F04438]' : 'text-white'}`}>
                      Remember me
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
                          setErrors(prev => ({ ...prev, notRobot: "" }));
                        }
                      }}
                      className={`opacity-0 absolute h-4 w-4 cursor-pointer ${errors.notRobot ? 'ring-2 ring-[#F04438] rounded' : ''}`}
                    />
                    <div className={`border ${errors.notRobot ? "border-[#F04438]" : "border-[#1D8751]"} rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 ${notRobot ? 'bg-[#1D8751]' : 'bg-transparent'}`}>
                      {notRobot && (
                        <svg className="fill-current w-2 h-2 text-white pointer-events-none" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                    <label htmlFor="not-robot" className={`text-sm cursor-pointer ${errors.notRobot ? 'text-[#F04438]' : 'text-white'}`}>
                      I'm not a robot
                    </label>
                  </div>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div>
                <Link href="/auth/forgotPassword" className="text-[#1D8751] text-sm">
                  Forgot Password
                </Link>
              </div>
            </div>

            {/* Error messages for checkboxes - only show after submit attempt */}
            {errors.submitAttempted && (
              <div className="space-y-1 mt-2">
                {errors.notRobot && (
                  <p className="text-sm text-[#F04438] flex items-center">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>

            {/* Sign Up Link */}
            <div className="text-center mt-4">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-[#1D8751] hover:text-[#0E5531]">
                  Sign Up
                </Link>{" "}
                now
              </p>
              <div className="border-t border-gray-700 flex-grow mt-2"></div>
            </div>

            {/* Or Login With */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <span className="mx-4 text-gray-400 text-sm">Or Log in with</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  type="button"
                  className="flex items-center justify-center py-2 px-4 rounded-lg border border-gray-700 bg-[#1D1D23] text-white hover:bg-[#1a1a1a] transition-colors duration-300"
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
                  <p className="text-[#788099]">Google</p>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center py-2 px-4 rounded-lg border border-gray-700 bg-[#1D1D23] text-white hover:bg-[#1a1a1a] transition-colors duration-300"
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