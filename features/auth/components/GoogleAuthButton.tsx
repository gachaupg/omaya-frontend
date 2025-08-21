"use client";

import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { 
  authenticateWithGoogle, 
  setAuthCode, 
  clearAuthCode,
  selectGoogleOAuthLoading,
  selectGoogleOAuthError,
  selectGoogleOAuthAuthenticated
} from "../slices/googleOAuthSlice";
import { logGoogleOAuthResponse, logGoogleOAuthError } from "../../../utils/googleOAuthConfig";
import { RootState } from "../../../store";

interface GoogleAuthButtonProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  className = "",
  children,
}) => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectGoogleOAuthLoading);
  const error = useSelector(selectGoogleOAuthError);
  const isAuthenticated = useSelector(selectGoogleOAuthAuthenticated);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        console.log("🎉 Google OAuth success - Code received");
        
        // Log the Google OAuth response
        logGoogleOAuthResponse(codeResponse, "Google OAuth Success");
        
        // Set the auth code in Redux
        dispatch(setAuthCode(codeResponse.code));
        
        // Authenticate with backend
        const result = await dispatch(authenticateWithGoogle(codeResponse.code) as any);
        
        if (authenticateWithGoogle.fulfilled.match(result)) {
          console.log("✅ Backend authentication successful");
          toast.success("Google authentication successful!");
          onSuccess?.(result.payload);
        } else {
          console.error("❌ Backend authentication failed");
          const errorMessage = result.payload || "Authentication failed";
          toast.error(errorMessage);
          onError?.({ message: errorMessage });
        }
      } catch (error) {
        console.error("❌ Google OAuth error:", error);
        logGoogleOAuthError(error, "Google OAuth Error");
        onError?.(error);
      }
    },
    onError: (error: any) => {
      console.error("❌ Google Login Failed:", error);
      logGoogleOAuthError(error, "Google OAuth Login Error");
      
      // Handle specific COOP errors
      if (error.error === "popup_closed_by_user" || error.error === "popup_blocked") {
        toast.error("Popup was blocked. Please allow popups for this site and try again.");
      } else if (error.error === "access_denied") {
        toast.error("Access was denied. Please try again.");
      } else {
        toast.error("Google login failed. Please try again.");
      }
      
      onError?.(error);
    },
    flow: "auth-code",
    scope: "email profile",
    ux_mode: "popup",
    onNonOAuthError: (error) => {
      console.error("❌ Non-OAuth error:", error);
      logGoogleOAuthError(error, "Non-OAuth Error");
      toast.error("An error occurred. Please try again.");
      onError?.(error);
    },
  });

  const handleClick = () => {
    if (isLoading) return;
    
    // Clear any previous errors
    if (error) {
      dispatch(clearAuthCode());
    }
    
    // Add a small delay to prevent rapid clicks
    setTimeout(() => {
      login();
    }, 100);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center justify-center py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1D1D23] hover:bg-gray-50 dark:hover:bg-[#2A2A30] transition-colors duration-300 w-full disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
            Connecting...
          </span>
        </div>
      ) : (
        children || (
          <>
            <img
              className="w-5 h-5 mr-3 object-cover"
              src="https://res.cloudinary.com/pitz/image/upload/v1707291175/download-removebg-preview_rfrd5r.png"
              alt="Google logo"
            />
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
              Google
            </span>
          </>
        )
      )}
    </button>
  );
};

export default GoogleAuthButton;
