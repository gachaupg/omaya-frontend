"use client";

import React from "react";
import GoogleOAuthCallback from "@/features/auth/components/GoogleOAuthCallback";

export default function GoogleOAuthCallbackPage() {
  return (
    <GoogleOAuthCallback
      onSuccess={(userData) => {
        console.log("OAuth success:", userData);
      }}
      onError={(error) => {
        console.error("OAuth error:", error);
      }}
      redirectTo="/dashboard"
    />
  );
}
