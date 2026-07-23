"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import GoogleAuthButton from "@/features/auth/components/GoogleAuthButton";
import { 
  checkAuthStatus, 
  selectGoogleOAuthLoading,
  selectGoogleOAuthError,
  selectGoogleOAuthAuthenticated,
  selectGoogleOAuthUser
} from "@/features/auth/slices/googleOAuthSlice";

export default function TestOAuthPage() {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectGoogleOAuthLoading);
  const error = useSelector(selectGoogleOAuthError);
  const isAuthenticated = useSelector(selectGoogleOAuthAuthenticated);
  const user = useSelector(selectGoogleOAuthUser);

  useEffect(() => {
    // Check authentication status on page load
    dispatch(checkAuthStatus() as any);
  }, [dispatch]);

  const handleGoogleSuccess = (userData: any) => {
      };

  const handleGoogleError = (error: any) => {
      };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            OAuth Test Page
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Test the Google OAuth flow with Django Allauth
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Authentication Status */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Authentication Status
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              {user && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="text-red-600 text-sm">
                  Error: {error}
                </div>
              )}
            </div>
          </div>

          {/* Google OAuth Button */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Google OAuth
            </h3>
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              className="w-full"
            />
          </div>

          {/* Debug Information */}
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Debug Information
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>Has User: {user ? 'Yes' : 'No'}</div>
              <div>Has Error: {error ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              Instructions
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>1. Click "Continue with Google" to start OAuth flow</p>
              <p>2. You'll be redirected to Django Allauth</p>
              <p>3. Complete Google authentication</p>
              <p>4. You'll be redirected back to /auth/google/callback</p>
              <p>5. The callback page will check your authentication status</p>
              <p>6. You'll be redirected to the dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
