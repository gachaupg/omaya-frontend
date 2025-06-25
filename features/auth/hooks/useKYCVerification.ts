import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { checkKYCStatus } from "../slices/authSlice";

export const useKYCVerification = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, kycModalOpen } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Check KYC status when user is authenticated and we have user data
    if (isAuthenticated && user && !kycModalOpen) {
      dispatch(checkKYCStatus());
    }
  }, [dispatch, isAuthenticated, user, kycModalOpen]);

  return {
    isVerified: user?.is_verified ?? false,
    kycModalOpen,
  };
}; 