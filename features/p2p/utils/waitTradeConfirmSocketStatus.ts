/**
 * One-shot read of p2p-trade-confirm WebSocket to learn current trade status
 * (e.g. pending_acceptance) without touching the global TradeStatusWebSocket singleton.
 */
import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";

import { logger } from "@/lib/utils/logger";

const DEFAULT_TIMEOUT_MS = 10_000;

function getAccessToken(): string | null {
  const cookieToken = cookieUtils.getCookie("access_token");
  if (cookieToken) return cookieToken;
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("access_token");
    if (localToken) return localToken;
  }
  return null;
}

function parseStatusFromPayload(
  raw: Record<string, unknown>,
  expectedTradeId: string
): string | null {
  const typ = String(raw.type || "");
  if (typ === "connection_established") return null;
  if (typ !== "status_update" && typ !== "trade_update") return null;

  const data =
    raw.data && typeof raw.data === "object"
      ? (raw.data as Record<string, unknown>)
      : raw;
  const status = data.status != null ? String(data.status).trim() : "";
  if (!status) return null;

  const tid =
    (data.trade_id as string | undefined) ??
    (data.tradeId as string | undefined) ??
    (raw.trade_id as string | undefined);
  if (tid != null && String(tid).trim() !== String(expectedTradeId).trim()) {
    return null;
  }
  return status;
}

/**
 * Opens `ws/p2p-trade-confirm/{tradeId}/`, waits for the first status_update / trade_update
 * with a `status` field for this trade, then closes. Returns null on timeout, parse error, or missing token.
 */
export function waitForTradeConfirmStatus(
  tradeId: string,
  options?: { timeoutMs?: number }
): Promise<string | null> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const id = String(tradeId || "").trim();
  if (typeof window === "undefined" || !id) return Promise.resolve(null);

  const token = getAccessToken();
  if (!token || !token.includes(".")) return Promise.resolve(null);

  const url = API_CONFIG.P2P.SOCKETS.TRADE_STATUS(id, token);

  return new Promise((resolve) => {
    let settled = false;
    let ws: WebSocket | null = null;

    const finish = (status: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws?.close(1000, "status read complete");
      } catch {
        /* no-op */
      }
      resolve(status);
    };

    const timer = window.setTimeout(() => {
      logger.debug("p2p", "waitForTradeConfirmStatus: timeout", { tradeId: id, timeoutMs });
      finish(null);
    }, timeoutMs);

    try {
      ws = new WebSocket(url);
    } catch {
      finish(null);
      return;
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        const status = parseStatusFromPayload(msg, id);
        if (status != null) {
          logger.debug("p2p", "waitForTradeConfirmStatus: got status", { tradeId: id, status });
          finish(status);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onerror = () => {
      logger.debug("p2p", "waitForTradeConfirmStatus: socket error", { tradeId: id });
      finish(null);
    };
  });
}
