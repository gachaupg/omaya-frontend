"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { logger } from "@/lib/utils/logger";

type WalletBalanceState = {
  balance: number | null;
  available: number | null;
  escrow: number | null;
  currency: string;
  connected: boolean;
};

const INITIAL: WalletBalanceState = {
  balance: null,
  available: null,
  escrow: null,
  currency: "USDT",
  connected: false,
};

function parseNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const cleaned = v.replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const n = parseNumber(obj[k]);
    if (n != null) return n;
  }
  return null;
}

function extractWalletPayload(raw: unknown): WalletBalanceState {
  if (!raw || typeof raw !== "object") return INITIAL;
  const root = raw as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;

  const balance = pickNumber(data, [
    "balance",
    "total_balance",
    "wallet_balance",
    "totalBalance",
  ]);
  const available = pickNumber(data, [
    "available",
    "available_amount",
    "available_balance",
    "free",
    "spendable",
  ]);
  const escrow = pickNumber(data, [
    "escrow",
    "locked",
    "locked_amount",
    "in_escrow",
    "total_locked",
    "escrow_amount",
    "pending_escrow",
  ]);
  const currency =
    pickString(data, ["currency", "asset", "symbol"]) ||
    pickString(root, ["currency", "asset", "symbol"]) ||
    "USDT";

  return {
    balance,
    available,
    escrow,
    currency: currency.toUpperCase(),
    connected: true,
  };
}

export function useP2PWalletBalanceWebSocket(enabled: boolean = true) {
  const [state, setState] = useState<WalletBalanceState>(INITIAL);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (
      cookieUtils.getCookie("access_token") || localStorage.getItem("access_token")
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
          logger.debug("p2p", "[wallet-balance-ws] connected");
          reconnectCountRef.current = 0;
          setState((s) => ({ ...s, connected: true }));
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
              connected: true,
            }));
          } catch (err) {
            logger.warn("p2p", "[wallet-balance-ws] parse failed", err);
          }
        };

        ws.onclose = (event) => {
          logger.warn("p2p", "[wallet-balance-ws] closed", {
            code: event.code,
            reason: event.reason,
            reconnectCount: reconnectCountRef.current,
          });
          setState((s) => ({ ...s, connected: false }));
          if (isUnmounted) return;
          const delay = Math.min(10000, 1000 * Math.max(1, reconnectCountRef.current + 1));
          reconnectCountRef.current += 1;
          retryRef.current = setTimeout(connect, delay);
        };

        ws.onerror = (event) => {
          logger.warn("p2p", "[wallet-balance-ws] error", event);
          setState((s) => ({ ...s, connected: false }));
        };
      } catch (err) {
        logger.error("p2p", "[wallet-balance-ws] connect failed", err);
        setState((s) => ({ ...s, connected: false }));
      }
    };

    const startRef = setTimeout(connect, 0);

    return () => {
      isUnmounted = true;
      clearTimeout(startRef);
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, "component-unmount");
        } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
          const ws = wsRef.current;
          ws.onopen = () => {
            try {
              ws.close(1000, "component-unmount");
            } catch {
              // ignore
            }
          };
        }
        wsRef.current = null;
      }
    };
  }, [enabled, token]);

  return state;
}

