// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store/index";
import { ThemeProvider } from "@/context/theme";
import { LanguageProvider } from "@/context/language";
import { setAuthCallback } from "@/lib/utils/errorHandler";
import { logout } from "@/features/auth/slices/authSlice";
import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HomePage401Suppressor } from "@/components/HomePage401Suppressor";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up the auth callback to handle 401 errors
    setAuthCallback(() => {
      store.dispatch(logout());
      window.location.href = "/auth/login";
    });

    // Check for valid profile on app load - force logout if invalid
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      
      const profile = localStorage.getItem('profile');
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/auth/') || currentPath === '/';
      
      if (!profile && !isAuthPage) {
        console.log('🔒 No profile found on app load, forcing logout...');
        localStorage.clear();
        window.location.href = '/auth/login';
      } else if (profile) {
        try {
          const parsed = JSON.parse(profile);
          if (!parsed.tokens?.access || !parsed.user) {
            console.log('🔒 Invalid profile structure, forcing logout...');
            localStorage.clear();
            if (!isAuthPage) {
              window.location.href = '/auth/login';
            }
          }
        } catch (e) {
          console.log('🔒 Corrupted profile data, forcing logout...');
          localStorage.clear();
          if (!isAuthPage) {
            window.location.href = '/auth/login';
          }
        }
      }
    };

    checkAuth();
  }, []);

  return (
    <GlobalErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <LanguageProvider>
            <GoogleOAuthProvider
              clientId={
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
                "866830600136-atu6lg341gn9snr1pkbmjhssebh9luqb.apps.googleusercontent.com"
              }
            >
              <HomePage401Suppressor>
                {children}
              </HomePage401Suppressor>
            </GoogleOAuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Provider>
    </GlobalErrorBoundary>
  );
}
