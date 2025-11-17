// features/auth/components/GoogleOAuthCallback.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  auth_provider?: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
  user: UserData;
  detail?: string;
  error?: string;
}

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dev.backend.omaya.io';

  // Check if we're in a popup
  const isInPopup = useCallback(() => {
    try {
      return window.opener && window.opener !== window;
    } catch (e) {
      return false;
    }
  }, []);

  // Function to get CSRF token from cookies
  const getCsrfToken = (): string => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/\bcsrftoken=([^;]+)/);
    return match ? match[1] : '';
  };

  // Function to exchange authorization code for tokens
  const exchangeCodeForTokens = async (code: string) => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`${apiUrl}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          redirect_uri: window.location.origin + '/auth/google/callback',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to authenticate with Google');
      }

      return data;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  };

  // Function to send message to parent window
  const sendMessageToParent = useCallback((type: 'OAUTH_SUCCESS' | 'OAUTH_ERROR', data: any) => {
    if (window.opener) {
      window.opener.postMessage({
        type,
        ...data,
      }, window.location.origin);
      // Close the popup after a short delay to ensure the message is sent
      setTimeout(() => window.close(), 500);
    }
  }, []);

  // Function to send message to parent window
  const sendMessageToParent = useCallback((type: 'OAUTH_SUCCESS' | 'OAUTH_ERROR', data: any) => {
    if (window.opener) {
      window.opener.postMessage({
        type,
        ...data,
      }, window.location.origin);
      // Close the popup after a short delay to ensure the message is sent
      setTimeout(() => window.close(), 500);
    }
  }, []);

  // Handle the OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Return early if searchParams is not available or already processed
      if (!searchParams || processedRef.current) {
        return;
      }
      
      // Mark as processed to prevent duplicate processing
      processedRef.current = true;
      setIsLoading(true);
      
      try {
        // Extract code, state, and error from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const isPopup = isInPopup();

        // Check for OAuth error
        if (error) {
          const errorMsg = `OAuth error: ${error}`;
          if (isPopup) {
            sendMessageToParent('OAUTH_ERROR', { error: errorMsg });
            return;
          }
          throw new Error(errorMsg);
        }

        // Check for missing code
        if (!code) {
          const errorMsg = 'No authorization code found in the URL';
          if (isPopup) {
            sendMessageToParent('OAUTH_ERROR', { error: errorMsg });
            return;
          }
          throw new Error(errorMsg);
        }

        // Verify state parameter to prevent CSRF
        const savedState = sessionStorage.getItem('google_oauth_state');
        if (state !== savedState) {
          const errorMsg = 'Invalid state parameter';
          if (isPopup) {
            sendMessageToParent('OAUTH_ERROR', { error: errorMsg });
            return;
          }
          throw new Error(errorMsg);
        }
        
        // Clear the state from storage
        sessionStorage.removeItem('google_oauth_state');
        // Exchange code for tokens
        const data = await exchangeCodeForTokens(code);
        
        // Store tokens
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        // If in popup, send success message to parent and close
        if (isInPopup()) {
          sendMessageToParent('OAUTH_SUCCESS', {
            user: data.user,
            accessToken: data.access,
            refreshToken: data.refresh
          });
          return;
        }
        
        // If not in popup, redirect to dashboard or previous page
        const redirectPath = sessionStorage.getItem('auth_redirect') || '/dashboard';
        sessionStorage.removeItem('auth_redirect');
        router.push(redirectPath);
        
      } catch (err) {
        console.error('Authentication error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        if (isInPopup()) {
          sendMessageToParent('OAUTH_ERROR', { error: errorMessage });
          return;
        }
        
        setError(errorMessage);
        toast.error('Failed to authenticate with Google');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure the component is mounted
    const timer = setTimeout(() => {
      handleAuthCallback();
    }, 100);

    // Cleanup function
    return () => clearTimeout(timer);
  }, [searchParams, router, isInPopup, sendMessageToParent]);

  // Render loading or error state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md w-full mx-4">
          <h3 className="font-bold">Authentication Error</h3>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authentication successful! Redirecting...</p>
      </div>
    </div>
  );
}