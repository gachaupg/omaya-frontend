"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  getP2PWithdrawalStatusWebSocket,
  P2PWithdrawUpdateData,
} from "../services/p2pWithdrawalStatusWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";

const DISMISSED_KEY_PREFIX = "p2p_withdraw_rejection_dismissed_";

function wasDismissedForTransaction(transactionId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${DISMISSED_KEY_PREFIX}${transactionId}`) === "true";
}

function setDismissedForTransaction(transactionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${DISMISSED_KEY_PREFIX}${transactionId}`, "true");
}

export interface RejectionData {
  transactionId: string;
  reason?: string;
  amount?: string;
  currency?: string;
}

export function useP2PWithdrawalStatusWebSocket() {
  const { isAuthenticated, tokens } = useSelector((state: RootState) => state.auth);
  const wsRef = useRef(getP2PWithdrawalStatusWebSocket());
  const mountedRef = useRef(true);
  const [rejection, setRejection] = useState<RejectionData | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const dismissRejection = useCallback((transactionId?: string) => {
    setRejection((prev) => {
      const id = transactionId ?? prev?.transactionId;
      if (id) setDismissedForTransaction(id);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token =
      tokens?.access ||
      cookieUtils.getCookie("access_token") ||
      (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);

    if (!token || !token.includes(".")) return;

    const ws = wsRef.current;

    const unsubscribeMessage = ws.onMessage((message) => {
      if (!mountedRef.current) return;
      if (message.type !== "p2p_withdraw_update") return;

      const data = message.data as P2PWithdrawUpdateData;
      const status = (data?.status || data?.approved || "").toLowerCase();
      if (status !== "rejected") return;

      const transactionId = data.transaction_id || "";
      if (!transactionId) return;
      if (wasDismissedForTransaction(transactionId)) return;

      setRejection({
        transactionId,
        reason: data.reason,
        amount: data.amount,
        currency: data.currency,
      });
    });

    const unsubOpen = ws.onOpen(() => {});
    ws.connect({ token });

    return () => {
      unsubOpen();
      unsubscribeMessage();
    };
  }, [isAuthenticated, tokens?.access]);

  return {
    showRejectionModal: rejection !== null,
    rejectionData: rejection,
    dismissRejection,
  };
}
