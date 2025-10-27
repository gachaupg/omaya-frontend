"use client";

import React from "react";
import { useSelector } from "react-redux";
import { selectGoogleOAuth } from "../slices/googleOAuthSlice";
import { GOOGLE_API_ENDPOINTS } from "../../../utils/googleOAuthConfig";
import { RootState } from "../../../store";

const GoogleOAuthDebug: React.FC = () => {
  const googleOAuth = useSelector((state: RootState) => state.googleOAuth);

  if (process.env.NODE_ENV === "production") {
    return null; // Don't show debug info in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="text-sm font-bold mb-2">🔍 Google OAuth Debug</h3>
             <div className="text-xs space-y-1">
         <div>Loading: {googleOAuth.isLoading ? "✅" : "❌"}</div>
         <div>Authenticated: {googleOAuth.isAuthenticated ? "✅" : "❌"}</div>
         <div>Has User: {googleOAuth.user ? "✅" : "❌"}</div>
         <div>Has Error: {googleOAuth.error ? "❌" : "✅"}</div>
         <div>Is Redirecting: {googleOAuth.isRedirecting ? "✅" : "❌"}</div>
          <div className="mt-2 text-blue-400">
            Backend URL: {GOOGLE_API_ENDPOINTS.djangoLogin}
          </div>
        {googleOAuth.error && (
          <div className="text-red-400 mt-2">
            Error: {googleOAuth.error}
          </div>
        )}
        {googleOAuth.user && (
          <div className="mt-2">
            <div>User: {googleOAuth.user.name}</div>
            <div>Email: {googleOAuth.user.email}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleOAuthDebug;
