"use client";

import React, { createContext, useContext } from "react";
import { useWebPushNotifications } from "@/features/notifications/hooks/useWebPushNotifications";

type WebPushContextValue = ReturnType<typeof useWebPushNotifications>;

const WebPushContext = createContext<WebPushContextValue | null>(null);

export function useWebPush() {
  const value = useContext(WebPushContext);
  if (!value) {
    throw new Error("useWebPush must be used within WebPushProvider");
  }
  return value;
}

export function useOptionalWebPush() {
  return useContext(WebPushContext);
}

/** Registers service worker + push subscription for authenticated users. */
export function WebPushProvider({ children }: { children: React.ReactNode }) {
  const webPush = useWebPushNotifications();

  return (
    <WebPushContext.Provider value={webPush}>{children}</WebPushContext.Provider>
  );
}
