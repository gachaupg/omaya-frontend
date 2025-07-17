// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store/index";
import { ThemeProvider } from "@/context/theme";
import { setAuthCallback } from "@/lib/utils/errorHandler";
import { logout } from "@/features/auth/slices/authSlice";
import { useEffect } from "react";

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
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
}
