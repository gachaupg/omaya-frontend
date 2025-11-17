// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store, persistor } from "@/store/index";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "@/context/theme";
import { LanguageProvider } from "@/context/language";
import { setAuthCallback } from "@/lib/utils/errorHandler";
import { logout, setCredentials } from "@/features/auth/slices/authSlice";
import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { initializeCrossTabSync } from "@/lib/utils/crossTabSync";
import { Spinner } from "@/components/ui/Skeletons";
import { storage } from "@/features/auth/utils/storage";

declare global {
  interface Window {
    addEventListener(type: 'auth-state-changed', listener: (event: CustomEvent) => void): void;
    removeEventListener(type: 'auth-state-changed', listener: (event: CustomEvent) => void): void;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Handle auth state changes (for Google OAuth and other external auth)
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { isAuthenticated, user, tokens } = event.detail;
      
      if (isAuthenticated && user && tokens) {
        // Update Redux store with the new auth state
        store.dispatch(setCredentials({
          user,
          tokens: {
            access: tokens.access || '',
            refresh: tokens.refresh || ''
          },
          isAuthenticated: true
        }));
        
        // Store tokens in localStorage
        if (tokens.access) {
          localStorage.setItem('access_token', tokens.access);
        }
        if (tokens.refresh) {
          localStorage.setItem('refresh_token', tokens.refresh);
        }
        localStorage.setItem('user', JSON.stringify(user));

        // Persist to shared storage for apiClient Authorization header
        storage.setProfile({
          user,
          tokens: {
            access: tokens.access || '',
            refresh: tokens.refresh || '',
          },
        });

        // Set same-origin cookie for middleware checks (1 hour)
          const maxAge = 60 * 60;
          document.cookie = `access_token=${tokens.access}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        }
      }
    // Add event listener for auth state changes
    window.addEventListener('auth-state-changed', handleAuthStateChange);

    // Set up the auth callback to handle 401 errors
    setAuthCallback(() => {
      store.dispatch(logout());
      localStorage.clear();
      document.cookie = 'access_token=; Max-Age=0; Path=/; SameSite=Lax';
      window.location.href = '/auth/login';
    });

    // Utility to read a cookie value by name
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
      return null;
    };

    // Check for valid session on app load
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;

      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userData = localStorage.getItem('user');
      
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/auth/');

      // Case 1: We already have tokens and user in localStorage → hydrate store/storage and proceed
      if (accessToken && userData) {
        try {
          const user = JSON.parse(userData);
          // Dispatch login success to update Redux store
          store.dispatch(setCredentials({
            user,
            tokens: {
              access: accessToken,
              refresh: refreshToken || ''
            },
            isAuthenticated: true
          }));

          // Ensure apiClient has Authorization header immediately
          storage.setProfile({
            user,
            tokens: {
              access: accessToken,
              refresh: refreshToken || '',
            },
          });

          // Ensure middleware can see auth (1 hour cookie)
          const maxAge = 60 * 60;
          document.cookie = `access_token=${accessToken}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
          
          // If we're on an auth page but already logged in, redirect to dashboard
          if (isAuthPage) {
            window.location.href = '/dashboard';
          }
        } catch (e) {
          console.error(' Error parsing user data:', e);
          localStorage.clear();
          document.cookie = 'access_token=; Max-Age=0; Path=/; SameSite=Lax';
          // Do not force redirect here; middleware protects /dashboard
        }
        return;
      }

      // Case 2: No localStorage session, but middleware cookie exists → hydrate from cookie
      const cookieToken = getCookie('access_token');
      if (cookieToken) {
        try {
          // Seed storage with token so apiClient attaches Authorization
          storage.setProfile({
            user: {} as any,
            tokens: { access: cookieToken, refresh: '' },
          });
          // Persist token for future restores
          localStorage.setItem('access_token', cookieToken);

          // Fetch user profile from backend
          const { get } = await import('@/lib/apiClient');
          const resp = await get<any>('/api/auth/user/', {
            headers: { Authorization: `Bearer ${cookieToken}` },
            withCredentials: true,
          });

          const user = resp.data;
          localStorage.setItem('user', JSON.stringify(user));
          // Hydrate redux
          store.dispatch(setCredentials({
            user,
            tokens: { access: cookieToken, refresh: '' },
            isAuthenticated: true,
          }));
          // Update storage with real user
          storage.setProfile({ user, tokens: { access: cookieToken, refresh: '' } });

          // If we are on auth pages, go to dashboard
          if (isAuthPage) {
            window.location.href = '/dashboard';
          }
        } catch (e) {
          console.warn(' Failed to hydrate session from cookie:', e);
          // Clean up bad cookie
          document.cookie = 'access_token=; Max-Age=0; Path=/; SameSite=Lax';
        }
        return;
      }

      // Case 3: No session anywhere → clear and stay; middleware will guard protected routes
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    };
    checkAuth();
    
    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    };
  }, []);

  return (
      <Provider store={store}>
      <PersistGate
        loading={
          <div className="min-h-screen flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
        persistor={persistor}
      >
          <ThemeProvider>
            <LanguageProvider>
              <GoogleOAuthProvider
                clientId={
                  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
                  "419397388040-pho892dc9oj407o844h8af1leh9cnvpq.apps.googleusercontent.com"
                }
              >
                {children}
            </GoogleOAuthProvider>
            </LanguageProvider>
          </ThemeProvider>
      </PersistGate>
      </Provider>
  );
}
