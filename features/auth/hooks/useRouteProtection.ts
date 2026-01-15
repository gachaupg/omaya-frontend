"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { checkKYCStatus, openKYCModal } from "@/features/auth/slices/authSlice";

/**
 * Hook to protect routes for unverified users
 * Redirects to dashboard and shows KYC modal if user is not verified
 */
export const useRouteProtection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const kycState = useSelector((state: RootState) => state.kyc);
  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (!isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        // Check KYC status from API
        const result = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = result as any;
        
        // Determine verification status
        const verified = kycStatus?.is_verified === true || 
                        (kycState.isVerified !== undefined ? kycState.isVerified : user?.is_verified === true);
        
        setIsVerified(verified);
        
        // If user is not verified, redirect and show modal
        if (verified === false) {
          router.push("/dashboard");
          dispatch(openKYCModal());
        }
      } catch (error) {
        // Fallback to user data if API check fails
        const verified = kycState.isVerified !== undefined 
          ? kycState.isVerified 
          : (user?.is_verified ?? false);
        
        setIsVerified(verified);
        
        if (verified === false) {
          router.push("/dashboard");
          dispatch(openKYCModal());
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkVerification();
  }, [isAuthenticated, dispatch, router, kycState.isVerified, user?.is_verified]);

  return {
    isVerified,
    isChecking,
    isAuthenticated,
  };
};


