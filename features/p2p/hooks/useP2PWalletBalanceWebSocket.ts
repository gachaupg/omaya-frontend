"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";

/**
 * Summary structure from backend socket
 */
type SummaryState = {
  total_approved_p2p_deposits: number;
  total_approved_p2p_withdrawals: number;
  total_pending_p2p_deposits: number;
  total_pending_p2p_withdrawals: number;
  total_approved_p2p_volume: number;
};

/**
 * Wallet state structure
 */
type WalletBalanceState = {
  balance: number | null;
  available: number | null;
  escrow: number | null;
  currency: string;
  connected: boolean;
  summary: SummaryState;
};

/**
 * Initial safe defaults
 */
const INITIAL: WalletBalanceState = {
  balance: null,
  available: null,
  escrow: null,
  currency: "USDT",
  connected: false,

  summary: {
    total_approved_p2p_deposits: 0,
    total_approved_p2p_withdrawals: 0,
    total_pending_p2p_deposits: 0,
    total_pending_p2p_withdrawals: 0,
    total_approved_p2p_volume: 0,
  },
};

/**
 * Safe number parsing
 */
function parseNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Extract socket payload safely
 */
function extractWalletPayload(raw: unknown): WalletBalanceState {
  if (!raw || typeof raw !== "object") return INITIAL;

  const root = raw as Record<string, unknown>;

  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const summary =
    data.summary && typeof data.summary === "object"
      ? (data.summary as Record<string, unknown>)
      : {};

  return {
    balance: parseNumber(data.total_balance),
    available: parseNumber(data.available_amount),
    escrow: parseNumber(data.locked_balance),

    currency:
      typeof data.currency === "string"
        ? data.currency.toUpperCase()
        : "USDT",

    connected: true,

    summary: {
      total_approved_p2p_deposits:
        parseNumber(summary.total_approved_p2p_deposits) ?? 0,

      total_approved_p2p_withdrawals:
        parseNumber(summary.total_approved_p2p_withdrawals) ?? 0,

      total_pending_p2p_deposits:
        parseNumber(summary.total_pending_p2p_deposits) ?? 0,

      total_pending_p2p_withdrawals:
        parseNumber(summary.total_pending_p2p_withdrawals) ?? 0,

      total_approved_p2p_volume:
        parseNumber(summary.total_approved_p2p_volume) ?? 0,
    },
  };
}

/**
 * Main WebSocket hook
 */
export function useP2PWalletBalanceWebSocket(enabled = true) {
  const [state, setState] = useState<WalletBalanceState>(INITIAL);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  /**
   * Token retrieval
   */
  const token = useMemo(() => {
    if (typeof window === "undefined") return null;

    return (
      cookieUtils.getCookie("access_token") ||
      localStorage.getItem("access_token")
    );
  }, []);

  useEffect(() => {
    if (!enabled || !token) return;

    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      try {
        const url = API_CONFIG.P2P.SOCKETS.WALLET_BALANCE(token);

        logger.debug("p2p", "[wallet-balance-ws] connecting", { url });

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectCountRef.current = 0;

          logger.debug("p2p", "[wallet-balance-ws] connected");

          setState((s) => ({
            ...s,
            connected: true,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);

            const next = extractWalletPayload(parsed);

            logger.debug("p2p", "[wallet-balance-ws] message", next);

            setState((prev) => ({
              ...prev,

              balance: next.balance ?? prev.balance,
              available: next.available ?? prev.available,
              escrow: next.escrow ?? prev.escrow,
              currency: next.currency || prev.currency,

              summary: next.summary ?? prev.summary,

              connected: true,
            }));
          } catch (err) {
            logger.warn(
              "p2p",
              "[wallet-balance-ws] message parse failed",
              err
            );
          }
        };

        ws.onclose = (event) => {
          logger.warn("p2p", "[wallet-balance-ws] closed", {
            code: event.code,
            reason: event.reason,
          });

          setState((s) => ({
            ...s,
            connected: false,
          }));

          if (isUnmounted) return;

          const delay = Math.min(
            10000,
            1000 * (reconnectCountRef.current + 1)
          );

          reconnectCountRef.current++;

          retryRef.current = setTimeout(connect, delay);
        };

        ws.onerror = (event) => {
          logger.warn("p2p", "[wallet-balance-ws] error", event);

          setState((s) => ({
            ...s,
            connected: false,
          }));
        };
      } catch (err) {
        logger.error("p2p", "[wallet-balance-ws] connect failed", err);
      }
    };

    const start = setTimeout(connect, 0);

    return () => {
      isUnmounted = true;

      clearTimeout(start);

      if (retryRef.current) clearTimeout(retryRef.current);

      if (wsRef.current) {
        wsRef.current.close(1000, "component-unmount");
        wsRef.current = null;
      }
    };
  }, [enabled, token]);

  return state;
}