import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { checkKYCStatus } from "../slices/authSlice";

// TEMPORARY: KYC BYPASS FOR TESTING - REMOVE IN PRODUCTION
const KYC_BYPASS_ENABLED = true;

export const useKYCVerification = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, kycModalOpen } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // TEMPORARY: Skip KYC verification for testing
    if (KYC_BYPASS_ENABLED) {
      return;
    }

    // Check KYC status when user is authenticated and we have user data
    if (isAuthenticated && user && !kycModalOpen) {
      dispatch(checkKYCStatus());
    }
  }, [dispatch, isAuthenticated, user, kycModalOpen]);

  return {
    // TEMPORARY: Always return verified for testing
    isVerified: KYC_BYPASS_ENABLED ? true : user?.is_verified ?? false,
    kycModalOpen: KYC_BYPASS_ENABLED ? false : kycModalOpen,
  };
};
