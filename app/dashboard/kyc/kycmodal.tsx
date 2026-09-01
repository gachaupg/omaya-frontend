"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { 
  closeKYCModal,
  openKYCModal,
  logout,
  sendPhoneOTP,
  verifyPhoneOTP,
  checkKYCStatus as checkAuthKYCStatus
} from "@/features/auth/slices/authSlice";
import { verifyKYCStatus } from "@/features/kyc/slices/kycSlice";
import { showToast } from "@/lib/utils/toast";
import { FaceDetectionKYC } from "@/features/kyc/components";
import { countries } from "@/features/auth/components/countries";
import {
  isPassportDocumentType,
  requiresDocumentBackSide,
} from "@/features/kyc/utils/kycDocumentUtils";
import { runIdDocumentOcr } from "@/lib/ocr/runIdDocumentOcr";
import { EMPTY_ID_DOCUMENT_DETAILS } from "@/lib/ocr/types";
import type { IdDocumentDetails } from "@/lib/ocr/types";
import {
  buildKycUserDetails,
  getKycOcrDisplayRows,
  KYC_OCR_READONLY_FIELDS,
} from "@/features/kyc/utils/kycOcrDisplay";
import { checkKycDocumentTypeMatch } from "@/features/kyc/utils/kycDocumentTypeMatch";
import { prefetchDeviceLocation } from "@/lib/utils/deviceInfo";
import { assessKycDocumentPhoto } from "@/features/kyc/utils/kycDocumentPhotoAssessment";
import { isTrustedOcrDocumentNumber } from "@/features/kyc/utils/kycOcrDocumentNumber";
import {
  getKycDocumentNumberFieldLabel,
  getKycDocumentNumberPlaceholder,
  getKycManualFallbackMessage,
  detectKycIdDocumentCountry,
  resolveKycEffectiveCountry,
} from "@/features/kyc/utils/kycOcrManualFallback";
import {
  getKycApprovedOverlayDismissed,
  isKycApproved,
  isKycRejected,
  isKycWaiting,
  kycStatusSnapshotKey,
  parseKycStatusSnapshotKey,
  resolveKycStatusOverlay,
  resolveKycUserId,
  setKycApprovedOverlayDismissed,
} from "@/features/kyc/utils/kycStatusOverlay";

const KYC_INPUT_CLASS =
  "w-full h-10 px-3 text-sm bg-white dark:bg-[var(--card-color)] border border-[#35353E] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#1D8751] dark:[color-scheme:dark]";
const KYC_READONLY_INPUT_CLASS =
  "w-full h-10 px-3 text-sm bg-white dark:bg-[var(--card-color)] border border-[#35353E] rounded-lg text-gray-700 dark:text-[#9EA7BE] focus:outline-none";

const KYCVerificationModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { kycModalOpen, loading, user, profile: userProfile, tokens, isAuthenticated, kycStatus } = useSelector((state: RootState) => state.auth);
  const prevKycStatusKeyRef = useRef<string | null>(null);
  const kycUserId = resolveKycUserId(user);
  const registeredCountry = userProfile?.country?.trim() || "";
  const [storedCountry, setStoredCountry] = useState<string>("");
  const defaultCountry = registeredCountry || storedCountry || "Somalia";
  
  const [error, setError] = useState<string | null>(null);
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [submittedOverlayDismissed, setSubmittedOverlayDismissed] = useState(false);
  const [approvedOverlayDismissed, setApprovedOverlayDismissed] = useState(false);
  const [showApprovedCelebration, setShowApprovedCelebration] = useState(false);
  const [isResubmittingKyc, setIsResubmittingKyc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Phone verification state
  const [otp, setOtp] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationData, setVerificationData] = useState({
    country: defaultCountry,
    documentType: '',
    documentNumber: '',
    email: user?.email || '',
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [documentFrontImage, setDocumentFrontImage] = useState<File | null>(null);
  const [documentBackImage, setDocumentBackImage] = useState<File | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceVideo, setFaceVideo] = useState<File | null>(null);
  const [faceDetectionData, setFaceDetectionData] = useState<any>(null);
  const [documentFrontPreview, setDocumentFrontPreview] = useState<string | null>(null);
  const [documentBackPreview, setDocumentBackPreview] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [kycSubmitMessage, setKycSubmitMessage] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, unknown>>({});
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrManualFallback, setOcrManualFallback] = useState(false);
  const [ocrTypeMismatchMessage, setOcrTypeMismatchMessage] = useState<string | null>(null);
  const [ocrForceReupload, setOcrForceReupload] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const documentFrontInputRef = useRef<HTMLInputElement>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const countryTriggerRef = useRef<HTMLDivElement>(null);
  const [countryDropdownRect, setCountryDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const normalizedKycStatus = String(kycStatus?.status || "")
    .trim()
    .toLowerCase();
  const isWaitingApproval =
    (normalizedKycStatus === "waiting_approval" ||
      normalizedKycStatus === "under_review" ||
      normalizedKycStatus === "under review") &&
    kycStatus?.is_verified === false;
  const isRejectedKyc =
    normalizedKycStatus === "rejected" && kycStatus?.is_verified === false;
  const rejectionReason =
    String(kycStatus?.rejection_reason || "").trim() ||
    String(kycStatus?.reason || "").trim();
  const rejectionMessage =
    String(kycStatus?.message || "").trim() ||
    "Your KYC was rejected. Please resubmit with correct documents.";
  const reviewMessageRaw = String(kycStatus?.message || "").trim();
  const sanitizedReviewMessage = reviewMessageRaw.replace(/^message:\s*/i, "").trim();
  const isGenericWaitingCopy = (msg: string) => {
    const m = msg.toLowerCase();
    return (
      !msg ||
      m === "unknown status." ||
      m === "unknown status" ||
      m === "your kyc is waiting approval." ||
      m === "your kyc is waiting approval" ||
      m === "verification waiting approval" ||
      (m.includes("waiting approval") && msg.length < 90) ||
      (m.includes("under review") && m.includes("please wait") && msg.length < 120)
    );
  };
  const reviewMessage =
    !sanitizedReviewMessage || isGenericWaitingCopy(sanitizedReviewMessage)
      ? normalizedKycStatus === "waiting_approval"
        ? "Your documents were received and are with our compliance team for review. You do not need to resubmit unless we contact you."
        : "Your documents are being reviewed. You do not need to resubmit unless we contact you."
      : sanitizedReviewMessage;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const profileRaw = localStorage.getItem("profile");
      const userRaw = localStorage.getItem("user");
      let country = "";

      if (profileRaw) {
        const parsedProfile = JSON.parse(profileRaw);
        country =
          parsedProfile?.profile?.country?.trim?.() ||
          parsedProfile?.user?.country?.trim?.() ||
          "";
      }

      if (!country && userRaw) {
        const parsedUser = JSON.parse(userRaw);
        country = parsedUser?.country?.trim?.() || "";
      }

      if (country) setStoredCountry(country);
    } catch {
      // Ignore malformed local storage and keep fallback country.
    }
  }, []);

  useEffect(() => {
    // Update identity fields when user changes
    setVerificationData((prev) => ({
      ...prev,
      email: user?.email || prev.email,
      firstName: user?.first_name || prev.firstName,
      lastName: user?.last_name || prev.lastName,
    }));
    const preferredCountry = registeredCountry || storedCountry;
    if (preferredCountry) {
      setVerificationData((prev) => {
        if (!prev.country || prev.country === "Somalia") {
          return { ...prev, country: preferredCountry };
        }
        return prev;
      });
    }
  }, [user?.email, user?.phone_number, registeredCountry, storedCountry]);

  // Restore approved-celebration dismiss flag across reloads / re-login (per user)
  useEffect(() => {
    if (kycUserId == null) return;
    setApprovedOverlayDismissed(getKycApprovedOverlayDismissed(kycUserId));
    setShowApprovedCelebration(false);
  }, [kycUserId]);

  // Close KYC modal when user is not logged in (e.g. on market page for guests)
  useEffect(() => {
    if (kycModalOpen && (!isAuthenticated || !user)) {
      dispatch(closeKYCModal());
    }
  }, [kycModalOpen, isAuthenticated, user, dispatch]);

  // Reset status snapshot on logout so the next login is not treated as a live status transition.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      prevKycStatusKeyRef.current = null;
      setShowApprovedCelebration(false);
    }
  }, [isAuthenticated, user]);

  // Check KYC status for OTP verification; close modal if user is already verified
  useEffect(() => {
    if (kycModalOpen && user) {
      dispatch(checkAuthKYCStatus()).then((result: any) => {
        if (result.payload) {
          const status = result.payload as any;
          if (status?.is_verified === true || status?.status === "approved") {
            localStorage.removeItem("kyc_verification_status");
            dispatch(closeKYCModal());
            return;
          }
          if (status.email_verified === true) {
            setPhoneVerified(true);
          }
        }
      });
    }
  }, [kycModalOpen, user, dispatch]);

  useEffect(() => {
    if (kycModalOpen) {
      prefetchDeviceLocation().catch(() => undefined);
    }
  }, [kycModalOpen]);

  const kycStatusOverlay = useMemo(() => {
    if (isResubmittingKyc) return null;
    const approvedDismissed =
      approvedOverlayDismissed ||
      (kycUserId != null && getKycApprovedOverlayDismissed(kycUserId));
    return resolveKycStatusOverlay(kycStatus, {
      showSubmittedPrompt: showSubmittedModal,
      dismissedSubmitted: submittedOverlayDismissed,
      dismissedApproved: approvedDismissed,
      showApprovedCelebration,
    });
  }, [
    kycStatus,
    showSubmittedModal,
    submittedOverlayDismissed,
    approvedOverlayDismissed,
    showApprovedCelebration,
    isResubmittingKyc,
    kycUserId,
  ]);

  const kycStatusMessage =
    String(kycStatus?.message || "").trim() ||
    kycSubmitMessage ||
    "Your verification documents were submitted successfully. Our team is reviewing them now.";

  const kycRejectionMessage =
    String(kycStatus?.rejection_reason || kycStatus?.reason || "").trim() ||
    String(kycStatus?.message || "").trim() ||
    rejectionMessage;

  // Toast + side effects when live KYC status changes (WebSocket / REST)
  useEffect(() => {
    if (!kycStatus || !isAuthenticated) return;

    const statusKey = kycStatusSnapshotKey(kycStatus);
    const previousKey = prevKycStatusKeyRef.current;
    if (previousKey === statusKey) return;

    const isInitialSync = previousKey === null;
    prevKycStatusKeyRef.current = statusKey;
    if (isInitialSync) return;

    if (kycStatus.email_verified === true) {
      setPhoneVerified(true);
    }

    if (isKycApproved(kycStatus)) {
      localStorage.removeItem("kyc_verification_status");
      setShowSubmittedModal(false);
      setShowManualVerification(false);
      dispatch(closeKYCModal());

      const previousSnapshot = parseKycStatusSnapshotKey(previousKey);
      const wasApprovedBefore = isKycApproved(previousSnapshot);
      const alreadyDismissed =
        kycUserId != null && getKycApprovedOverlayDismissed(kycUserId);

      // Only celebrate on a fresh approval — never on login/WS resync with existing approval.
      if (!wasApprovedBefore && !alreadyDismissed) {
        setSubmittedOverlayDismissed(false);
        setShowApprovedCelebration(true);
        showToast.success(
          "Account Verified",
          "Your account verification is complete"
        );
      }
      return;
    }

    if (isKycRejected(kycStatus)) {
      if (isResubmittingKyc) return;
      setIsResubmittingKyc(false);
      setSubmittedOverlayDismissed(false);
      setShowSubmittedModal(false);
      setShowManualVerification(false);
      setShowApprovedCelebration(false);
      if (kycUserId != null) {
        setKycApprovedOverlayDismissed(kycUserId, false);
        setApprovedOverlayDismissed(false);
      }
      dispatch(openKYCModal());
      showToast.error("KYC Rejected", kycRejectionMessage);
      return;
    }

    if (isKycWaiting(kycStatus)) {
      setSubmittedOverlayDismissed(false);
      setShowSubmittedModal(true);
      setShowManualVerification(false);
    }
  }, [
    kycStatus,
    isAuthenticated,
    dispatch,
    kycRejectionMessage,
    isResubmittingKyc,
    kycUserId,
  ]);

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
            dispatch(checkAuthKYCStatus()).then((result: any) => {
              const payload = result.payload as any;
              const isVerified = payload?.is_verified;
              const apiStatus = payload?.status;
              if (isVerified) {
                // Verified! Clear localStorage
                localStorage.removeItem('kyc_verification_status');
                dispatch(closeKYCModal());
              } else if (
                String(apiStatus || "").toLowerCase() === "waiting_approval" ||
                String(apiStatus || "").toLowerCase() === "under_review" ||
                String(apiStatus || "").toLowerCase() === "under review"
              ) {
                // Documents submitted, under review - show pending modal
                setShowSubmittedModal(true);
              }
              // If status is "pending" (user must complete/submit KYC), show main KYC form, NOT pending modal
            });
          }
        } catch (error) {
                  }
      }
    }
  }, [kycModalOpen, user?.user_id, dispatch]);

  const handleManualVerificationClick = async () => {
    setError(null);
    // Always reset image capture state when starting/resubmitting manual KYC.
    // This prevents stale "Face Verification Complete" status from previous attempts.
    setDocumentFrontImage(null);
    setDocumentBackImage(null);
    setFaceImage(null);
    setFaceVideo(null);
    setFaceDetectionData(null);
    setDocumentFrontPreview(null);
    setDocumentBackPreview(null);
    setFacePreview(null);
    setUserDetails({});
    setOcrLoading(false);
    setOcrProgress(0);
    setOcrStatus("");
    setOcrManualFallback(false);
    setOcrTypeMismatchMessage(null);
    setOcrForceReupload(null);
    
    // Check if email OTP is already verified
    if (
      phoneVerified ||
      kycStatus?.email_verified === true
    ) {
      // OTP already verified, start from step 1 (document info)
      setCurrentStep(1);
      setShowManualVerification(true);
      return;
    }
    
    // OTP not verified, start from step 0 (email verification)
    setCurrentStep(0);
    setShowManualVerification(true);
  };

  const handleSendOTP = async () => {
    setSendingOTP(true);
    setError(null);
    setOtpSuccessMessage(null);
    try {
      const result = await dispatch(sendPhoneOTP({})).unwrap();
      setOtpSent(true);
      setResendTimer(result?.cooldown_seconds ?? 60);
      setOtpSuccessMessage("OTP sent to your registered email address.");
    } catch (error: any) {
      const errorMsg = typeof error === "string" ? error : "Failed to send OTP. Please try again.";
      setError(errorMsg);
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
      if (result.email_verified) {
        setPhoneVerified(true);
        setOtpSuccessMessage(null);
        showToast.success("Success", "Email verified successfully");
        
        // Refresh KYC status
        await dispatch(checkAuthKYCStatus()).unwrap();
        
        // Move to next step (document info)
        setCurrentStep(1);
        setError(null);
      }
    } catch (error: any) {
      const errorMsg = typeof error === "string" ? error : "Invalid or expired OTP. Please try again.";
      setError(errorMsg);
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
    if (field === "documentNumber") {
      setUserDetails((prev) => ({
        ...prev,
        documentNumber: value,
        document_number: value,
      }));
    }
  };

  const handleOcrDetailChange = (key: keyof IdDocumentDetails, value: string) => {
    setUserDetails((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "fullName" && value.trim()) {
        const parts = value.trim().split(/\s+/);
        if (parts.length > 1) {
          next.surname = parts[parts.length - 1];
          next.givenNames = parts.slice(0, -1).join(" ");
        }
      }
      return next;
    });
    if (key === "documentNumber") {
      handleInputChange("documentNumber", value);
    }
  };

  const handleDocumentTypeChange = (value: string) => {
    handleInputChange("documentType", value);
    setUserDetails({});
    setOcrProgress(0);
    setOcrStatus("");
    setOcrManualFallback(false);
    setOcrTypeMismatchMessage(null);
    setOcrForceReupload(null);
    if (isPassportDocumentType(value)) {
      setDocumentBackImage(null);
      setDocumentBackPreview(null);
    }
  };

  const runDocumentOcr = async (file: File) => {
    setOcrLoading(true);
    setOcrProgress(0);
    setOcrStatus("Reading document...");
    setOcrManualFallback(false);
    setOcrTypeMismatchMessage(null);
    setOcrForceReupload(null);
    setError(null);
    try {
      const extracted = await runIdDocumentOcr(file, {
        onProgress: ({ status, progress }) => {
          setOcrStatus(status);
          setOcrProgress(progress);
        },
      });
      const {
        ocrLowConfidenceFields: ocrLowConfidenceFromExtract,
        ocrMrzUsed: ocrMrzUsedFromExtract,
        ...documentDetails
      } = extracted;
      const lowConfidenceFields = ocrLowConfidenceFromExtract ?? [];
      const mrzUsed = ocrMrzUsedFromExtract ?? false;
      const detectedCountry = detectKycIdDocumentCountry(extracted.rawText, {
        nationality: extracted.nationality,
      });
      const effectiveCountry =
        detectedCountry ?? verificationData.country;

      if (detectedCountry && detectedCountry !== verificationData.country) {
        handleInputChange("country", detectedCountry);
      }

      const typeMatch = checkKycDocumentTypeMatch(
        verificationData.documentType,
        extracted
      );
      const detailsPayload = buildKycUserDetails(documentDetails, {
        country: effectiveCountry,
        documentType: verificationData.documentType,
      });
      if (
        !isTrustedOcrDocumentNumber(
          verificationData.documentType,
          effectiveCountry,
          extracted.documentNumber ?? ""
        )
      ) {
        detailsPayload.documentNumber = "";
      }
      detailsPayload.detected_country = detectedCountry ?? "";
      detailsPayload.detected_document_kind = typeMatch.detected;
      detailsPayload.detected_document_confidence = typeMatch.confidence;
      detailsPayload.document_type_mismatch = typeMatch.mismatch;
      detailsPayload.ocr_low_confidence_fields = lowConfidenceFields;
      detailsPayload.ocr_mrz_used = mrzUsed;
      setUserDetails(detailsPayload);

      if (typeMatch.mismatch && typeMatch.message) {
        setOcrTypeMismatchMessage(typeMatch.message);
        setOcrManualFallback(true);
      } else {
        setOcrTypeMismatchMessage(null);
      }

      const trustedDocumentNumber = isTrustedOcrDocumentNumber(
        verificationData.documentType,
        effectiveCountry,
        extracted.documentNumber ?? ""
      )
        ? extracted.documentNumber.trim()
        : "";

      if (trustedDocumentNumber) {
        handleInputChange("documentNumber", trustedDocumentNumber);
        setOcrForceReupload(null);
        setOcrStatus("Done");
        if (
          isPassportDocumentType(verificationData.documentType) &&
          (lowConfidenceFields.length > 0 || !mrzUsed)
        ) {
          setOcrManualFallback(true);
        } else {
          setOcrManualFallback(false);
        }
      } else {
        const photoAssessment = assessKycDocumentPhoto(extracted);
        const enrichedDetails = {
          ...detailsPayload,
          likely_dummy_image:
            photoAssessment.likelyDummy && photoAssessment.confidence === "high",
          photo_assessment_confidence: photoAssessment.confidence,
        };
        setUserDetails(enrichedDetails);

        if (photoAssessment.likelyDummy && photoAssessment.confidence === "high") {
          setOcrForceReupload({
            title: "Not a valid ID photo",
            message:
              photoAssessment.message ??
              "We couldn't detect an ID in this image. Please upload a clear photo of your real document.",
          });
          setOcrManualFallback(false);
        } else {
          setOcrForceReupload(null);
          setOcrManualFallback(true);
        }
        handleInputChange("documentNumber", "");
        setOcrStatus("");
        setError(null);
      }
    } catch {
      setUserDetails(
        buildKycUserDetails(EMPTY_ID_DOCUMENT_DETAILS, {
          country: verificationData.country,
          documentType: verificationData.documentType,
        })
      );
      setOcrForceReupload(null);
      setOcrManualFallback(true);
      handleInputChange("documentNumber", "");
      setOcrStatus("");
      setError(null);
    } finally {
      setOcrLoading(false);
    }
  };

  const clearDocumentFront = () => {
    setDocumentFrontImage(null);
    setDocumentFrontPreview(null);
    setUserDetails({});
    handleInputChange("documentNumber", "");
    setOcrProgress(0);
    setOcrStatus("");
    setOcrManualFallback(false);
    setOcrTypeMismatchMessage(null);
    setOcrForceReupload(null);
    if (documentFrontInputRef.current) {
      documentFrontInputRef.current.value = "";
    }
  };

  const triggerDocumentFrontReupload = () => {
    documentFrontInputRef.current?.click();
  };

  const ocrManualEntryActive =
    ocrManualFallback && Boolean(documentFrontImage) && !ocrLoading && !ocrForceReupload;

  const ocrDisplayRows = useMemo(
    () =>
      getKycOcrDisplayRows(userDetails, {
        manualEntryMode: ocrManualEntryActive,
        selectedDocumentType: verificationData.documentType,
        lowConfidenceFields: Array.isArray(userDetails.ocr_low_confidence_fields)
          ? (userDetails.ocr_low_confidence_fields as string[])
          : [],
      }),
    [
      userDetails,
      ocrManualEntryActive,
      verificationData.documentType,
    ]
  );
  const ocrEffectiveCountry = useMemo(
    () =>
      resolveKycEffectiveCountry(verificationData.country, {
        rawText: String(userDetails.rawText ?? ""),
        nationality: String(userDetails.nationality ?? ""),
      }),
    [verificationData.country, userDetails.rawText, userDetails.nationality]
  );
  const ocrProgressPercent = Math.min(100, Math.round(ocrProgress * 100));

  const documentRequiresBack = requiresDocumentBackSide(verificationData.documentType);
  const isPassportDoc = isPassportDocumentType(verificationData.documentType);
  const selectedCountryEntry =
    countries.find((country) => country.name === verificationData.country) ??
    countries.find((country) => country.name === "Somalia")!;
  const filteredCountries = useMemo(
    () =>
      countries.filter(
        (country) =>
          country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
          country.code.toLowerCase().includes(countrySearchTerm.toLowerCase())
      ),
    [countrySearchTerm]
  );

  useEffect(() => {
    if (!showCountryDropdown || !countryTriggerRef.current) return;
    const updateRect = () => {
      const rect = countryTriggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCountryDropdownRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [showCountryDropdown]);

  useEffect(() => {
    if (!showCountryDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".kyc-country-dropdown-container") &&
        !target.closest(".kyc-country-dropdown-panel")
      ) {
        setShowCountryDropdown(false);
        setCountrySearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCountryDropdown]);

  const validateStep = (step: number) => {
    switch (step) {
      case 0:
        // Email verification step - OTP must be verified
        if (!phoneVerified) {
          setError("Please verify your email first");
          return false;
        }
        return true;
      case 1:
        if (!verificationData.country || !verificationData.documentType) {
          setError("Please select your country and document type");
          return false;
        }
        return true;
      case 2:
        if (!documentFrontImage) {
          const frontMsg = isPassportDoc
            ? "Please upload a clear photo of your passport"
            : "Please upload the front side of your document";
          setError(frontMsg);
          showToast.error(frontMsg);
          return false;
        }
        if (documentRequiresBack && !documentBackImage) {
          setError("Please upload the back side of your document");
          showToast.error("Please upload the back side of your document");
          return false;
        }
        if (ocrLoading) {
          setError("Please wait while we read your document");
          return false;
        }
        if (ocrForceReupload) {
          setError(ocrForceReupload.message ?? "Please upload a clear photo of your ID to continue");
          showToast.error(ocrForceReupload.title ?? "Invalid ID photo");
          return false;
        }
        if (!verificationData.documentNumber.trim()) {
          setError(
            ocrManualFallback
              ? "Enter your document number below to continue"
              : "Enter your document number to continue"
          );
          return false;
        }
        return true;
      case 3:
        if (!faceDetectionData || !faceDetectionData.faceDetected) {
          setError("Please complete face verification");
          showToast.error("Please complete face verification");
          return false;
        }
        // Require an actual selfie image file so resubmissions always include a face image.
        if (!(faceImage instanceof File)) {
          setError("Please capture your face image before submitting");
          showToast.error("Please capture your face image before submitting");
          return false;
        }
        const usedGalleryCapture = faceDetectionData?.captureSource === "gallery";
        if (!usedGalleryCapture && !(faceVideo instanceof File)) {
          setError("Please complete the short face verification video recording");
          showToast.error("Please complete the short face verification video recording");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleFaceDetectionComplete = async (data: any) => {
    setFaceDetectionData(data);
    setFaceVideo(data.capturedVideo instanceof File ? data.capturedVideo : null);
    
    // Convert base64 face image to File object - FaceDetectionKYC sends capturedImage (camera) or manual upload
    const base64Image = data.capturedImage || data.faceImage;
    if (base64Image) {
      try {
        const response = await fetch(base64Image);
        const blob = await response.blob();
        const file = new File([blob], "face-verification.jpg", {
          type: blob.type || "image/jpeg",
        });
        setFaceImage(file);
        setFacePreview(base64Image);
      } catch (error) {
                try {
          const byteString = atob(base64Image.split(",")[1] || "");
          const mime = base64Image.match(/data:([^;]+);/)?.[1] || "image/jpeg";
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          setFaceImage(new File([ab], "face-verification.jpg", { type: mime }));
        } catch {
          setFaceImage(null);
        }
        setFacePreview(base64Image);
      }
    }
    
    showToast.success(
      "Face Verified",
      data.captureSource === "gallery"
        ? "Your selfie photo was verified successfully"
        : data.capturedVideo
        ? "Your face photo and verification video were captured successfully"
        : "Your face has been successfully captured and verified"
    );
  };

  const handleDocumentFrontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
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
      setUserDetails({});
      setOcrManualFallback(false);
      setOcrTypeMismatchMessage(null);
      setOcrForceReupload(null);
      handleInputChange("documentNumber", "");
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentFrontPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
      await runDocumentOcr(file);
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
      // Face image is mandatory for manual_with_face_detection submissions.
      if (faceImage && faceImage instanceof File) {
        formData.append('kyc_images', faceImage, 'face-verification.jpg');
      } else {
        setError("Please capture your face image before submitting");
        showToast.error("Please capture your face image before submitting");
        return;
      }
      
      // Add face detection data
      if (faceDetectionData) {
        formData.append('face_data', JSON.stringify(faceDetectionData));
      }
      
      // Call the KYC verification API using the thunk
      // Only include images that are valid File objects
      const kycImages = isPassportDoc
        ? [documentFrontImage, faceImage].filter(
            (img): img is File => img instanceof File
          )
        : [documentFrontImage, documentBackImage, faceImage].filter(
            (img): img is File => img instanceof File
          );
      const requiredImageCount = isPassportDoc ? 2 : 3;
      if (kycImages.length < requiredImageCount) {
        const missingMsg = isPassportDoc
          ? "Please provide your passport photo and face verification image"
          : "Please provide all required images: front, back, and face";
        setError(missingMsg);
        showToast.error(missingMsg);
        return;
      }
      
     
      const resolvedUserDetails: Record<string, unknown> = {
        ...(Object.keys(userDetails).length > 0
          ? userDetails
          : buildKycUserDetails(EMPTY_ID_DOCUMENT_DETAILS, {
              country: verificationData.country,
              documentType: verificationData.documentType,
            })),
        documentNumber: verificationData.documentNumber,
        document_number: verificationData.documentNumber,
        country: verificationData.country,
        selected_document_type: verificationData.documentType,
        manual_entry: ocrManualFallback || !getKycOcrDisplayRows(userDetails).length,
        document_type_mismatch: Boolean(ocrTypeMismatchMessage),
        likely_dummy_image: Boolean(userDetails.likely_dummy_image),
      };

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
        face_video: faceVideo instanceof File ? faceVideo : undefined,
        country: verificationData.country,
        document_type: verificationData.documentType,
        document_number: verificationData.documentNumber,
        user_details: resolvedUserDetails,
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
      setIsResubmittingKyc(false);
      setSubmittedOverlayDismissed(false);
      setShowSubmittedModal(true);
      dispatch(closeKYCModal());

      // Refetch KYC status after successful verification
      dispatch(checkAuthKYCStatus(true));
    } catch (error) {
            const raw =
        typeof error === "string"
          ? error
          : "An error occurred during verification submission";
      const isTimeout = /timeout|timed out/i.test(raw);
      const errorMessage = isTimeout
        ? "Upload timed out. Your face verification is still saved — please check your connection and tap Submit Verification again."
        : raw;
      setError(errorMessage);
      showToast.error(
        isTimeout ? "Upload timed out" : "Verification Error",
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reloadAppOnDashboard = () => {
    setShowSubmittedModal(false);
    dispatch(closeKYCModal());
    window.location.href = "/dashboard";
  };

  const dismissApprovedOverlay = () => {
    if (kycUserId != null) {
      setKycApprovedOverlayDismissed(kycUserId, true);
    }
    setApprovedOverlayDismissed(true);
    setShowApprovedCelebration(false);
  };

  const handleContinueToDashboard = () => {
    if (isKycApproved(kycStatus)) {
      localStorage.removeItem("kyc_verification_status");
      dismissApprovedOverlay();
    } else {
      setSubmittedOverlayDismissed(true);
    }
    reloadAppOnDashboard();
  };

  const handleCloseApprovedOverlay = () => {
    if (isKycApproved(kycStatus)) {
      dismissApprovedOverlay();
    } else {
      setSubmittedOverlayDismissed(true);
    }
    setShowSubmittedModal(false);
    dispatch(closeKYCModal());
  };

  const handleResubmitAfterRejection = async () => {
    setIsResubmittingKyc(true);
    setSubmittedOverlayDismissed(true);
    setShowSubmittedModal(false);
    await handleManualVerificationClick();
    dispatch(openKYCModal());
  };

  const handleCheckStatusClick = async () => {
    setIsSubmitting(true);
    try {
      const kycResult = await dispatch(checkAuthKYCStatus(true));
      const latestStatus = (kycResult.payload as any) || kycStatus;
      if (latestStatus?.is_verified) {
        localStorage.removeItem("kyc_verification_status");
        const alreadyDismissed =
          kycUserId != null && getKycApprovedOverlayDismissed(kycUserId);
        if (!alreadyDismissed) {
          setShowApprovedCelebration(true);
          showToast.success(
            "Account Verified",
            "Your account verification is complete"
          );
        }
        setShowSubmittedModal(false);
        setSubmittedOverlayDismissed(true);
        dispatch(closeKYCModal());
      } else {
        setSubmittedOverlayDismissed(false);
        setShowSubmittedModal(true);
      }
    } catch (error) {
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
    setIsResubmittingKyc(false);
    setError(null);
    setShowSubmittedModal(false);
    setSubmittedOverlayDismissed(false);
    setCurrentStep(phoneVerified ? 1 : 0);
    setDocumentFrontImage(null);
    setDocumentBackImage(null);
    setFaceImage(null);
    setFaceVideo(null);
    setFaceDetectionData(null);
    setDocumentFrontPreview(null);
    setDocumentBackPreview(null);
    setFacePreview(null);
    setUserDetails({});
    setOcrLoading(false);
    setOcrProgress(0);
    setOcrStatus("");
    setOcrManualFallback(false);
    setOcrTypeMismatchMessage(null);
    setOcrForceReupload(null);
    setOtp("");
    setOtpSent(false);
    setOtpSuccessMessage(null);
    setResendTimer(0);
    setShowCountryDropdown(false);
    setCountrySearchTerm("");
    setVerificationData({
      country: defaultCountry,
      documentType: '',
      documentNumber: '',
      email: user?.email || '',
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
    });
  };

  // Do not show KYC modal when user is not logged in
  if (!isAuthenticated || !user) return null;

  const showStatusOverlay = kycStatusOverlay !== null;
  const showManualForm =
    kycModalOpen && showManualVerification && !kycStatusOverlay;
  const showMainKycPrompt =
    kycModalOpen && !showManualVerification && !kycStatusOverlay;
  const hasVisibleContent =
    showStatusOverlay || showManualForm || showMainKycPrompt;
  if (!hasVisibleContent) return null;

  const stepperItems = [
    { key: "email", label: "Email" },
    { key: "document", label: "ID Document" },
    { key: "face", label: "Face Verify" },
    { key: "submit", label: "Submit" },
  ] as const;
  const activeStepperIndex =
    !phoneVerified && currentStep === 0 ? 0 : currentStep >= 3 ? 3 : 1;
  const isCompactKycStep = currentStep <= 1;
  const kycModalShellClass = [
    "bg-white dark:bg-[var(--card-color)] rounded-[24px] p-0 max-w-4xl w-full mx-4 border border-[#35353E] overflow-y-auto shadow-xl transition-[max-height] duration-200",
    isCompactKycStep ? "" : "min-h-[75vh]",
    showCountryDropdown
      ? "max-h-[98vh]"
      : isCompactKycStep
        ? "max-h-[90vh]"
        : "max-h-[94vh]",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      
      {/* Single status overlay — content follows live kycStatus (WebSocket / REST) */}
      {kycStatusOverlay && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-[#35353E] shadow-xl">
          <div className="flex flex-col items-center justify-center text-center">
            {kycStatusOverlay === "approved" && (
              <>
                <div className="w-16 h-16 bg-[#1D8751]/15 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#1D8751]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Account Verified!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                  {kycStatusMessage ||
                    "Your KYC has been approved. You now have full access to the platform."}
                </p>
                <button
                  onClick={handleContinueToDashboard}
                  className="bg-[#1D8751] hover:bg-[#167a47] text-white w-full h-10 rounded-lg transition-colors duration-200"
                >
                  Continue to Dashboard
                </button>
              </>
            )}

            {kycStatusOverlay === "rejected" && (
              <>
                <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Verification Rejected
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                  {kycRejectionMessage}
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleResubmitAfterRejection}
                    className="flex-1 bg-[#1D8751] hover:bg-[#167a47] text-white h-10 rounded-lg transition-colors duration-200"
                  >
                    Resubmit KYC
                  </button>
                  <button
                    onClick={handleCloseApprovedOverlay}
                    className="flex-1 border border-[#35353E] text-gray-700 dark:text-gray-300 h-10 rounded-lg transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {kycStatusOverlay === "submitted" && (
              <>
                <div className="w-16 h-16 bg-[#1D8751]/15 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#1D8751]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Verification Submitted!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {kycStatusMessage}
                </p>
                <div className="bg-[#1D8751]/10 dark:bg-[#1D8751]/15 border border-[#1D8751]/30 dark:border-[#1D8751]/40 rounded-lg p-4 mb-6 w-full text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Typical processing time
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Most reviews are completed within{" "}
                    <span className="font-semibold text-[#1D8751]">1–3 business days</span>. During peak
                    periods it may take a little longer. We will email you as soon as there is an update.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleCloseApprovedOverlay}
                    className="flex-1 border border-[#35353E] text-gray-700 dark:text-gray-300 h-10 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-[#35353E]"
                  >
                    Cancel
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Step-by-Step Verification Form */}
      {kycModalOpen && showManualVerification && !kycStatusOverlay && (
        <div className={kycModalShellClass}>
          <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-3 border-b border-[#35353E]">
            <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              KYC Verification
            </h2>
            <button
              onClick={handleClose}
              className="text-[#8C94B2] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            </div>
            <p className="text-xs sm:text-sm text-[#6F7893] dark:text-[#8C94B2] mb-3">Secure your account with identity verification</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 items-start">
              {stepperItems.map((step, idx) => {
                const isActive = idx <= activeStepperIndex;
                return (
                  <div key={step.key} className="relative flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${isActive ? "border-[#1D8751] text-[#1D8751]" : "border-[#35353E] text-[#94A3B8] dark:text-[#6F7893]"}`}>
                      <span className="text-xs font-semibold">{idx + 1}</span>
                    </div>
                    <span className={`text-[11px] sm:text-xs ${isActive ? "text-[#1D8751]" : "text-[#64748B] dark:text-[#6F7893]"}`}>{step.label}</span>
                    {idx < stepperItems.length - 1 && (
                      <span className="hidden sm:block absolute top-4 left-[calc(50%+1.15rem)] w-[calc(100%-2.3rem)] h-px bg-[#35353E]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="px-4 sm:px-6 py-4">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 p-2 rounded-lg mb-3 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Email Verification */}
          {currentStep === 0 && !phoneVerified && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-[#123526] rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-7 h-7 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">Email Verification</h3>
                <p className="text-[#6F7893] dark:text-[#8C94B2] text-xs sm:text-sm">Enter your email address to receive a verification code</p>
              </div>

              {!otpSent && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">First Name*</label>
                      <input
                        type="text"
                        value={verificationData.firstName}
                        readOnly
                        className={KYC_READONLY_INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Last Name*</label>
                      <input
                        type="text"
                        value={verificationData.lastName}
                        readOnly
                        className={KYC_READONLY_INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">Email Address*</label>
                    <input
                      type="email"
                      value={verificationData.email || user?.email || ""}
                      readOnly
                      className={KYC_READONLY_INPUT_CLASS}
                    />
                  </div>
                </>
              )}

              {/* OTP Input */}
              {otpSent && !phoneVerified && (
                <div className="space-y-3">
                  {otpSuccessMessage && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 text-green-700 dark:text-green-400 p-3 rounded-lg flex items-start gap-2">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">OTP Sent</p>
                        <p className="text-xs text-green-600 dark:text-green-300 mt-0.5">
                          {otpSuccessMessage}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">Enter OTP *</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className={`${KYC_READONLY_INPUT_CLASS} text-center tracking-widest`}
                      disabled={verifyingOTP}
                    />
                  </div>
                  
                  {/* Resend OTP */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-xs text-[#8C94B2]">
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
                    <p className="font-semibold mb-1 text-sm">Email Verified!</p>
                    <p className="text-xs text-green-500 dark:text-green-300">
                      Your email has been successfully verified.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Country & document type */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country *</label>
                   <div ref={countryTriggerRef} className="relative kyc-country-dropdown-container">
                     <button
                       type="button"
                       onClick={() => setShowCountryDropdown((open) => !open)}
                       className={`${KYC_INPUT_CLASS} flex items-center justify-between gap-2`}
                     >
                       <span className="flex items-center gap-2 min-w-0">
                         <img
                           src={`https://flagcdn.com/16x12/${selectedCountryEntry.code.toLowerCase()}.png`}
                           alt=""
                           className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                           onError={(event) => {
                             event.currentTarget.style.display = "none";
                           }}
                         />
                         <span className="truncate">{selectedCountryEntry.name}</span>
                       </span>
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-gray-500">
                         <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                       </svg>
                     </button>
                     {showCountryDropdown &&
                       typeof document !== "undefined" &&
                       createPortal(
                         <div
                           className="kyc-country-dropdown-panel fixed z-[10000] overflow-hidden bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border border-[#35353E] rounded-lg shadow-xl"
                           style={{
                             top: countryDropdownRect.top,
                             left: countryDropdownRect.left,
                             width: countryDropdownRect.width,
                           }}
                         >
                           <div className="p-2 border-b border-[#35353E]">
                             <input
                               type="text"
                               placeholder="Search countries..."
                               value={countrySearchTerm}
                               onChange={(event) => setCountrySearchTerm(event.target.value)}
                               className={KYC_INPUT_CLASS}
                               autoFocus
                             />
                           </div>
                           <div className="max-h-80 overflow-y-auto">
                             {filteredCountries.length > 0 ? (
                               filteredCountries.map((country) => (
                                 <button
                                   key={country.code}
                                   type="button"
                                   onClick={() => {
                                     handleInputChange("country", country.name);
                                     setShowCountryDropdown(false);
                                     setCountrySearchTerm("");
                                   }}
                                   className={`w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-[#1D8751]/10 text-gray-900 dark:text-white border-b border-[#35353E]/40 last:border-b-0 ${
                                     country.name === verificationData.country ? "bg-[#1D8751]/10" : ""
                                   }`}
                                 >
                                   <img
                                     src={`https://flagcdn.com/16x12/${country.code.toLowerCase()}.png`}
                                     alt=""
                                     className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                                     onError={(event) => {
                                       event.currentTarget.style.display = "none";
                                     }}
                                   />
                                   <span className="text-sm truncate">{country.name}</span>
                                 </button>
                               ))
                             ) : (
                               <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-[#788099]">
                                 No countries found
                               </div>
                             )}
                           </div>
                         </div>,
                         document.body
                       )}
                   </div>
                 </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Document Type *</label>
                  <select
                    value={verificationData.documentType}
                    onChange={(e) => handleDocumentTypeChange(e.target.value)}
                    className={KYC_INPUT_CLASS}
                  >
                    <option value="">Select document type</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload + OCR */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPassportDoc
                  ? "Upload a clear photo of your passport — we will read the details automatically."
                  : "Upload clear photos of your document — we will read the details from the front."}
              </p>

              <div className={`grid gap-3 ${documentRequiresBack ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`}>
              <div>
                <h4 className="text-gray-900 dark:text-white text-sm font-medium mb-2 flex items-center gap-1">
                  <span className="bg-[#1D8751] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                  {isPassportDoc ? "Passport Photo Page *" : "Front Side *"}
                </h4>
                <div className="border-2 border-dashed border-[#35353E] rounded-lg p-3 text-center">
                  <input
                    ref={documentFrontInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDocumentFrontUpload}
                    className="hidden"
                    id="document-front-upload"
                  />
                  {documentFrontImage && documentFrontPreview ? (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <img
                          src={documentFrontPreview}
                          alt="Document front preview"
                          className="max-w-full max-h-32 rounded-lg border border-[#35353E]"
                        />
                        <button
                          type="button"
                          onClick={clearDocumentFront}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <p className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Uploaded</p>
                        <button
                          type="button"
                          onClick={triggerDocumentFrontReupload}
                          className="cursor-pointer text-xs text-[#1D8751] hover:underline font-medium"
                        >
                          Re-upload photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
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

              {documentRequiresBack && (
              <div>
                <h4 className="text-gray-900 dark:text-white text-sm font-medium mb-2 flex items-center gap-1">
                  <span className="bg-[#1D8751] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  Back Side *
                </h4>
                <div className="border-2 border-dashed border-[#35353E] rounded-lg p-3 text-center">
                  {documentBackImage && documentBackPreview ? (
                   <div className="space-y-2">
                     <div className="relative inline-block">
                       <img
                          src={documentBackPreview}
                          alt="Document back preview"
                          className="max-w-full max-h-32 rounded-lg border border-[#35353E]"
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
              )}

              </div>

              {ocrLoading && (
                <div className="space-y-2 rounded-lg border border-[#35353E] p-3">
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-[#35353E] overflow-hidden">
                    <div
                      className="h-full bg-[#1D8751] transition-all duration-200"
                      style={{ width: `${ocrProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {ocrStatus}
                    {ocrProgressPercent > 0 ? ` (${ocrProgressPercent}%)` : ""}
                  </p>
                </div>
              )}

              {ocrManualFallback && documentFrontImage && !ocrLoading && !ocrForceReupload && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-950 dark:text-amber-100">
                  <p className="font-semibold mb-1">Couldn&apos;t read all details automatically</p>
                  <p>
                    {getKycManualFallbackMessage(
                      ocrEffectiveCountry,
                      verificationData.documentType,
                      Array.isArray(userDetails.ocr_low_confidence_fields)
                        ? (userDetails.ocr_low_confidence_fields as string[])
                        : undefined
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={triggerDocumentFrontReupload}
                    className="inline-block mt-2 text-[#1D8751] font-semibold underline cursor-pointer"
                  >
                    Upload a clearer photo
                  </button>
                </div>
              )}

              {ocrForceReupload && documentFrontImage && !ocrLoading && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-900 dark:text-red-200">
                  <p className="font-semibold mb-1">{ocrForceReupload.title}</p>
                  <p>{ocrForceReupload.message}</p>
                  <button
                    type="button"
                    onClick={triggerDocumentFrontReupload}
                    className="inline-block mt-2 text-[#1D8751] font-semibold underline cursor-pointer"
                  >
                    Upload a clearer photo
                  </button>
                </div>
              )}

              {ocrTypeMismatchMessage && documentFrontImage && !ocrLoading && !ocrForceReupload && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-950 dark:text-amber-100">
                  <p className="font-semibold mb-1">Document type check</p>
                  <p>{ocrTypeMismatchMessage}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setOcrTypeMismatchMessage(null)}
                      className="text-[#1D8751] font-semibold underline cursor-pointer"
                    >
                      Continue with my selection
                    </button>
                    <button
                      type="button"
                      onClick={triggerDocumentFrontReupload}
                      className="text-gray-600 dark:text-gray-300 font-semibold underline cursor-pointer"
                    >
                      Upload a different photo
                    </button>
                  </div>
                </div>
              )}

              {(ocrDisplayRows.length > 0 || ocrManualEntryActive) && !ocrLoading && !ocrForceReupload && (
                <div className="rounded-lg border border-[#35353E] overflow-hidden">
                  <div className="px-3 py-2 bg-[#1D8751]/10 border-b border-[#35353E]">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Document details
                    </p>
                    {ocrManualEntryActive && (
                      <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5">
                        Fill in all fields below manually — only verified values are pre-filled.
                      </p>
                    )}
                  </div>
                  <div className="divide-y divide-[#35353E]/60">
                    {ocrDisplayRows.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-start justify-between gap-3 px-3 py-2 text-xs sm:text-sm"
                      >
                        <span className="text-gray-500 dark:text-gray-400 shrink-0 pt-2">
                          {row.label}
                        </span>
                        {KYC_OCR_READONLY_FIELDS.has(row.key) ? (
                          <span className="text-gray-900 dark:text-white text-right break-all font-medium pt-2">
                            {row.value}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={String(
                              row.key === "documentNumber"
                                ? verificationData.documentNumber ||
                                  userDetails[row.key] ||
                                  row.value
                                : userDetails[row.key] ?? row.value
                            )}
                            onChange={(e) =>
                              handleOcrDetailChange(row.key, e.target.value)
                            }
                            placeholder={row.placeholder}
                            className={`${KYC_INPUT_CLASS} text-right max-w-[65%] min-w-[120px] py-1.5 text-xs sm:text-sm${
                              row.needsManualEntry
                                ? " border-amber-400/60 dark:border-amber-500/40"
                                : ""
                            }`}
                            aria-label={row.label}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {documentFrontImage && !ocrManualEntryActive && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {getKycDocumentNumberFieldLabel(
                      ocrEffectiveCountry,
                      verificationData.documentType
                    )}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    value={verificationData.documentNumber}
                    onChange={(e) => handleInputChange("documentNumber", e.target.value)}
                    className={KYC_INPUT_CLASS}
                    placeholder={
                      ocrLoading
                        ? "Reading document..."
                        : ocrTypeMismatchMessage
                          ? "Re-upload recommended — or enter number if you are sure"
                          : getKycDocumentNumberPlaceholder(
                              ocrEffectiveCountry,
                              verificationData.documentType,
                              ocrManualFallback
                            )
                    }
                    disabled={ocrLoading}
                  />
                  {ocrManualFallback && !ocrLoading && !ocrForceReupload && (
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Required when details could not be read automatically from your ID.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

           {/* Step 3: Face Verification with AI Detection */}
           {currentStep === 3 && (
             <div className="space-y-3 rounded-2xl border border-[#35353E] bg-[#F8FAFC] dark:bg-[var(--card-color)] p-4">
               <FaceDetectionKYC
                 onVerificationComplete={handleFaceDetectionComplete}
                onRetake={() => {
                  setFaceImage(null);
                  setFaceVideo(null);
                  setFacePreview(null);
                  setFaceDetectionData(null);
                }}
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
                       Your face photo and short verification video were captured successfully.
                     </p>
                   </div>
                 </div>
               )}
             </div>
           )}

          {currentStep === 3 && (
            <div className="my-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-[#35353E]" />
              <span className="text-[11px] text-[#6F7893]">Verify -&gt; Submit</span>
              <span className="h-px flex-1 bg-[#35353E]" />
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep === 0 && !phoneVerified && otpSuccessMessage && (
            <p className="text-xs text-green-600 dark:text-green-400 text-center mb-2">
              {otpSuccessMessage}
            </p>
          )}
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
              // Email verification step buttons
              <div className="flex gap-2 w-full">
                {!otpSent ? (
                  <button
                    onClick={handleSendOTP}
                    disabled={sendingOTP}
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
                    <span>Uploading documents…</span>
                  </>
                ) : (
                  "Submit Verification"
                )}
              </button>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Main KYC Modal */}
      {kycModalOpen && !showManualVerification && !kycStatusOverlay && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4 border border-[#35353E] shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isRejectedKyc
                ? "Verification Rejected"
                : isWaitingApproval
                ? normalizedKycStatus === "waiting_approval"
                  ? "Verification Waiting Approval"
                  : "Verification Under Review"
                : "Identity Verification Required"}
            </h2>
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
              {isWaitingApproval ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300">{reviewMessage}</p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-400 dark:border-green-500 text-green-800 dark:text-green-200 p-3 rounded-lg text-sm space-y-1">
                    <p className="font-semibold">Typical processing time</p>
                    <p>
                      Most verifications finish within <span className="font-semibold">1–3 business days</span>.
                      Busy periods can extend this slightly. We will email you as soon as a decision is ready—you do not need to take further action unless we ask.
                    </p>
                  </div>
                </>
              ) : isRejectedKyc ? (
                <>
                  <p>
                    Your identity verification was rejected. Please review the details below and resubmit your documents.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    If you need help, contact support and include your rejection reason.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Please verify your identity by providing your personal information and
                    document details for manual verification.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This process helps us ensure the security of your account and comply
                    with regulatory requirements.
                  </p>
                </>
              )}

            {isRejectedKyc && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm space-y-2">
                <p className="font-semibold">KYC rejected</p>
                <p>{rejectionMessage}</p>
                {rejectionReason && (
                  <p>
                    <span className="font-semibold">Reason:</span> {rejectionReason}
                  </p>
                )}
              </div>
            )}
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between mb-3 items-center w-full mt-6">
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
                    isWaitingApproval
                      ? "Check Status"
                      : isRejectedKyc
                      ? "Resubmit Verification"
                      : "Start Manual Verification"
                  )}
                </button>
              </div>
              {isRejectedKyc && (
                <div className="flex justify-between mb-6 items-center w-full">
                  <button
                    className="border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751]/10 w-full h-10 rounded-lg transition-colors duration-200"
                    onClick={() => router.push("/contactUs")}
                  >
                    Contact Support
                  </button>
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerificationModal; 