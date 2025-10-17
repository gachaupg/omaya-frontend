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
} from "@/features/auth/slices/authSlice";
import SumsubWebSdk from "@sumsub/websdk-react";
import { showToast } from "@/lib/utils/toast";
import FaceDetectionKYC from "./FaceDetectionKYC";

type VerificationMethod = 'none' | 'sumsub' | 'facedetection';

const EnhancedKYCModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { kycModalOpen, loading, user } = useSelector((state: RootState) => state.auth);
  
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('none');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [showWebSdk, setShowWebSdk] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faceDetectionData, setFaceDetectionData] = useState<any>(null);

  useEffect(() => {
    if (accessToken) {
      setShowWebSdk(true);
    }
  }, [accessToken]);

  const handleSumSubVerification = async () => {
    setVerifying(true);
    setError(null);
    setVerificationMethod('sumsub');

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

  const handleFaceDetectionComplete = (data: any) => {
    console.log("Face Detection Data:", data);
    setFaceDetectionData(data);
    setVerificationStatus(true);
    showToast.success("Face Verified", "Your face has been successfully captured");
    setTimeout(() => setShowSuccessModal(true), 2000);
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
        status: verificationStatus,
        verification_method: verificationMethod,
        face_data: faceDetectionData
      }));

      if (verifyKYCStatus.fulfilled.match(result)) {
        showToast.success("Account Verified", "Your account has been successfully verified");
        setShowSuccessModal(false);
        dispatch(closeKYCModal());
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
    setVerificationMethod('none');
    setShowWebSdk(false);
    setAccessToken(null);
    setApplicantId(null);
    setError(null);
    setVerificationStatus(false);
    setShowSuccessModal(false);
    setFaceDetectionData(null);
  };

  if (!kycModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" 
         style={{ background: "rgba(24, 24, 29, 0.8)" }}>
      
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
            {faceDetectionData && (
              <div className="text-sm text-gray-400 mb-4 p-3 bg-[#0a0a0a] rounded border border-[#35353E]">
                <p>Age: {faceDetectionData.age} years</p>
                <p>Gender: {faceDetectionData.gender}</p>
                <p>Confidence: {faceDetectionData.confidence}%</p>
              </div>
            )}
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
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4 border border-[#35353E] max-h-[90vh] overflow-y-auto">
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
          
          {/* Verification Method Selection */}
          {verificationMethod === 'none' && (
            <div className="text-gray-300 space-y-6">
              <p className="text-center mb-6">
                Choose your preferred verification method
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Face Detection Option */}
                <button
                  onClick={() => setVerificationMethod('facedetection')}
                  className="p-6 bg-[#0a0a0a] hover:bg-[#1a1a1a] border-2 border-[#1D8751] rounded-lg transition-all group"
                >
                  <div className="flex flex-col items-center text-center">
                    <svg className="w-16 h-16 text-[#1D8751] mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white mb-2">Face Detection</h3>
                    <p className="text-sm text-gray-400">Quick verification using your camera</p>
                    <span className="mt-3 px-3 py-1 bg-[#1D8751] text-white text-xs rounded-full">Recommended</span>
                  </div>
                </button>

                {/* SumSub Option */}
                <button
                  onClick={handleSumSubVerification}
                  disabled={loading || verifying}
                  className="p-6 bg-[#0a0a0a] hover:bg-[#1a1a1a] border-2 border-[#35353E] hover:border-[#2196F3] rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center text-center">
                    <svg className="w-16 h-16 text-[#2196F3] mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white mb-2">Document Verification</h3>
                    <p className="text-sm text-gray-400">Full KYC with ID documents</p>
                    {verifying && <span className="mt-3 text-xs text-[#2196F3]">Initializing...</span>}
                  </div>
                </button>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg mt-4">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Face Detection View */}
          {verificationMethod === 'facedetection' && !showWebSdk && (
            <div>
              <button
                onClick={() => setVerificationMethod('none')}
                className="mb-4 text-[#2196F3] hover:text-[#1976D2] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to methods
              </button>
              <FaceDetectionKYC
                onVerificationComplete={handleFaceDetectionComplete}
                onClose={() => setVerificationMethod('none')}
              />
            </div>
          )}

          {/* SumSub View */}
          {verificationMethod === 'sumsub' && showWebSdk && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setVerificationMethod('none');
                  setShowWebSdk(false);
                  setAccessToken(null);
                }}
                className="mb-4 text-[#2196F3] hover:text-[#1976D2] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to methods
              </button>

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

export default EnhancedKYCModal;

