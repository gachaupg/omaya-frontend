"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  auth_provider?: string;
  access_token?: string;
  refresh_token?: string;
}

interface GoogleOAuthCallbackProps {
  onSuccess?: (userData: UserData) => void;
  onError?: (error: { message: string }) => void;
  redirectTo?: string;
}

const GoogleOAuthCallback: React.FC<GoogleOAuthCallbackProps> = ({
  onSuccess,
  onError,
  redirectTo = "/dashboard",
}): JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Function to safely parse JSON from localStorage
  const safeJsonParse = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing ${key} from localStorage:`, error);
      return null;
    }
  };

  // Function to store auth data
  const storeAuthData = (data: any) => {
    try {
      localStorage.setItem('auth', JSON.stringify({
        user: data.user,
        access_token: data.access,
        refresh_token: data.refresh,
        timestamp: new Date().getTime()
      }));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔍 Handling OAuth callback...");
        
        if (!searchParams) {
          console.warn("⚠️ No search params available");
          return;
        }
        
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        if (errorParam) {
          console.error("❌ OAuth error in URL:", errorParam);
          const errorMessage = `OAuth error: ${errorParam}`;
          toast.error(errorMessage);
          onError?.({ message: errorMessage });
          router.push("/auth/login");
          return;
        }
        
        if (!code) {
          console.error("❌ No authorization code found in URL");
          const errorMessage = "Authentication failed: No authorization code received";
          toast.error(errorMessage);
          onError?.({ message: errorMessage });
          router.push("/auth/login");
          return;
        }
        
        console.log("🔑 Exchanging authorization code for tokens...");
        
        try {
          // Exchange the authorization code for tokens
          const response = await fetch('http://localhost:8000/api/auth/google/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ code }),
            credentials: 'include', // Important for cookies
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Authentication failed');
          }
          
          console.log("✅ Authentication successful:", data);
          
          if (data.access && data.refresh && data.user) {
            // Store auth data in localStorage
            storeAuthData({
              ...data,
              user: {
                id: data.user.id,
                email: data.user.email,
                first_name: data.user.first_name || '',
                last_name: data.user.last_name || '',
                auth_provider: data.user.auth_provider || 'google',
              },
              access: data.access,
              refresh: data.refresh
            });
            
            // Set a cookie with the access token (handled by the backend)
            document.cookie = `access_token=${data.access}; path=/; samesite=lax`;
            document.cookie = `refresh_token=${data.refresh}; path=/; samesite=lax`;
            
            // Call the success callback if provided
            onSuccess?.({
              ...data.user,
              access_token: data.access,
              refresh_token: data.refresh
            });
            
            toast.success("Login successful!");
            
            // Redirect to dashboard or intended URL
            router.push(redirectTo);
            return;
          }
          
          // If we get here, something went wrong with user data
          throw new Error('Failed to fetch user data');
          
        } catch (err) {
          const error = err as Error;
          console.error("❌ Error during authentication:", error);
          toast.error(`Authentication failed: ${error.message}`);
          onError?.({ message: error.message });
          router.push("/auth/login");
        }
      } catch (err) {
        const error = err as Error;
        console.error("❌ Error in OAuth callback:", error);
        const errorMessage = error.message || "An error occurred during authentication";
        toast.error(errorMessage);
        onError?.({ message: errorMessage });
        
        // Redirect to login page
        router.push("/auth/login");
      }
    };
    
    handleAuthCallback();
  }, [searchParams, onSuccess, onError, redirectTo, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
