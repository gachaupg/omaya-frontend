"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getGoogleOAuthUrl } from '@/utils/googleOAuthConfig';

interface GoogleAuthButtonProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  children,
}) => {
  const router = useRouter();

  const handleGoogleLogin = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    try {
      // Generate a random state parameter
      const state = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);

      // Store the state in session storage for verification
      sessionStorage.setItem('google_oauth_state', state);

      // Store the current path for redirection after successful login
      const currentPath = window.location.pathname;
      if (currentPath !== '/auth/login' && currentPath !== '/auth/register') {
        sessionStorage.setItem('auth_redirect', currentPath);
      }

      // Get the OAuth URL using our helper function
      const authUrl = getGoogleOAuthUrl(state);
      console.log('Opening Google OAuth popup:', authUrl);

      // Open Google OAuth in a popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'google-oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // If popup was blocked, fall back to redirect
        console.warn('Popup was blocked, falling back to redirect');
        window.location.href = authUrl;
        return;
      }

      // Set up a message listener to handle the OAuth callback
      const handleMessage = (event: MessageEvent) => {
        // Verify the origin of the message for security
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          // Handle successful OAuth
          onSuccess?.(event.data.user);
          popup.close();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'OAUTH_ERROR') {
          // Handle OAuth error
          onError?.(event.data.error);
          popup.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
      return;
    } catch (error) {
      console.error('Error during Google OAuth initialization:', error);
      toast.error('Failed to initialize Google Sign-In. Please try again.');
      onError?.(error);
    }
  }, [onError]);

  return (
    <button
      onClick={handleGoogleLogin}
      className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className} relative z-10 pointer-events-auto`}
      type="button"
      style={{ position: 'relative', zIndex: 10 }}
    >
      {children || (
        <span className="flex items-center gap-2">
          {/* Google logo (SVG) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
          >
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.297 15.108 18.779 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.199-5.238C29.172 35.091 26.715 36 24 36c-5.202 0-9.62-3.317-11.281-7.957l-6.54 5.037C9.49 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.24-2.231 4.166-4.092 5.565.001-.001 6.199 5.238 6.199 5.238C39.723 35.261 44 30.177 44 24c0-1.341-.138-2.651-.389-3.917z"/>
          </svg>
          <span>Continue with Google</span>
        </span>
      )}
    </button>
  );
};

export default GoogleAuthButton;
