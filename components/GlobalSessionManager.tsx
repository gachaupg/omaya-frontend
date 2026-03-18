"use client";

import { useEffect } from "react";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { initializeAuth } from "../features/auth/slices/authSlice";
import { useGlobalSessionCreation } from "../hooks/useGlobalSessionCreation";
import TwoFAModal from "../features/auth/components/2fa";
import GoogleOAuthDebug from "../features/auth/components/GoogleOAuthDebug";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { useUserPaymentDetailsWebSocket } from "@/features/p2p/hooks/useUserPaymentDetailsWebSocket";
import { useP2PWithdrawalStatusWebSocket } from "@/features/p2p/hooks/useP2PWithdrawalStatusWebSocket";
const GlobalSessionManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useTokenRefresh();
  useUserPaymentDetailsWebSocket({ enabled: isAuthenticated });
  useP2PWithdrawalStatusWebSocket();

  // Initialize authentication state from localStorage only once on mount
  // Use a ref to ensure we only run once, and skip if already authenticated
  const hasInitialized = React.useRef(false);
  useEffect(() => {
    // Only initialize once, and only if not already authenticated
    if (!hasInitialized.current && !isAuthenticated) {
      hasInitialized.current = true;
      // Small delay to ensure login state is persisted before checking
      const timer = setTimeout(() => {
        dispatch(initializeAuth());
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dispatch, isAuthenticated]);
  
  // This component doesn't render anything, it just manages global session creation
  useGlobalSessionCreation();
  
  return (
    <>
      {/* 2FA Modal - available globally */}
      <TwoFAModal />
    </>
  );
};

export default GlobalSessionManager;
