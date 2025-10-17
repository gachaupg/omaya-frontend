"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { 
  closeKYCModal, 
  logout 
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

  useEffect(() => {
    // Update email when user changes
    if (user?.email) {
      setVerificationData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

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

  const handleManualVerificationClick = () => {
    setShowManualVerification(true);
    setError(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
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
    console.log("Face Detection Data:", data);
    setFaceDetectionData(data);
    
    // Convert base64 face image to File object if available
    if (data.faceImage) {
      try {
        const response = await fetch(data.faceImage);
        const blob = await response.blob();
        const file = new File([blob], "face-verification.jpg", { type: "image/jpeg" });
        setFaceImage(file);
        setFacePreview(data.faceImage);
        console.log("Face image file created successfully:", file);
      } catch (error) {
        console.error("Error converting face image:", error);
        // Still set the face preview even if file conversion fails
        setFacePreview(data.faceImage);
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
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
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

      console.log("Submitting KYC verification for user:", user.user_id);
      console.log("Face Detection Data:", faceDetectionData);
      console.log("Verification Data:", {
        country: verificationData.country,
        documentType: verificationData.documentType,
        documentNumber: verificationData.documentNumber,
      });
      
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
        console.log("Face image file not ready, including in face_data");
      }
      
      // Add face detection data
      if (faceDetectionData) {
        formData.append('face_data', JSON.stringify(faceDetectionData));
      }
      
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      // Call the KYC verification API using the thunk
      // Only include images that are valid File objects
      const kycImages = [documentFrontImage, documentBackImage, faceImage].filter(
        (img): img is File => img instanceof File
      );
      
      console.log("KYC Images to submit:", kycImages.length, "files");
      console.log("Verification Data to submit:", {
        user_id: user.user_id,
        status: true,
        is_verified: true,
        verification_method: 'manual_with_face_detection',
        country: verificationData.country,
        document_type: verificationData.documentType,
        document_number: verificationData.documentNumber,
        images_count: kycImages.length
      });
      
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

      console.log("KYC Verification Response:", result);
      
      // Check if response indicates pending status
      const responseData = result as any;
      const isPending = responseData?.data?.status === "pending" || 
                       responseData?.status === "pending" ||
                       responseData?.data?.is_verified === false;
      
      // Store pending status in localStorage
      if (isPending) {
        localStorage.setItem('kyc_verification_status', JSON.stringify({
          status: 'pending',
          submittedAt: new Date().toISOString(),
          user_id: user.user_id
        }));
        
        // Show pending verification modal
        setShowManualVerification(false);
        setShowPendingModal(true);
        showToast.info("Verification Pending", "Your verification is under review");
      } else {
        // Verified immediately - clear localStorage and show success
        localStorage.removeItem('kyc_verification_status');
      setShowManualVerification(false);
      setShowSuccessModal(true);
        showToast.success("Verification Approved", "Your verification has been approved");
      }
      
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

  const handleClose = () => {
    dispatch(closeKYCModal());
    setShowManualVerification(false);
    setError(null);
    setShowSuccessModal(false);
    setShowPendingModal(false);
    setCurrentStep(1);
    setDocumentFrontImage(null);
    setDocumentBackImage(null);
    setFaceImage(null);
    setFaceDetectionData(null);
    setDocumentFrontPreview(null);
    setDocumentBackPreview(null);
    setFacePreview(null);
    setVerificationData({
      country: 'Somalia',
      documentType: '',
      documentNumber: '',
      email: user?.email || '',
    });
  };

  if (!kycModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" 
         style={{ background: "rgba(24, 24, 29, 0.5)" }}>
      
      {/* Success Modal - Verified Immediately */}
      {showSuccessModal && (
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-[#35353E]">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-8 h-8 text-[#1D8751]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Verification Approved!</h2>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              Your verification has been approved. You can now access all platform features.
            </p>
            
            <button
              onClick={handleFinalSubmit}
              className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </div>
              </div>
            )}

      {/* Pending Verification Modal - Waiting for Admin Review */}
      {showPendingModal && (
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-[#35353E]">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Animated pending icon */}
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-[#F79330]/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#F79330] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-2">Verification Pending</h2>
            <p className="text-gray-300 text-sm mb-6">
              Your verification documents have been submitted successfully and are currently under review by our team. 
              We'll notify you once the verification is complete.
            </p>
            
            <div className="bg-[#2A2A2A] border border-[#35353E] rounded-lg p-4 mb-6 w-full">
              <div className="flex items-start gap-3 text-left">
                <svg className="w-5 h-5 text-[#1D8751] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-white mb-1">What's Next?</p>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Our team will review your documents</li>
                    <li>• This usually takes 24-48 hours</li>
                    <li>• You'll receive a notification via email</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleClosePendingModal}
              disabled={isSubmitting}
              className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </div>
        </div>
      )}

      {/* Step-by-Step Verification Form */}
      {showManualVerification && !showSuccessModal && !showPendingModal && (
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4 border border-[#35353E] max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Identity Verification - Step {currentStep} of 3</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <div 
              className="bg-[#1D8751] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Document Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1D8751]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Document Information</h3>
                <p className="text-gray-400 text-sm">Please provide your document details</p>
              </div>

              <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                   <select
                     value={verificationData.country}
                     onChange={(e) => handleInputChange('country', e.target.value)}
                     className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#35353E] rounded-lg text-white focus:outline-none focus:border-[#1D8751]"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Document Type *</label>
                  <select
                    value={verificationData.documentType}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#35353E] rounded-lg text-white focus:outline-none focus:border-[#1D8751]"
                  >
                    <option value="">Select document type</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Document Number *</label>
                  <input
                    type="text"
                    value={verificationData.documentNumber}
                    onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#35353E] rounded-lg text-white focus:outline-none focus:border-[#1D8751]"
                    placeholder="Enter your document number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1D8751]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Document Photos</h3>
                <p className="text-gray-400 text-sm">Upload clear photos of both sides of your document</p>
              </div>

              {/* Front Side Upload */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <span className="bg-[#1D8751] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                  Front Side of Document *
                </h4>
                <div className="border-2 border-dashed border-[#35353E] rounded-lg p-6 text-center">
                  {documentFrontImage && documentFrontPreview ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={documentFrontPreview}
                          alt="Document front preview"
                          className="max-w-full max-h-48 rounded-lg border border-[#35353E]"
                        />
                        <button
                          onClick={() => {
                            setDocumentFrontImage(null);
                            setDocumentFrontPreview(null);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-green-400 font-medium">Front side uploaded successfully</p>
                      <p className="text-gray-400 text-sm">{documentFrontImage.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDocumentFrontUpload}
                        className="hidden"
                        id="document-front-upload"
                      />
                      <label
                        htmlFor="document-front-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-[#1D8751] hover:bg-[#167a47] text-white rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Upload Front Side
                      </label>
                      <p className="text-gray-400 text-sm">Max file size: 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Side Upload */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <span className="bg-[#1D8751] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                  Back Side of Document *
                </h4>
                <div className="border-2 border-dashed border-[#35353E] rounded-lg p-6 text-center">
                  {documentBackImage && documentBackPreview ? (
                   <div className="space-y-4">
                     <div className="relative inline-block">
                       <img
                          src={documentBackPreview}
                          alt="Document back preview"
                          className="max-w-full max-h-48 rounded-lg border border-[#35353E]"
                       />
                       <button
                         onClick={() => {
                            setDocumentBackImage(null);
                            setDocumentBackPreview(null);
                         }}
                         className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200"
                       >
                         ×
                       </button>
                     </div>
                      <p className="text-green-400 font-medium">Back side uploaded successfully</p>
                      <p className="text-gray-400 text-sm">{documentBackImage.name}</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     <input
                       type="file"
                       accept="image/*"
                        onChange={handleDocumentBackUpload}
                       className="hidden"
                        id="document-back-upload"
                     />
                     <label
                        htmlFor="document-back-upload"
                       className="cursor-pointer inline-flex items-center px-4 py-2 bg-[#1D8751] hover:bg-[#167a47] text-white rounded-lg transition-colors duration-200"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                        Upload Back Side
                     </label>
                     <p className="text-gray-400 text-sm">Max file size: 5MB</p>
                   </div>
                 )}
                </div>
               </div>
            </div>
          )}

           {/* Step 3: Face Verification with AI Detection */}
           {currentStep === 3 && (
             <div className="space-y-4">
               <FaceDetectionKYC
                 onVerificationComplete={handleFaceDetectionComplete}
               />
               
               {/* Face Verification Status Indicator */}
               {faceDetectionData && faceDetectionData.faceDetected && (
                 <div className="bg-green-900/20 border border-green-500 text-green-400 p-4 rounded-lg flex items-start gap-3">
                   <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                   <div className="flex-1">
                     <p className="font-semibold mb-1">Face Verification Complete!</p>
                     <p className="text-sm text-green-300">
                       Your face has been successfully captured and verified. You can now proceed to submit your verification.
                     </p>
                   </div>
                 </div>
               )}
             </div>
           )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white h-10 rounded-lg transition-colors duration-200"
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-10 rounded-lg transition-colors duration-200"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleManualVerificationSubmit}
                className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-[#35353E]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Identity Verification Required</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
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
              className="text-red-400 hover:text-red-300 transition-colors p-1"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          
            <div className="text-gray-300 space-y-4">
              <p>
              Please verify your identity by providing your personal information and 
              document details for manual verification.
            </p>
            <p className="text-sm">
              This process helps us ensure the security of your account and comply 
              with regulatory requirements.
              </p>
              
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between mb-6 items-center w-full mt-6">
                <button
                  className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={handleManualVerificationClick}
                disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    "Start Manual Verification"
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
