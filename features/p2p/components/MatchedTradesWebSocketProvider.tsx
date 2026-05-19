"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useMatchedTradesWebSocket } from "../hooks/useMatchedTradesWebSocket";

/**
 * Keeps matched-trade notifications in sync via WebSocket on every dashboard route
 * (bell badge + notification center), with HTTP polling fallback.
 */
export function MatchedTradesWebSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useMatchedTradesWebSocket({
    enabled: isAuthenticated,
    fallbackToPolling: true,
    pollingInterval: 30000,
  });

  return <>{children}</>;
}
