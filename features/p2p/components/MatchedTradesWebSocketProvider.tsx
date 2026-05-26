"use client";

import React, { createContext, useContext } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useMatchedTradesWebSocket } from "../hooks/useMatchedTradesWebSocket";

const MatchedTradesWsContext = createContext({ isConnected: false });

/** Matched-trades WebSocket status from dashboard layout provider. */
export function useMatchedTradesWsConnected(): boolean {
  return useContext(MatchedTradesWsContext).isConnected;
}

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

  const { isConnected } = useMatchedTradesWebSocket({
    enabled: isAuthenticated,
    fallbackToPolling: true,
    pollingInterval: 30000,
  });

  return (
    <MatchedTradesWsContext.Provider value={{ isConnected }}>
      {children}
    </MatchedTradesWsContext.Provider>
  );
}
