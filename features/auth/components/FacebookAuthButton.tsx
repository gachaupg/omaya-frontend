"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/features/auth/store';
import { showToast } from '@/lib/utils/toast';
import axios from 'axios';
import { storage } from '../utils/storage';

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
  className = '',
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Handle Facebook response
  const handleFacebookResponse = useCallback(async (response: any) => {
    const { toast } = await import('react-toastify');
    console.log('Handling Facebook response:', response);
    try {
      setIsLoading(true);
      
      if (response.status === 'connected') {
        const { authResponse } = response;
        
        // Get user info
        const userInfo = await new Promise((resolve, reject) => {
          window.FB.api('/me', { 
            fields: 'id,name,email,first_name,last_name,picture.type(large)' 
          }, (res: any) => {
            if (res.error) {
              reject(res.error);
            } else {
              resolve(res);
            }
          });
        });

        // Send token to your backend
        const backendResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://dev.backend.omaya.io'}/api/auth/facebook/`,
          {
            access_token: authResponse.accessToken,
            user: userInfo,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );

        const { access, refresh, user, phone_required } = backendResponse.data;
        
        // Store tokens and user data
        if (access) {
          localStorage.setItem('access_token', access);
          if (refresh) localStorage.setItem('refresh_token', refresh);
          localStorage.setItem('user', JSON.stringify(user));
          // Persist to shared storage for apiClient Authorization header
          storage.setProfile({
            user,
            tokens: { access, refresh: refresh || '' },
          });
          // Set cookie for middleware checks (1 hour)
          const maxAge = 60 * 60;
          document.cookie = `access_token=${access}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        }
        
        // If phone number is required, redirect to phone capture step
        if (phone_required) {
          window.location.href = '/auth/phone';
          return;
        }

        // Call success callback
        onSuccess?.(user);
        
        // Show success message using toast
        toast.success('Successfully logged in with Facebook');
        
        // Redirect to dashboard or intended URL
        const redirectTo = localStorage.getItem('redirect_after_login') || '/dashboard';
        localStorage.removeItem('redirect_after_login');
        // Use full reload to ensure auth state is properly set everywhere
        window.location.href = redirectTo;
      } else {
        throw new Error('Facebook login failed');
      }
    } catch (error: any) {
      console.error('Facebook login error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to login with Facebook';
      onError?.(error);
      
      // Show error message using toast
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onError, onSuccess, router]);

  // Initialize Facebook SDK
  useEffect(() => {
    console.log('Initializing Facebook SDK...');
    
    const initializeFacebookSDK = () => {
      console.log('Checking for FB object...');
      
      if (window.FB) {
        console.log('FB object found, initializing...');
        
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '596315263341600',
          cookie: true,
          xfbml: true,
          version: 'v18.0',
          status: true,
          autoLogAppEvents: true,
        });

        // On HTTP pages, some SDK methods (like getLoginStatus) are blocked by Facebook.
        // If not HTTPS, skip the preflight status check but keep the SDK usable on click.
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
          console.warn('Facebook SDK: Skipping getLoginStatus because page is not HTTPS. Login will still work on click.');
          setIsSDKLoaded(true);
        } else {
          console.log('FB.init called, checking login status...');
          // Check login status (only on HTTPS)
          window.FB.getLoginStatus((response: any) => {
            console.log('FB.getLoginStatus response:', response);
            if (response.status === 'connected') {
              console.log('Already connected to Facebook');
              handleFacebookResponse(response);
            } else {
              console.log('Not connected to Facebook');
            }
            setIsSDKLoaded(true);
          });
        }
        
        return;
      }

      // If FB is not available, load the SDK
      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        
        script.onload = () => {
          // Reinitialize after script loads
          initializeFacebookSDK();
        };
        
        script.onerror = (error) => {
          console.error('Failed to load Facebook SDK', error);
          onError?.({ message: 'Failed to load Facebook SDK' });
        };
        
        document.body.appendChild(script);
      }
    };

    // Add Facebook SDK initialization function to window
    window.fbAsyncInit = initializeFacebookSDK;

    // Initialize the SDK
    initializeFacebookSDK();

    // Cleanup
    return () => {
      // Remove the script if it exists
      const script = document.getElementById('facebook-jssdk');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [handleFacebookResponse, onError]);

  const handleFacebookLogin = async () => {
    const { toast } = await import('react-toastify');
    console.log('Facebook login button clicked');
    
    if (typeof window === 'undefined' || !window.FB) {
      console.error('Facebook SDK not loaded');
      toast.error('Facebook SDK is not loaded yet. Please try again.');
      return;
    }

    console.log('Calling FB.login()...');
    setIsLoading(true);

    window.FB.login(
      (response: any) => {
        console.log('FB.login response:', response);
        
        if (response.authResponse) {
          console.log('Auth response received, handling...');
          handleFacebookResponse(response);
        } else {
          console.log('User cancelled login or did not fully authorize.');
          setIsLoading(false);
          onError?.({ message: 'Facebook login was cancelled or not authorized' });
          
          // Show info message using toast
          toast.info('Facebook login was cancelled or not authorized');
        }
      },
      {
        scope: 'email,public_profile',
        return_scopes: true,
        auth_type: 'rerequest',
      }
    );
  };

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={isLoading || !isSDKLoaded}
      className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent border border-gray-300 dark:border-[#35353E] rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-[#2D2D33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className} ${!isSDKLoaded ? 'opacity-50 cursor-not-allowed' : ''} relative z-10 pointer-events-auto`}
      type="button"
      style={{ position: 'relative', zIndex: 10 }}
    >
      {isLoading ? (
        <span>Loading...</span>
      ) : !isSDKLoaded ? (
        <span>Initializing Facebook...</span>
      ) : (
        <>
          {children || (
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="#1877f2"
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fillRule="evenodd"
                  d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Facebook</span>
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default FacebookAuthButton;
