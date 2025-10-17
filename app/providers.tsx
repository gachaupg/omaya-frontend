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

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up the auth callback to handle 401 errors
    setAuthCallback(() => {
      store.dispatch(logout());
      window.location.href = "/auth/login";
    });
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <LanguageProvider>
          <GoogleOAuthProvider
            clientId={
              process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
              "866830600136-atu6lg341gn9snr1pkbmjhssebh9luqb.apps.googleusercontent.com"
            }
          >
            {children}
          </GoogleOAuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  );
}
