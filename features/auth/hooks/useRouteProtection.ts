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

  // Check verification status (with timeout so slow API doesn't block the whole app)
  useEffect(() => {
    const ROUTE_PROTECTION_TIMEOUT_MS = 12_000; // 12s – don’t block UI indefinitely
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkVerification = async () => {
      if (!isAuthenticated) {
        setIsChecking(false);
        return;
      }

      timeoutId = setTimeout(() => {
        timeoutId = null;
        setIsChecking(false);
        // Allow through on timeout so user can at least use the app; KYC can be rechecked in background
        setIsVerified(undefined);
      }, ROUTE_PROTECTION_TIMEOUT_MS);

      try {
        const result = await dispatch(checkKYCStatus()).unwrap();
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
        const kycStatus = result as any;

        const verified =
          kycStatus?.is_verified === true ||
          (kycState.isVerified !== undefined ? kycState.isVerified : user?.is_verified === true);

        setIsVerified(verified);

        if (verified === false) {
          router.push("/dashboard");
          dispatch(openKYCModal());
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
        const verified =
          kycState.isVerified !== undefined
            ? kycState.isVerified
            : (user?.is_verified ?? false);

        setIsVerified(verified);

        if (verified === false) {
          router.push("/dashboard");
          dispatch(openKYCModal());
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        setIsChecking(false);
      }
    };

    checkVerification();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, dispatch, router, kycState.isVerified, user?.is_verified]);

  return {
    isVerified,
    isChecking,
    isAuthenticated,
  };
};


