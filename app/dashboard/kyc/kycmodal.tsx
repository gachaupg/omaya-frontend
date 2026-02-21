"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { 
  closeKYCModal, 
  logout,
  sendPhoneOTP,
  verifyPhoneOTP,
  checkKYCStatus as checkAuthKYCStatus
} from "@/features/auth/slices/authSlice";
import { checkKYCStatus, verifyKYCStatus } from "@/features/kyc/slices/kycSlice";
import { showToast } from "@/lib/utils/toast";
import { FaceDetectionKYC } from "@/features/kyc/components";

const KYCVerificationModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { kycModalOpen, loading, user, tokens } = useSelector((state: RootState) => state.auth);
  
  const [error, setError] = useState<string | null>(null);
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [verificationData, setVerificationData] = useState({
    country: 'Somalia',
    documentType: '',
    documentNumber: '',
    email: user?.email || '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [documentFrontImage, setDocumentFrontImage] = useState<File | null>(null);
  const [documentBackImage, setDocumentBackImage] = useState<File | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceDetectionData, setFaceDetectionData] = useState<any>(null);
  const [documentFrontPreview, setDocumentFrontPreview] = useState<string | null>(null);
  const [documentBackPreview, setDocumentBackPreview] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [kycSubmitMessage, setKycSubmitMessage] = useState<string | null>(null);
  const isWaitingApproval =
    kycStatus?.status === "waiting_approval" && kycStatus?.is_verified === false;

  useEffect(() => {
    // Update email when user changes
    if (user?.email) {
      setVerificationData(prev => ({ ...prev, email: user.email }));
    }
    // Auto-populate phone from profile so it matches registered number
    if (user?.phone_number && user.phone_number.trim()) {
      setPhoneNumber(user.phone_number.trim());
    }
  }, [user?.email, user?.phone_number]);

  // Check KYC status for phone verification
  useEffect(() => {
    if (kycModalOpen && user) {
      dispatch(checkAuthKYCStatus()).then((result: any) => {
        if (result.payload) {
          const status = result.payload as any;
          setKycStatus(status);
          if (status.phone_verified === true) {
            setPhoneVerified(true);
          }
          // Keep phone field in sync with profile if API returns a phone
          if (user?.phone_number?.trim()) {
            setPhoneNumber(user.phone_number.trim());
          }
        }
      });
    }
  }, [kycModalOpen, user, dispatch]);

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

  // Check localStorage for pending verification status on mount
  useEffect(() => {
    if (kycModalOpen && user?.user_id) {
      const storedStatus = localStorage.getItem('kyc_verification_status');
      if (storedStatus) {
        try {
          const parsed = JSON.parse(storedStatus);
          // Check if stored status is for current user and is pending
          if (parsed.user_id === user.user_id && parsed.status === 'pending') {
            // Fetch current KYC status from API
            dispatch(checkKYCStatus()).then((result: any) => {
              const isVerified = (result.payload as any)?.is_verified;
              if (isVerified) {
                // Verified! Clear localStorage
                localStorage.removeItem('kyc_verification_status');
                dispatch(closeKYCModal());
              } else {
                // Still pending, show pending modal
                setShowPendingModal(true);
              }
            });
          }
        } catch (error) {
          console.error("Error parsing KYC status from localStorage:", error);
        }
      }
    }
  }, [kycModalOpen, user?.user_id, dispatch]);

  const handleManualVerificationClick = async () => {
    setError(null);
    
    // Check if phone is already verified
    if (phoneVerified || kycStatus?.phone_verified === true) {
      // Phone already verified, start from step 1 (document info)
      setCurrentStep(1);
      setShowManualVerification(true);
      return;
    }
    
    // Phone not verified, start from step 0 (phone verification)
    setCurrentStep(0);
    setShowManualVerification(true);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      showToast.error("Error", "Please enter your phone number");
      return;
    }

    setSendingOTP(true);
    setError(null);
    try {
      const result = await dispatch(sendPhoneOTP({ phone_number: phoneNumber })).unwrap();
      setOtpSent(true);
      setResendTimer(60); // 60 seconds cooldown
      showToast.success(
        "OTP Sent",
        `OTP sent successfully via ${result.channel === "whatsapp" ? "WhatsApp" : "SMS"}`
      );
    } catch (error: any) {
      const errorMsg = typeof error === "string" ? error : "Failed to send OTP. Please try again.";
      setError(errorMsg);
      showToast.error("Error", errorMsg);
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      showToast.error("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setVerifyingOTP(true);
    setError(null);
    try {
      const result = await dispatch(verifyPhoneOTP({ otp })).unwrap();
      if (result.phone_verified) {
        setPhoneVerified(true);
        showToast.success("Success", "Phone number verified successfully");
        
        // Refresh KYC status
        const kycResult = await dispatch(checkAuthKYCStatus()).unwrap();
        setKycStatus(kycResult);
        
        // Move to next step (document info)
        setCurrentStep(1);
        setError(null);
      }
    } catch (error: any) {
      const errorMsg = typeof error === "string" ? error : "Invalid or expired OTP. Please try again.";
      setError(errorMsg);
      showToast.error("Error", errorMsg);
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

  const handleInputChange = (field: string, value: string) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 0:
        // Phone verification step - OTP must be verified
        if (!phoneVerified) {
          setError("Please verify your phone number first");
          return false;
        }
        return true;
      case 1:
        if (!verificationData.country || !verificationData.documentType || !verificationData.documentNumber) {
          setError("Please fill in all required fields");
          return false;
        }
        return true;
      case 2:
        if (!documentFrontImage) {
          setError("Please upload the front side of your document");
          showToast.error("Please upload the front side of your document");
          return false;
        }
        if (!documentBackImage) {
          setError("Please upload the back side of your document");
          showToast.error("Please upload the back side of your document");
          return false;
        }
        return true;
      case 3:
        if (!faceDetectionData || !faceDetectionData.faceDetected) {
          setError("Please complete face verification");
          showToast.error("Please complete face verification");
          return false;
        }
        // Face image validation is optional - face detection data is sufficient
        // The image will be included if available, but not required for submission
        return true;
      default:
        return true;
    }
  };

  const handleFaceDetectionComplete = async (data: any) => {
    setFaceDetectionData(data);
    
    // Convert base64 face image to File object - FaceDetectionKYC sends capturedImage (camera) or manual upload
    const base64Image = data.capturedImage || data.faceImage;
    if (base64Image) {
      try {
        const response = await fetch(base64Image);
        const blob = await response.blob();
        const file = new File([blob], "face-verification.jpg", { type: "image/jpeg" });
        setFaceImage(file);
        setFacePreview(base64Image);
      } catch (error) {
        console.error("Error converting face image:", error);
        setFacePreview(base64Image);
      }
    }
    
    showToast.success("Face Verified", "Your face has been successfully captured and verified");
  };

  const handleDocumentFrontUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size must be less than 5MB");
        showToast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file");
        showToast.error("Please upload an image file");
        return;
      }
      setDocumentFrontImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentFrontPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const handleDocumentBackUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size must be less than 5MB");
        showToast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file");
        showToast.error("Please upload an image file");
        return;
      }
      setDocumentBackImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentBackPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      // If on phone verification step and phone is verified, move to step 1
      if (currentStep === 0 && phoneVerified) {
        setCurrentStep(1);
      } else {
        setCurrentStep(prev => prev + 1);
      }
      setError(null);
    }
  };

  const prevStep = () => {
    // Don't allow going back from step 1 if phone is not verified
    if (currentStep === 1 && !phoneVerified) {
      setCurrentStep(0);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
    setError(null);
  };

  const handleManualVerificationSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!user?.user_id) {
        setError("User ID not found");
        showToast.error("Verification Error", "User ID not found");
        return;
      }

     
      // Validate required fields before submission
      if (!verificationData.documentType || !verificationData.documentNumber) {
        setError("Document type and number are required");
        showToast.error("Document type and number are required");
        return;
      }
      
      // Prepare FormData with images (for logging only - actual FormData created in thunk)
      const formData = new FormData();
      formData.append('user_id', user.user_id.toString());
      formData.append('status', 'true');
      formData.append('is_verified', 'true');
      formData.append('verification_method', 'manual_with_face_detection');
      formData.append('country', verificationData.country);
      formData.append('document_type', verificationData.documentType);
      formData.append('document_number', verificationData.documentNumber);
      
      // Add images to kyc_images array
      if (documentFrontImage) {
        formData.append('kyc_images', documentFrontImage, 'document-front.jpg');
      }
      if (documentBackImage) {
        formData.append('kyc_images', documentBackImage, 'document-back.jpg');
      }
      // Only add face image if it has been successfully converted to a File
      if (faceImage && faceImage instanceof File) {
        formData.append('kyc_images', faceImage, 'face-verification.jpg');
      } else if (facePreview) {
        // If face image File is not ready but we have preview, include it as base64 in face_data
      }
      
      // Add face detection data
      if (faceDetectionData) {
        formData.append('face_data', JSON.stringify(faceDetectionData));
      }
      
      // Call the KYC verification API using the thunk
      // Only include images that are valid File objects
      const kycImages = [documentFrontImage, documentBackImage, faceImage].filter(
        (img): img is File => img instanceof File
      );
      
     
      const result = await dispatch(verifyKYCStatus({
        user_id: user.user_id,
        status: true,
        is_verified: true,
        verification_method: 'manual_with_face_detection',
        face_data: {
          ...faceDetectionData,
          // Include face preview if face image file is not ready
          faceImagePreview: facePreview || faceDetectionData.faceImage,
        },
        kyc_images: kycImages.length > 0 ? kycImages : undefined,
        country: verificationData.country,
        document_type: verificationData.documentType,
        document_number: verificationData.documentNumber,
      })).unwrap();

      // Store backend message to show in the modal
      if (result?.message) {
        setKycSubmitMessage(result.message);
      } else {
        setKycSubmitMessage("Your KYC has been submitted. Please wait for admin approval.");
      }

      // Always show success modal and close form
      localStorage.removeItem('kyc_verification_status');
      setShowManualVerification(false);
      setShowSuccessModal(true);
      showToast.success("Verification Submitted", "Your verification has been submitted successfully");
      
      // Refetch KYC status after successful verification
      dispatch(checkKYCStatus());
    } catch (error) {
      console.error("KYC Verification Error:", error);
      const errorMessage = typeof error === 'string' ? error : "An error occurred during verification submission";
      setError(errorMessage);
      showToast.error("Verification Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Refetch KYC status to get the latest verification state
      const kycResult = await dispatch(checkKYCStatus());
      
      if ((kycResult.payload as any)?.is_verified) {
        // Clear localStorage when verified
        localStorage.removeItem('kyc_verification_status');
      showToast.success("Account Verified", "Your account verification is complete");
      setShowSuccessModal(false);
        setShowPendingModal(false);
      dispatch(closeKYCModal());
      } else {
        showToast.info("Verification Pending", "Your verification is still under review");
      }
    } catch (error) {
      setError("An error occurred");
      showToast.error("Verification Error", "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePendingModal = async () => {
    setIsSubmitting(true);
    try {
      // Query KYC status to check if verified
      const kycResult = await dispatch(checkKYCStatus());
      
      if ((kycResult.payload as any)?.is_verified) {
        // Verified! Clear localStorage and close
        localStorage.removeItem('kyc_verification_status');
        showToast.success("Account Verified", "Your account verification is complete");
        setShowPendingModal(false);
        dispatch(closeKYCModal());
      } else {
        // Still pending, just close modal but keep localStorage
        showToast.info("Verification Pending", "Your verification is still under review");
        setShowPendingModal(false);
        dispatch(closeKYCModal());
      }
    } catch (error) {
      console.error("Error checking KYC status:", error);
      setShowPendingModal(false);
      dispatch(closeKYCModal());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatusClick = async () => {
    setIsSubmitting(true);
    try {
      const kycResult = await dispatch(checkKYCStatus());
      if ((kycResult.payload as any)?.is_verified) {
        localStorage.removeItem("kyc_verification_status");
        showToast.success(
          "Account Verified",
          "Your account verification is complete"
        );
        setShowPendingModal(false);
        dispatch(closeKYCModal());
      } else {
        // Still under review – show pending modal
        setShowPendingModal(true);
        showToast.info(
          "Verification Pending",
          "Your verification is still under review"
        );
      }
    } catch (error) {
      console.error("Error checking KYC status:", error);
      showToast.error(
        "Verification Error",
        "Failed to check verification status"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeKYCModal());
    setShowManualVerification(false);
    setError(null);
    setShowSuccessModal(false);
    setShowPendingModal(false);
    setCurrentStep(phoneVerified ? 1 : 0);
    setDocumentFrontImage(null);
    setDocumentBackImage(null);
    setFaceImage(null);
    setFaceDetectionData(null);
    setDocumentFrontPreview(null);
    setDocumentBackPreview(null);
    setFacePreview(null);
    setOtp("");
    setOtpSent(false);
    setResendTimer(0);
    setVerificationData({
      country: 'Somalia',
      documentType: '',
      documentNumber: '',
      email: user?.email || '',
    });
  };

  if (!kycModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      
      {/* Success Modal - Submitted Successfully */}
      {showSuccessModal && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E] shadow-xl">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-8 h-8 text-[#1D8751]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Submitted!</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              {kycSubmitMessage ??
                "Your verification has been submitted successfully. You can now continue using the platform."}
            </p>
            
            <button
              onClick={() => {
                setShowSuccessModal(false);
                dispatch(closeKYCModal());
              }}
              className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Continue to Dashboard
            </button>
          </div>
              </div>
            )}

      {/* Pending Verification Modal - Waiting for Admin Review */}
      {showPendingModal && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E] shadow-xl">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Animated pending icon */}
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-[#F79330]/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F79330] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Verification Pending</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Your verification documents have been submitted successfully and are currently under review by our team. 
              We'll notify you once the verification is complete.
            </p>
            
            {/* <div className="bg-gray-100 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#35353E] rounded-lg p-4 mb-6 w-full">
              <div className="flex items-start gap-3 text-left">
                <svg className="w-5 h-5 text-[#1D8751] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
               
              </div>
            </div> */}
            
            <div className="flex gap-3 w-full">
              <button
                onClick={handleClosePendingModal}
                disabled={isSubmitting}
                className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Checking Status...</span>
                  </>
                ) : (
                  "OK"
                )}
              </button>
              
              <button
                onClick={() => {
                  dispatch(logout());
                  handleClose();
                }}
                disabled={isSubmitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Verification Form */}
      {showManualVerification && !showSuccessModal && !showPendingModal && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-4 max-w-2xl w-full mx-4 border border-gray-200 dark:border-[#35353E] max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Identity Verification - Step {phoneVerified ? currentStep : currentStep + 1} of {phoneVerified ? 3 : 4}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-[#1D8751] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${phoneVerified ? (currentStep / 3) * 100 : ((currentStep + 1) / 4) * 100}%` }}
            ></div>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 p-2 rounded-lg mb-3 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Phone Verification */}
          {currentStep === 0 && !phoneVerified && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Phone Verification</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Verify your phone number to continue</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  We'll send you a verification code via WhatsApp (or SMS if WhatsApp is unavailable).
                </p>
              </div>

              {/* Phone Number Input */}
              {!otpSent && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+254712345678"
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#35353E] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#1D8751]"
                      disabled={sendingOTP}
                    />
                  </div>
                </div>
              )}

              {/* OTP Input */}
              {otpSent && !phoneVerified && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Enter OTP *</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#35353E] rounded-lg text-gray-900 dark:text-white text-center text-lg tracking-widest focus:outline-none focus:border-[#1D8751]"
                      disabled={verifyingOTP}
                    />
                  </div>
                  
                  {/* Resend OTP */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
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
                        className="text-xs text-[#1D8751] hover:underline disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {phoneVerified && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 text-green-600 dark:text-green-400 p-3 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold mb-1 text-sm">Phone Verified!</p>
                    <p className="text-xs text-green-500 dark:text-green-300">
                      Your phone number has been successfully verified.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Document Information */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-[#1D8751]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Document Information</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Please provide your document details</p>
              </div>

              <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country *</label>
                   <select
                     value={verificationData.country}
                     onChange={(e) => handleInputChange('country', e.target.value)}
                     className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#35353E] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#1D8751]"
                   >
                     <option value="Somalia">Somalia</option>
                     <option value="Kenya">Kenya</option>
                     <option value="Ethiopia">Ethiopia</option>
                     <option value="Djibouti">Djibouti</option>
                     <option value="Uganda">Uganda</option>
                     <option value="Tanzania">Tanzania</option>
                     <option value="Sudan">Sudan</option>
                     <option value="South Sudan">South Sudan</option>
                     <option value="Eritrea">Eritrea</option>
                     <option value="Other">Other</option>
                   </select>
                 </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Document Type *</label>
                  <select
                    value={verificationData.documentType}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#35353E] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#1D8751]"
                  >
                    <option value="">Select document type</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Document Number *</label>
                  <input
                    type="text"
                    value={verificationData.documentNumber}
                    onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#35353E] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#1D8751]"
                    placeholder="Enter your document number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-[#1D8751]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Document Photos</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Upload clear photos of both sides</p>
              </div>

              {/* Document Upload Grid - Two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Front Side Upload */}
              <div>
                <h4 className="text-gray-900 dark:text-white text-sm font-medium mb-2 flex items-center gap-1">
                  <span className="bg-[#1D8751] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                  Front Side *
                </h4>
                <div className="border-2 border-dashed border-gray-300 dark:border-[#35353E] rounded-lg p-3 text-center">
                  {documentFrontImage && documentFrontPreview ? (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <img
                          src={documentFrontPreview}
                          alt="Document front preview"
                          className="max-w-full max-h-32 rounded-lg border border-gray-300 dark:border-[#35353E]"
                        />
                        <button
                          onClick={() => {
                            setDocumentFrontImage(null);
                            setDocumentFrontPreview(null);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDocumentFrontUpload}
                        className="hidden"
                        id="document-front-upload"
                      />
                      <label
                        htmlFor="document-front-upload"
                        className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-[#1D8751] hover:bg-[#167a47] text-white text-sm rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Upload
                      </label>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Max: 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Side Upload */}
              <div>
                <h4 className="text-gray-900 dark:text-white text-sm font-medium mb-2 flex items-center gap-1">
                  <span className="bg-[#1D8751] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  Back Side *
                </h4>
                <div className="border-2 border-dashed border-gray-300 dark:border-[#35353E] rounded-lg p-3 text-center">
                  {documentBackImage && documentBackPreview ? (
                   <div className="space-y-2">
                     <div className="relative inline-block">
                       <img
                          src={documentBackPreview}
                          alt="Document back preview"
                          className="max-w-full max-h-32 rounded-lg border border-gray-300 dark:border-[#35353E]"
                       />
                       <button
                         onClick={() => {
                            setDocumentBackImage(null);
                            setDocumentBackPreview(null);
                         }}
                         className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200"
                       >
                         ×
                       </button>
                     </div>
                      <p className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Uploaded</p>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     <input
                       type="file"
                       accept="image/*"
                        onChange={handleDocumentBackUpload}
                       className="hidden"
                        id="document-back-upload"
                     />
                     <label
                        htmlFor="document-back-upload"
                       className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-[#1D8751] hover:bg-[#167a47] text-white text-sm rounded-lg transition-colors duration-200"
                     >
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                        Upload
                     </label>
                     <p className="text-gray-500 dark:text-gray-400 text-xs">Max: 5MB</p>
                   </div>
                 )}
                </div>
               </div>
               </div>
            </div>
          )}

           {/* Step 3: Face Verification with AI Detection */}
           {currentStep === 3 && (
             <div className="space-y-3">
               <FaceDetectionKYC
                 onVerificationComplete={handleFaceDetectionComplete}
               />
               
               {/* Face Verification Status Indicator */}
               {faceDetectionData && faceDetectionData.faceDetected && (
                 <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 text-green-600 dark:text-green-400 p-3 rounded-lg flex items-start gap-2">
                   <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                   <div className="flex-1">
                     <p className="font-semibold mb-1 text-sm">Face Verification Complete!</p>
                     <p className="text-xs text-green-500 dark:text-green-300">
                       Your face has been successfully captured and verified.
                     </p>
                   </div>
                 </div>
               )}
             </div>
           )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 mt-4">
            {currentStep > (phoneVerified ? 1 : 0) && (
              <button
                onClick={prevStep}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white h-9 rounded-lg transition-colors duration-200 text-sm"
              >
                Previous
              </button>
            )}
            
            {currentStep === 0 && !phoneVerified ? (
              // Phone verification step buttons
              <div className="flex gap-2 w-full">
                {!otpSent ? (
                  <button
                    onClick={handleSendOTP}
                    disabled={sendingOTP || !phoneNumber.trim()}
                    className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-9 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {sendingOTP ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleVerifyOTP}
                    disabled={verifyingOTP || !otp || otp.length !== 6}
                    className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-9 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {verifyingOTP ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                )}
                {phoneVerified && (
                  <button
                    onClick={nextStep}
                    className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-9 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Next
                  </button>
                )}
              </div>
            ) : currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-9 rounded-lg transition-colors duration-200 text-sm"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleManualVerificationSubmit}
                className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-9 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Verification"
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main KYC Modal */}
      {!showManualVerification && !showSuccessModal && !showPendingModal && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-[#35353E] shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Identity Verification Required</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={() => {
                dispatch(logout());
                handleClose();
              }}
              className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors p-1"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          
            <div className="text-gray-700 dark:text-gray-300 space-y-4">
              <p>
              Please verify your identity by providing your personal information and 
              document details for manual verification.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This process helps us ensure the security of your account and comply 
              with regulatory requirements.
            </p>

            {isWaitingApproval && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm">
                {kycStatus?.message ??
                  "Your KYC is under verification. Please wait for admin approval."}
              </div>
            )}
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between mb-6 items-center w-full mt-6">
                <button
                  className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={isWaitingApproval ? handleCheckStatusClick : handleManualVerificationClick}
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isWaitingApproval ? "Checking Status..." : "Loading..."}</span>
                    </>
                  ) : (
                    isWaitingApproval ? "Check Status" : "Start Manual Verification"
                  )}
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerificationModal; 