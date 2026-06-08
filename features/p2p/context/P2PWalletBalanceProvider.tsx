"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useP2PWalletBalanceWebSocket } from "@/features/p2p/hooks/useP2PWalletBalanceWebSocket";
import type { TransactionSummary } from "@/features/p2p/types";

/**
 * Summary structure coming from WebSocket
 */
export type P2PSummaryState = {
  total_approved_p2p_deposits: number;
  total_approved_p2p_withdrawals: number;
  total_pending_p2p_deposits: number;
  total_pending_p2p_withdrawals: number;
  total_approved_p2p_volume: number;
};

/**
 * Wallet state shared via context
 */
export type P2PWalletBalanceWsState = {
  balance: number | null;
  available: number | null;
  escrow: number | null;
  currency: string;
  connected: boolean;
  summary: P2PSummaryState;
  /** Live overview stats from wallet-balance WebSocket */
  overviewSummary: TransactionSummary | null;
};

/**
 * Context
 */
const P2PWalletBalanceContext =
  createContext<P2PWalletBalanceWsState | null>(null);

/**
 * Provider
 */
export function P2PWalletBalanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const isAuthenticated = useSelector(
    (s: RootState) => s.auth.isAuthenticated
  );

  const state = useP2PWalletBalanceWebSocket(isAuthenticated);

  // Keep balance/available/escrow null until WS sends data so REST/persisted
  // values show immediately instead of flashing 0.
  const safeState: P2PWalletBalanceWsState = {
    balance: state.balance,
    available: state.available,
    escrow: state.escrow,
    currency: state.currency || "USDT",
    connected: state.connected,
    overviewSummary: state.overviewSummary,

    summary: {
      total_approved_p2p_deposits:
        state.summary?.total_approved_p2p_deposits ?? 0,

      total_approved_p2p_withdrawals:
        state.summary?.total_approved_p2p_withdrawals ?? 0,

      total_pending_p2p_deposits:
        state.summary?.total_pending_p2p_deposits ?? 0,

      total_pending_p2p_withdrawals:
        state.summary?.total_pending_p2p_withdrawals ?? 0,

      total_approved_p2p_volume:
        state.summary?.total_approved_p2p_volume ?? 0,
    },
  };

  return (
    <P2PWalletBalanceContext.Provider value={safeState}>
      {children}
    </P2PWalletBalanceContext.Provider>
  );
}

/**
 * Hook
 */
export function useP2PWalletBalanceContext(): P2PWalletBalanceWsState {
  const ctx = useContext(P2PWalletBalanceContext);

  if (!ctx) {
    throw new Error(
      "useP2PWalletBalanceContext must be used within P2PWalletBalanceProvider"
    );
  }

  return ctx;
}