"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { 
  closeKYCModal, 
  initiateKYCVerification, 
  getSumSubToken, 
  verifyKYCStatus 
} from "../slices/authSlice";
import SumsubWebSdk from "@sumsub/websdk-react";
import { SumSubMessage } from "../types";
import { showToast } from "@/lib/utils/toast";

const KYCVerificationModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { kycModalOpen, loading, user } = useSelector((state: RootState) => state.auth);
  
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [showWebSdk, setShowWebSdk] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (accessToken) {
      setShowWebSdk(true);
    }
  }, [accessToken]);

  const handleVerifyClick = async () => {
    setVerifying(true);
    setError(null);

    if (!user?.user_id) {
      setError("User ID not found");
      showToast.error("Verification Error", "User ID not found");
      setVerifying(false);
      return;
    }

    try {
      // Step 1: Initiate KYC
      const initiateResult = await dispatch(initiateKYCVerification({ 
        user_id: user.user_id 
      }));

      if (initiateKYCVerification.fulfilled.match(initiateResult)) {
        const { applicant_id } = initiateResult.payload;
        setApplicantId(applicant_id);

        // Step 2: Get access token
        const tokenResult = await dispatch(getSumSubToken({ 
          applicant_id 
        }));

        if (getSumSubToken.fulfilled.match(tokenResult)) {
          setAccessToken(tokenResult.payload.access_token);
          showToast.success("Verification Started", "Please complete the verification process");
        } else {
          setError("Failed to retrieve access token");
          showToast.error("Verification Error", "Failed to retrieve access token");
        }
      } else {
        setError("Failed to initiate KYC verification");
        showToast.error("Verification Error", "Failed to initiate KYC verification");
      }
    } catch (error) {
      setError("An error occurred during verification setup");
      showToast.error("Verification Error", "An error occurred during verification setup");
      console.error("Error during KYC verification:", error);
    } finally {
      setVerifying(false);
    }
  };

  const handleTokenRefresh = async () => {
    if (!applicantId) return null;
    
    try {
      const result = await dispatch(getSumSubToken({ applicant_id: applicantId }));
      if (getSumSubToken.fulfilled.match(result)) {
        return result.payload.access_token;
      }
    } catch (error) {
      console.error("Error refreshing access token:", error);
    }
    return null;
  };

  const handleSumSubMessage = (type: string, payload: any) => {
    console.log("SumSub Message:", type, payload);

    if (payload?.reviewStatus && typeof window !== 'undefined') {
      localStorage.setItem("sumsubData", JSON.stringify(payload));

      if (payload.reviewStatus === "completed") {
        setVerificationStatus(true);
        showToast.success("Verification Completed", "Your identity has been successfully verified");
        setTimeout(() => setShowSuccessModal(true), 5000);
      } else {
        setVerificationStatus(false);
      }
    }
  };

  const handleVerificationSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!user?.user_id) {
        setError("User ID not found");
        showToast.error("Verification Error", "User ID not found");
        return;
      }

      const result = await dispatch(verifyKYCStatus({
        user_id: user.user_id,
        status: verificationStatus
      }));

      if (verifyKYCStatus.fulfilled.match(result)) {
        showToast.success("Account Verified", "Your account has been successfully verified");
        setShowSuccessModal(false);
        dispatch(closeKYCModal());
        // Optionally redirect to dashboard or show success message
      } else {
        setError("Verification submission failed");
        showToast.error("Verification Error", "Verification submission failed");
      }
    } catch (error) {
      setError("An error occurred during verification submission");
      showToast.error("Verification Error", "An error occurred during verification submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeKYCModal());
    setShowWebSdk(false);
    setAccessToken(null);
    setApplicantId(null);
    setError(null);
    setVerificationStatus(false);
    setShowSuccessModal(false);
  };

  if (!kycModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" 
         style={{ background: "rgba(24, 24, 29, 0.5)" }}>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-[#35353E]">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-8 h-8 text-[#1D8751]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Account Successfully Verified</h2>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              Your account has been successfully verified. You can now access all
              the features of the platform.
            </p>
            <button
              onClick={handleVerificationSubmit}
              className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Continue to Dashboard"}
            </button>
          </div>
        </div>
      )}

      {/* Main KYC Modal */}
      {!showSuccessModal && (
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4 border border-[#35353E]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Identity Verification Required</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
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
          
          {!showWebSdk ? (
            <div className="text-gray-300 space-y-4">
              <p>
                Please verify your identity by clicking the button below.
                You will be redirected to the SumSub verification page.
              </p>
              <p>
                Prepare your identity documents (e.g., ID card, passport,
                driver&apos;s license) for verification purposes.
              </p>
              
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between mb-6 items-center w-full mt-6">
                <button
                  className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleVerifyClick}
                  disabled={loading || verifying}
                >
                  {verifying ? "Initializing..." : "Verify Identity"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              {accessToken && (
                <div className="border border-[#35353E] rounded-lg p-4">
                  <SumsubWebSdk
                    accessToken={accessToken}
                    expirationHandler={handleTokenRefresh}
                    config={{
                      lang: "en",
                      email: user?.email || "",
                    }}
                    options={{
                      addViewportTag: false,
                      adaptIframeHeight: true,
                      useCustomCss: true,
                    }}
                    onMessage={handleSumSubMessage}
                    onError={(error: Error) => {
                      console.error("SumSub Error:", error);
                      setError("Verification process encountered an error");
                      showToast.error("Verification Error", "Verification process encountered an error");
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KYCVerificationModal; 