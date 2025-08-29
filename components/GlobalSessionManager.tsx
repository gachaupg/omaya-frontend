"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initializeAuth } from "../features/auth/slices/authSlice";
import { useGlobalSessionCreation } from "../hooks/useGlobalSessionCreation";
import TwoFAModal from "../features/auth/components/2fa";
import GoogleOAuthDebug from "../features/auth/components/GoogleOAuthDebug";

const GlobalSessionManager = () => {
  const dispatch = useDispatch();
  
  // Initialize authentication state from localStorage
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);
  
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
