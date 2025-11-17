// features/auth/components/GoogleOAuthCallback.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { storage } from '../utils/storage';

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dev.backend.omaya.io';

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
          // The backend determines redirect_uri consistently; avoid sending a possibly mismatched value here.
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

  // Handle the OAuth callback
  useEffect(() => {
    // Guard to ensure we only process the callback once (React Strict Mode runs effects twice in dev)
    const processedRef = (window as any).__google_oauth_processed as { done?: boolean } | undefined;
    const setProcessed = (val: boolean) => {
      (window as any).__google_oauth_processed = { done: val };
    };
    const handleAuthCallback = async () => {
      // Return early if searchParams is not available
      if (!searchParams) {
        setError('Failed to parse URL parameters');
        setIsLoading(false);
        return;
      }
      // If we've already processed this callback (likely due to Strict Mode), skip
      if ((window as any).__google_oauth_processed?.done) {
        return;
      }
      try {
        setIsLoading(true);
        setError(null);

        // Extract code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Check for OAuth error
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        // Verify we have a code
        if (!code) {
          throw new Error('No authorization code found in the URL');
        }

        // Verify state parameter to prevent CSRF
        // Support both keys: 'google_oauth_state' (sessionStorage) and 'oauth_state' (localStorage)
        const storedState =
          sessionStorage.getItem('google_oauth_state') ||
          (typeof window !== 'undefined' ? localStorage.getItem('oauth_state') : null);
        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for tokens
        setProcessed(true);
        const data = await exchangeCodeForTokens(code);

        // Store tokens and user data
        if (data.access && data.user) {
          // Persist using shared storage so apiClient adds Authorization header
          storage.setProfile({
            user: data.user,
            tokens: {
              access: data.access,
              refresh: data.refresh || '',
            },
          });

          // Also keep backwards-compat localStorage keys if used elsewhere
          localStorage.setItem('access_token', data.access);
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }

          // Set a same-origin cookie for middleware checks (expires in 1 hour)
          const maxAge = 60 * 60; // 1 hour
          document.cookie = `access_token=${data.access}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
          
          // Add a small delay to ensure state is updated before redirecting
          setTimeout(() => {
            // Check if we have a redirect URL in session storage
            const redirectTo = sessionStorage.getItem('auth_redirect') || '/dashboard';
            // Clear the redirect URL from session storage
            sessionStorage.removeItem('auth_redirect');
            
            // Use window.location.href for a full page reload to ensure auth state is properly set
            window.location.href = redirectTo;
          }, 100);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast.error('Failed to authenticate with Google');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
        // Clean up
        sessionStorage.removeItem('google_oauth_state');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('oauth_state');
        }
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating with Google...</p>
        </div>
      </div>
    );
  }

  // Render error state
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