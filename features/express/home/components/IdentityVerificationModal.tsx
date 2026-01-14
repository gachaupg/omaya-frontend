"use client";

/**
 * Identity Verification Required Modal
 * 
 * This modal displays when a user is not verified (is_verified: false).
 * It checks KYC status from the API endpoint: /api/kyc/status/
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
import { checkKYCStatus } from "@/features/auth/slices/authSlice";
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

  // Fetch KYC status when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchKYCStatus();
    }
  }, [isOpen, isAuthenticated]);

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
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
      showToast.error("Error", "Failed to check verification status");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleVerify = () => {
    if (onVerify) {
      onVerify();
    } else {
      // Navigate to KYC verification page
      router.push("/dashboard/kyc");
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Don't render modal if not open
  if (!isOpen) return null;

  // Don't render modal if user is verified - check both KYC status and user data
  // This is a safety check to prevent showing modal to verified users
  if (kycStatus?.is_verified === true) {
    // User is verified according to API, close modal and don't render
    if (isOpen) {
      // Close modal if it's open but user is verified
      setTimeout(() => onClose(), 0);
    }
    return null;
  }
  
  if (user?.is_verified === true && !kycStatus) {
    // User is verified according to user data (before API check completes)
    // Don't show modal
    return null;
  }

  // Determine if user is unverified - only show modal if explicitly not verified
  const isUnverified = kycStatus
    ? kycStatus.is_verified === false
    : user
    ? user.is_verified === false
    : false; // Don't show if we don't know the status yet

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
                Complete your identity verification to continue
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
          ) : (
            <>
              {/* Status Information */}
              <div className="mb-6 space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        Verification Required
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your account needs to be verified before you can use this
                        feature. Please complete the identity verification process.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Details */}
                {kycStatus && (
                  <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Verification Status:
                      </span>
                      <span
                        className={`font-semibold ${
                          kycStatus.is_verified
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {kycStatus.is_verified ? "Verified" : "Not Verified"}
                      </span>
                    </div>
                    {kycStatus.status && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Status:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-200 capitalize">
                          {kycStatus.status}
                        </span>
                      </div>
                    )}
                    {kycStatus.phone_verified !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Phone Verified:
                        </span>
                        <span
                          className={`font-semibold ${
                            kycStatus.phone_verified
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {kycStatus.phone_verified ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Benefits List */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Verification Benefits:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-[#1D8751] mr-2 mt-0.5 flex-shrink-0"
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
                      <span>Access to all platform features</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-[#1D8751] mr-2 mt-0.5 flex-shrink-0"
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
                      <span>Higher transaction limits</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-[#1D8751] mr-2 mt-0.5 flex-shrink-0"
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
                      <span>Enhanced security and protection</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-[#1D8751] mr-2 mt-0.5 flex-shrink-0"
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
                      <span>Priority customer support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-[#35353E]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 w-full sm:w-auto"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleVerify}
                  className="flex-1 w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Verify Identity"}
                </Button>
              </div>

              {/* Footer Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Verification usually takes a few minutes. You'll be notified once
                  your identity is verified.
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

