// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store/index";
import { ThemeProvider } from "@/context/theme";
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
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "271869110142-pipollidmfj2v26dvgt9oumru543v84p.apps.googleusercontent.com"}>
          {children}
        </GoogleOAuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
