"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { 
  closeKYCModal, 
  verifyKYCStatus,
  logout 
} from "@/features/auth/slices/authSlice";
import { checkKYCStatus } from "@/features/kyc/slices/kycSlice";
import { showToast } from "@/lib/utils/toast";

const KYCVerificationModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { kycModalOpen, loading, user, tokens } = useSelector((state: RootState) => state.auth);
  
  const [error, setError] = useState<string | null>(null);
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationData, setVerificationData] = useState({
    country: 'Somalia',
    documentType: '',
    documentNumber: '',
    location: '',
    email: user?.email || '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [documentImage, setDocumentImage] = useState<File | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [captureInstructions, setCaptureInstructions] = useState("Look at the camera");
  const [isRotating, setIsRotating] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Update email when user changes
    if (user?.email) {
      setVerificationData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

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
        if (!verificationData.location) {
          setError("Please provide your current location");
          return false;
        }
        return true;
      case 3:
        if (!documentImage) {
          setError("Please upload a clear image of your document");
          return false;
        }
        return true;
      case 4:
        if (!faceImage) {
          setError("Please capture your face for verification");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setCameraStream(stream);
      
      // Set video source and play after a short delay
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      setError("Unable to access camera. Please check permissions.");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const captureFace = () => {
    setIsCapturing(true);
    setIsRotating(true);
    setCaptureProgress(0);
    setCaptureInstructions("Look at the camera and follow the green arc");
    
    // Face rotation capture steps like SumSub
    const rotationSteps = [
      { progress: 20, instruction: "Look straight at the camera" },
      { progress: 40, instruction: "Turn your head to the right" },
      { progress: 60, instruction: "Turn your head to the left" },
      { progress: 80, instruction: "Look up slightly" },
      { progress: 100, instruction: "Look down slightly" }
    ];
    
    let currentStep = 0;
    const rotationInterval = setInterval(() => {
      if (currentStep < rotationSteps.length) {
        const step = rotationSteps[currentStep];
        setCaptureProgress(step.progress);
        setCaptureInstructions(step.instruction);
        currentStep++;
      } else {
        // Capture complete - actually capture from video
        clearInterval(rotationInterval);
        
        if (videoRef.current) {
          // Create canvas to capture frame from video
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          
          if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });
                setFaceImage(file);
                
                // Create preview URL
                const reader = new FileReader();
                reader.onload = (e) => {
                  setFacePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }, 'image/jpeg', 0.8);
          }
        }
        
        setIsCapturing(false);
        setIsRotating(false);
        setCaptureProgress(100);
        setCaptureInstructions("Face captured successfully!");
        stopCamera();
      }
    }, 2000); // Increased time for each step
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file");
        return;
      }
      setDocumentImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentPreview(e.target?.result as string);
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
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!user?.user_id) {
        setError("User ID not found");
        showToast.error("Verification Error", "User ID not found");
        return;
      }

      // Prepare verification data for API submission
      const verificationPayload = {
        user_id: user.user_id,
        status: true,
        verification_data: {
          country: verificationData.country,
          document_type: verificationData.documentType,
          document_number: verificationData.documentNumber,
          location: verificationData.location,
          email: verificationData.email,
          document_image: documentImage,
          face_image: faceImage
        }
      };

      console.log("Submitting to /api/kyc/verify/:", verificationPayload);
      
      // Call the KYC verification API
      const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dev.backend.omaya.io";
      const response = await fetch(`${API_BASE_URL}/api/kyc/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access || ''}`
        },
        body: JSON.stringify({
        user_id: user.user_id,
          status: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("KYC Verification Response:", result);
        
        // Refetch KYC status after successful verification
        dispatch(checkKYCStatus());
        
        showToast.success("Verification Submitted", "Your verification details have been submitted for review");
        setShowManualVerification(false);
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Verification submission failed");
        showToast.error("Verification Error", errorData.message || "Verification submission failed");
      }
    } catch (error) {
      console.error("KYC Verification Error:", error);
      setError("An error occurred during verification submission");
      showToast.error("Verification Error", "An error occurred during verification submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Refetch KYC status to get the latest verification state
      dispatch(checkKYCStatus());
      
      showToast.success("Account Verified", "Your account verification is complete");
      setShowSuccessModal(false);
      dispatch(closeKYCModal());
    } catch (error) {
      setError("An error occurred");
      showToast.error("Verification Error", "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeKYCModal());
    setShowManualVerification(false);
    setError(null);
    setShowSuccessModal(false);
    setCurrentStep(1);
    setDocumentImage(null);
    setFaceImage(null);
    setDocumentPreview(null);
    setFacePreview(null);
    stopCamera();
    setVerificationData({
      country: 'Somalia',
      documentType: '',
      documentNumber: '',
      location: '',
      email: user?.email || '',
    });
  };

  // Handle video stream updates
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraStream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
              <h2 className="text-xl font-semibold text-white">Verification Submitted</h2>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              Your verification details have been submitted for review. 
              You will be notified once the verification process is complete.
            </p>
            <button
              onClick={handleFinalSubmit}
              className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Continue to Dashboard"}
            </button>
          </div>
        </div>
      )}

      {/* Step-by-Step Verification Form */}
      {showManualVerification && !showSuccessModal && (
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4 border border-[#35353E] max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Identity Verification - Step {currentStep} of 4</h2>
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
              style={{ width: `${(currentStep / 4) * 100}%` }}
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

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1D8751]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Current Location</h3>
                <p className="text-gray-400 text-sm">Please provide your current location</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                <input
                  type="text"
                  value={verificationData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#35353E] rounded-lg text-white focus:outline-none focus:border-[#1D8751]"
                  placeholder="Enter your current city and country"
                />
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1D8751]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Document Photo</h3>
                <p className="text-gray-400 text-sm">Upload a clear photo of your document</p>
              </div>

               <div className="border-2 border-dashed border-[#35353E] rounded-lg p-8 text-center">
                 {documentImage && documentPreview ? (
                   <div className="space-y-4">
                     <div className="relative inline-block">
                       <img
                         src={documentPreview}
                         alt="Document preview"
                         className="max-w-full max-h-64 rounded-lg border border-[#35353E]"
                       />
                       <button
                         onClick={() => {
                           setDocumentImage(null);
                           setDocumentPreview(null);
                         }}
                         className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200"
                       >
                         ×
                       </button>
                     </div>
                     <p className="text-green-400 font-medium">Document uploaded successfully</p>
                     <p className="text-gray-400 text-sm">{documentImage.name}</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleDocumentUpload}
                       className="hidden"
                       id="document-upload"
                     />
                     <label
                       htmlFor="document-upload"
                       className="cursor-pointer inline-flex items-center px-4 py-2 bg-[#1D8751] hover:bg-[#167a47] text-white rounded-lg transition-colors duration-200"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                       Upload Document Photo
                     </label>
                     <p className="text-gray-400 text-sm">Max file size: 5MB</p>
                   </div>
                 )}
               </div>
            </div>
          )}

           {/* Step 4: Face Verification with Rotation */}
           {currentStep === 4 && (
             <div className="space-y-4">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-[#1D8751]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-semibold text-white mb-2">Face Verification</h3>
                 <p className="text-gray-400 text-sm">Please look at the camera and follow the rotation guide</p>
               </div>

               <div className="space-y-6">
                 {!cameraStream && !faceImage && (
                   <div className="text-center">
                     <button
                       onClick={startCamera}
                       className="inline-flex items-center px-6 py-3 bg-[#1D8751] hover:bg-[#167a47] text-white rounded-lg transition-colors duration-200"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                       Start Camera
                     </button>
                   </div>
                 )}

                 {cameraStream && !faceImage && (
                   <div className="space-y-6">
                     {/* Camera Feed with Overlay */}
                     <div className="relative flex justify-center">
                       <div className="relative w-80 h-60 bg-black rounded-lg overflow-hidden">
                         <video
                           ref={videoRef}
                           className="w-full h-full object-cover"
                           autoPlay
                           muted
                           playsInline
                         />
                         
                         {/* Rotation Progress Overlay */}
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="relative w-32 h-32">
                             <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                               {/* Background circle */}
                               <circle
                                 cx="50"
                                 cy="50"
                                 r="45"
                                 fill="none"
                                 stroke="rgba(55, 65, 81, 0.5)"
                                 strokeWidth="3"
                               />
                               {/* Progress arc */}
                               <circle
                                 cx="50"
                                 cy="50"
                                 r="45"
                                 fill="none"
                                 stroke="#1D8751"
                                 strokeWidth="4"
                                 strokeDasharray={`${2 * Math.PI * 45}`}
                                 strokeDashoffset={`${2 * Math.PI * 45 * (1 - captureProgress / 100)}`}
                                 strokeLinecap="round"
                               />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center">
                               <div className="text-center">
                                 <div className="text-xl font-bold text-white drop-shadow-lg">{captureProgress}%</div>
                                 <div className="text-xs text-gray-300 drop-shadow-lg">Complete</div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Instructions */}
                     <div className="text-center">
                       <p className="text-white text-lg font-medium mb-2">{captureInstructions}</p>
                       {isRotating && (
                         <div className="flex items-center justify-center space-x-2">
                           <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                           <div className="w-2 h-2 bg-[#1D8751] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                         </div>
                       )}
                     </div>

                     {/* Camera Controls */}
                     <div className="text-center">
                       <div className="space-y-2">
                         <button
                           onClick={captureFace}
                           disabled={isCapturing}
                           className="px-6 py-2 bg-[#1D8751] hover:bg-[#167a47] disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
                         >
                           {isCapturing ? "Capturing..." : "Capture Face"}
                         </button>
                         <button
                           onClick={stopCamera}
                           className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 ml-2"
                         >
                           Stop Camera
                         </button>
                       </div>
                     </div>
                   </div>
                 )}

                 {faceImage && facePreview && (
                   <div className="text-center space-y-4">
                     <div className="relative inline-block">
                       <img
                         src={facePreview}
                         alt="Face capture preview"
                         className="w-48 h-36 object-cover rounded-lg border border-[#35353E]"
                       />
                       <button
                         onClick={() => {
                           setFaceImage(null);
                           setFacePreview(null);
                           setCaptureProgress(0);
                           setCaptureInstructions("Look at the camera");
                           startCamera();
                         }}
                         className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200"
                       >
                         ×
                       </button>
                     </div>
                     <p className="text-green-400 font-medium">Face captured successfully!</p>
                     <button
                       onClick={() => {
                         setFaceImage(null);
                         setFacePreview(null);
                         setCaptureProgress(0);
                         setCaptureInstructions("Look at the camera");
                         startCamera();
                       }}
                       className="text-blue-400 hover:text-blue-300 text-sm"
                     >
                       Capture again
                     </button>
                   </div>
                 )}
               </div>
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
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-10 rounded-lg transition-colors duration-200"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleManualVerificationSubmit}
                className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Verification"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main KYC Modal */}
      {!showManualVerification && !showSuccessModal && (
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
                  className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleManualVerificationClick}
                disabled={loading}
                >
                Start Manual Verification
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerificationModal; 
