"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useP2PWalletBalanceWebSocket } from "@/features/p2p/hooks/useP2PWalletBalanceWebSocket";

export type P2PWalletBalanceWsState = {
  balance: number | null;
  available: number | null;
  escrow: number | null;
  currency: string;
  connected: boolean;
};

const P2PWalletBalanceContext = createContext<P2PWalletBalanceWsState | null>(null);

/** One WebSocket per dashboard — children read via useP2PWalletBalanceContext(). */
export function P2PWalletBalanceProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const state = useP2PWalletBalanceWebSocket(isAuthenticated);
  return (
    <P2PWalletBalanceContext.Provider value={state}>
      {children}
    </P2PWalletBalanceContext.Provider>
  );
}

export function useP2PWalletBalanceContext(): P2PWalletBalanceWsState {
  const ctx = useContext(P2PWalletBalanceContext);
  if (ctx === null) {
    throw new Error(
      "useP2PWalletBalanceContext must be used within P2PWalletBalanceProvider"
    );
  }
  return ctx;
}
