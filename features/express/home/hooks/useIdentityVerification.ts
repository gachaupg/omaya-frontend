"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { checkKYCStatus } from "@/features/auth/slices/authSlice";

interface KYCStatusResponse {
  is_verified: boolean;
  status?: string;
  phone_number?: string | null;
  phone_verified?: boolean;
}

export const useIdentityVerification = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is verified - prioritize KYC status from API, then user data
  const isVerified = kycStatus
    ? kycStatus.is_verified === true
    : user
    ? user.is_verified === true
    : undefined; // undefined means we haven't checked yet

  // Fetch KYC status
  const fetchKYCStatus = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const result = await dispatch(checkKYCStatus()).unwrap();
      const status = result as KYCStatusResponse;
      setKycStatus(status);
      
      // Close modal if user is verified
      if (status.is_verified === true) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, isAuthenticated]);

  // Check verification status on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchKYCStatus();
    }
  }, [isAuthenticated, fetchKYCStatus]);

  // Auto-open modal ONLY if user is explicitly unverified (not undefined/null)
  // Wait for loading to complete and status to be checked
  useEffect(() => {
    // Only auto-open if:
    // 1. User is authenticated
    // 2. Not currently loading
    // 3. We have a definitive status (not undefined)
    // 4. User is explicitly not verified (is_verified === false)
    if (
      isAuthenticated &&
      !loading &&
      isVerified !== undefined &&
      isVerified === false
    ) {
      setIsModalOpen(true);
    } else if (isVerified === true) {
      // Explicitly close modal if user is verified
      setIsModalOpen(false);
    }
  }, [isAuthenticated, loading, isVerified]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    if (isAuthenticated) {
      fetchKYCStatus();
    }
  }, [isAuthenticated, fetchKYCStatus]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isModalOpen,
    isVerified,
    kycStatus,
    loading,
    openModal,
    closeModal,
    refreshStatus: fetchKYCStatus,
  };
};

