"use client";

import React from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { 
  initiateGoogleOAuth, 
  selectGoogleOAuthLoading,
  selectGoogleOAuthError,
  selectGoogleOAuthAuthenticated,
  selectGoogleOAuthRedirecting,
  clearError
} from "../slices/googleOAuthSlice";
import { logGoogleOAuthError } from "../../../utils/googleOAuthConfig";
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
  const isRedirecting = useSelector(selectGoogleOAuthRedirecting);
  const error = useSelector(selectGoogleOAuthError);
  const isAuthenticated = useSelector(selectGoogleOAuthAuthenticated);

  const handleGoogleLogin = async () => {
    if (isLoading || isRedirecting) return;
    
    try {
      // Clear any previous errors
      if (error) {
        dispatch(clearError());
      }
      
      // Log the initiation
      console.log("🔐 Starting Google OAuth with Django Allauth...");
      
      // Initiate Google OAuth with Django Allauth
      const result = await dispatch(initiateGoogleOAuth() as any);
      
      if (initiateGoogleOAuth.fulfilled.match(result)) {
        console.log("✅ Google OAuth initiated, redirecting to Django Allauth...");
        toast.info("Redirecting to Google...");
        onSuccess?.({ redirecting: true });
      } else {
        console.error("❌ Failed to initiate Google OAuth");
        const errorMessage = result.payload || "Failed to initiate Google OAuth";
        toast.error(errorMessage);
        onError?.({ message: errorMessage });
      }
    } catch (error) {
      logGoogleOAuthError(error, "Google OAuth Initiation Error");
      const errorMessage = "An error occurred while initiating Google OAuth";
      toast.error(errorMessage);
      onError?.({ message: errorMessage });
    }
  };

  const isButtonDisabled = isLoading || isRedirecting || isAuthenticated;

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isButtonDisabled}
      className={`flex items-center justify-center py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1D1D23] hover:bg-gray-50 dark:hover:bg-[#2A2A30] transition-colors duration-300 w-full disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading || isRedirecting ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
            {isRedirecting ? "Redirecting..." : "Connecting..."}
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
              {isAuthenticated ? "Authenticated" : "Continue with Google"}
            </span>
          </>
        )
      )}
    </button>
  );
};

export default GoogleAuthButton;