"use client";

/**
 * Identity Verification Required Modal
 * 
 * This modal displays when a user is not verified (is_verified: false).
 * It first requires phone verification, then navigates to documents page.
 * 
 * Usage Example:
 * ```tsx
 * import IdentityVerificationModal from "@/features/express/home/components/IdentityVerificationModal";
 * import { useIdentityVerification } from "@/features/express/home/hooks/useIdentityVerification";
 * 
 * function MyComponent() {
 *   const { isModalOpen, closeModal, isVerified } = useIdentityVerification();
 *   
 *   return (
 *     <>
 *       <IdentityVerificationModal
 *         isOpen={isModalOpen}
 *         onClose={closeModal}
 *         onVerify={() => router.push("/dashboard/kyc")}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { checkKYCStatus, sendPhoneOTP, verifyPhoneOTP } from "@/features/auth/slices/authSlice";
import { showToast } from "@/lib/utils/toast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface IdentityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify?: () => void;
}

interface KYCStatusResponse {
  is_verified: boolean;
  status?: string;
  phone_number?: string | null;
  phone_verified?: boolean;
}

const IdentityVerificationModal: React.FC<IdentityVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [kycStatus, setKycStatus] = useState<KYCStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Fetch KYC status when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchKYCStatus();
      // Initialize phone number from user or KYC status
      if (user?.phone_number) {
        setPhoneNumber(user.phone_number);
      }
    }
  }, [isOpen, isAuthenticated, user]);

  // Check if phone is already verified
  useEffect(() => {
    if (kycStatus?.phone_verified === true) {
      setPhoneVerified(true);
      setOtpSent(true);
    }
  }, [kycStatus]);

  // Resend OTP timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const fetchKYCStatus = async () => {
    setCheckingStatus(true);
    try {
      const result = await dispatch(checkKYCStatus()).unwrap();
      const status = result as KYCStatusResponse;
      setKycStatus(status);
      
      // Auto-close modal if user is verified
      if (status.is_verified === true) {
        onClose();
      }
      
      // Set phone number if available
      if (status.phone_number) {
        setPhoneNumber(status.phone_number);
      }
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
      showToast.error("Error", "Failed to check verification status");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      showToast.error("Error", "Please enter your phone number");
      return;
    }

    setSendingOTP(true);
    try {
      const result = await dispatch(sendPhoneOTP({ phone_number: phoneNumber })).unwrap();
      setOtpSent(true);
      setResendTimer(60); // 60 seconds cooldown
      showToast.success(
        "OTP Sent",
        `OTP sent successfully via ${result.channel === "whatsapp" ? "WhatsApp" : "SMS"}`
      );
    } catch (error: any) {
      showToast.error("Error", error || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      showToast.error("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setVerifyingOTP(true);
    try {
      const result = await dispatch(verifyPhoneOTP({ otp })).unwrap();
      if (result.phone_verified) {
        setPhoneVerified(true);
        showToast.success("Success", "Phone number verified successfully");
        
        // Refresh KYC status
        await fetchKYCStatus();
        
        // Navigate to documents page after a short delay
        setTimeout(() => {
          if (onVerify) {
            onVerify();
          } else {
            router.push("/dashboard/kyc");
          }
          onClose();
        }, 1000);
      }
    } catch (error: any) {
      showToast.error("Error", error || "Invalid or expired OTP. Please try again.");
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    handleSendOTP();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    onClose();
  };

  // Don't render modal if not open
  if (!isOpen) return null;

  // Don't render modal if user is verified - check both KYC status and user data
  if (kycStatus?.is_verified === true) {
    if (isOpen) {
      setTimeout(() => onClose(), 0);
    }
    return null;
  }
  
  if (user?.is_verified === true && !kycStatus) {
    return null;
  }

  // Determine if user is unverified
  const isUnverified = kycStatus
    ? kycStatus.is_verified === false
    : user
    ? user.is_verified === false
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Identity Verification Required
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {phoneVerified 
                  ? "Phone verified! Proceeding to document verification..."
                  : "First, verify your phone number to continue"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Status Check */}
          {checkingStatus ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751]"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Checking verification status...
              </span>
            </div>
          ) : phoneVerified ? (
            // Phone verified - show success message
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Phone number verified successfully! Redirecting to document verification...
              </p>
            </div>
          ) : (
            <>
              {/* Phone Verification Step */}
              <div className="mb-6 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                        Step 1: Phone Verification
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Verify your phone number to proceed with identity verification.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Number Input */}
                {!otpSent && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+254712345678"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-[#35353E] rounded-lg bg-white dark:bg-[#1D1D23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent"
                        disabled={sendingOTP}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSendOTP}
                      className="w-full"
                      disabled={sendingOTP || !phoneNumber.trim()}
                    >
                      {sendingOTP ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                )}

                {/* OTP Input */}
                {otpSent && !phoneVerified && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-[#35353E] rounded-lg bg-white dark:bg-[#1D1D23] text-gray-900 dark:text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent"
                        disabled={verifyingOTP}
                      />
                    </div>
                    
                    {/* Resend OTP */}
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Resend OTP in{" "}
                          <span className="font-semibold text-[#1D8751]">
                            {formatTimer(resendTimer)}
                          </span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={sendingOTP}
                          className="text-sm text-[#1D8751] hover:underline disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleVerifyOTP}
                      className="w-full"
                      disabled={verifyingOTP || !otp || otp.length !== 6}
                    >
                      {verifyingOTP ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-[#35353E]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 w-full sm:w-auto"
                  disabled={loading || verifyingOTP}
                >
                  Cancel
                </Button>
              </div>

              {/* Footer Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  After phone verification, you'll be redirected to complete document verification.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default IdentityVerificationModal;
