"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/features/auth/store';
import { showToast } from '@/lib/utils/toast';
import axios from 'axios';

interface FacebookAuthButtonProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const FacebookAuthButton: React.FC<FacebookAuthButtonProps> = ({
  onSuccess,
  onError,
  className = "",
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Initialize Facebook SDK
  useEffect(() => {
    const initializeFacebookSDK = () => {
      if (window.FB) {
        window.FB.init({
          appId: '596315263341600',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        setIsSDKLoaded(true);
        return;
      }

      // If FB is not available, load the SDK
      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          if (window.fbAsyncInit) {
            window.fbAsyncInit();
          }
          setIsSDKLoaded(true);
        };
        
        document.head.appendChild(script);
      }
    };

    // Check if SDK is already loaded
    if (window.FB) {
      initializeFacebookSDK();
    } else {
      // Wait for the SDK to load
      const checkSDK = setInterval(() => {
        if (window.FB) {
          clearInterval(checkSDK);
          initializeFacebookSDK();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkSDK), 10000);
    }
  }, []);

  const handleFacebookLogin = () => {
    if (!isSDKLoaded || !window.FB) {
      showToast.error("Facebook SDK is not loaded. Please try again.");
      return;
    }

    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    if (!isSecure) {
      showToast.error("Facebook login requires HTTPS. Please use HTTPS or localhost for development.");
      return;
    }

    setIsLoading(true);

    try {
      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            authenticateWithBackend(accessToken);
          } else {
            setIsLoading(false);
            onError?.({ message: "User cancelled login or did not fully authorize." });
          }
        },
        {
          scope: 'email,public_profile',
          return_scopes: true
        }
      );
    } catch (error) {
      setIsLoading(false);
      console.error("Facebook login error:", error);
      onError?.(error);
    }
  };

  const authenticateWithBackend = async (accessToken: string) => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/facebook/`,
        {
          access_token: accessToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (result.data.access && result.data.refresh) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', result.data.access);
        localStorage.setItem('refresh_token', result.data.refresh);
        
        showToast.success("Facebook login successful!");
        
        // Call success callback
        onSuccess?.(result.data.user);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Backend authentication error:", error);
      const errorMessage = error.response?.data?.message || "Authentication failed. Please try again.";
      showToast.error(errorMessage);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we're in development and not on HTTPS
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isSecure = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  const showHTTPSWarning = isDevelopment && !isSecure;

  return (
    <div className="w-full">
      {showHTTPSWarning && (
        <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Facebook login requires HTTPS. Use <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">https://localhost:3000</code> for development.
          </p>
        </div>
      )}
      <button
        onClick={handleFacebookLogin}
        disabled={isLoading || !isSDKLoaded}
        className={`flex items-center justify-center py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#2A2A30] transition-colors duration-300 w-full disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
              Connecting...
            </span>
          </>
        ) : (
          children || (
            <>
              <img
                className="w-5 h-5 mr-3 bg-white rounded-full"
                src="https://res.cloudinary.com/pitz/image/upload/v1755777400/channels4_profile_z4k17x-removebg-preview_qf5kzv.png"
                alt="Facebook"
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                Facebook
              </span>
            </>
          )
        )}
      </button>
    </div>
  );
};

export default FacebookAuthButton;
