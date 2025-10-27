"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  checkAuthStatus, 
  selectGoogleOAuthLoading,
  selectGoogleOAuthError,
  selectGoogleOAuthAuthenticated,
  selectGoogleOAuthUser
} from "../slices/googleOAuthSlice";
import { toast } from "react-toastify";

interface GoogleOAuthCallbackProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  redirectTo?: string;
}

const GoogleOAuthCallback: React.FC<GoogleOAuthCallbackProps> = ({
  onSuccess,
  onError,
  redirectTo = "/dashboard",
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const isLoading = useSelector(selectGoogleOAuthLoading);
  const error = useSelector(selectGoogleOAuthError);
  const isAuthenticated = useSelector(selectGoogleOAuthAuthenticated);
  const user = useSelector(selectGoogleOAuthUser);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Checking authentication status after OAuth callback...");
        
        // Check if we have any URL parameters that might indicate OAuth success/failure
        if (!searchParams) {
          console.warn("⚠️ No search params available");
          return;
        }
        
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        if (error) {
          console.error("❌ OAuth error in URL:", error);
          const errorMessage = `OAuth error: ${error}`;
          toast.error(errorMessage);
          onError?.({ message: errorMessage });
          return;
        }
        
        // Check authentication status with the backend
        const result = await dispatch(checkAuthStatus() as any);
        
        if (checkAuthStatus.fulfilled.match(result)) {
          if (result.payload.isAuthenticated) {
            console.log("✅ User is authenticated:", result.payload.user);
            toast.success("Google authentication successful!");
            onSuccess?.(result.payload.user);
            
            // Redirect to the specified page
            if (redirectTo) {
              router.push(redirectTo);
            }
          } else {
            console.log("❌ User is not authenticated");
            toast.error("Authentication failed. Please try again.");
            onError?.({ message: "Authentication failed" });
            
            // Redirect to login page
            router.push("/auth/login");
          }
        } else {
          console.error("❌ Failed to check authentication status");
          const errorMessage = result.payload || "Failed to check authentication status";
          toast.error(errorMessage);
          onError?.({ message: errorMessage });
          
          // Redirect to login page
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("❌ Error in OAuth callback:", error);
        const errorMessage = "An error occurred during authentication";
        toast.error(errorMessage);
        onError?.({ message: errorMessage });
        
        // Redirect to login page
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [dispatch, searchParams, onSuccess, onError, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = "/auth/login"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Authentication Successful
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Welcome, {user.name || user.email}!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Processing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
