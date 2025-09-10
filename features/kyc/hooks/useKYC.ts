/**
 * useKYC.ts – KYC hooks for easy state management
 */
import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";
import {
  checkKYCStatus,
  verifyKYCStatus,
  initiateKYCVerification,
  getSumSubToken,
  clearError,
  setKYCStatus,
  resetKYCState,
} from "../slices/kycSlice";
import {
  KYCVerificationPayload,
  SumSubInitiatePayload,
  SumSubTokenPayload,
} from "../types";

export const useKYC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const kycState = useSelector((state: RootState) => state.kyc);

  const checkStatus = useCallback(() => {
    return dispatch(checkKYCStatus());
  }, [dispatch]);

  const verifyStatus = useCallback((payload: KYCVerificationPayload) => {
    return dispatch(verifyKYCStatus(payload));
  }, [dispatch]);

  const initiateVerification = useCallback((payload: SumSubInitiatePayload) => {
    return dispatch(initiateKYCVerification(payload));
  }, [dispatch]);

  const getToken = useCallback((payload: SumSubTokenPayload) => {
    return dispatch(getSumSubToken(payload));
  }, [dispatch]);

  const clearKYCError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const updateKYCStatus = useCallback((isVerified: boolean) => {
    dispatch(setKYCStatus(isVerified));
  }, [dispatch]);

  const resetKYC = useCallback(() => {
    dispatch(resetKYCState());
  }, [dispatch]);

  return {
    // State
    isVerified: kycState.isVerified,
    loading: kycState.loading,
    error: kycState.error,
    lastChecked: kycState.lastChecked,
    
    // Actions
    checkStatus,
    verifyStatus,
    initiateVerification,
    getToken,
    clearKYCError,
    updateKYCStatus,
    resetKYC,
  };
};

export const useKYCStatus = () => {
  const { isVerified, loading, error, lastChecked } = useKYC();
  
  return {
    isVerified,
    loading,
    error,
    lastChecked,
  };
};
