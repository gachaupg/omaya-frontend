import { API_CONFIG } from "@/lib/appConfig";
import { cookieUtils } from "@/lib/utils/cookieUtils";

const PREFIX = "[P2P trade-preview]";

/** Dev-only console logs for market trade preview → wait modal → matched navigation. */
export function logTradePreview(
  scope: string,
  data?: Record<string, unknown> | string | null
): void {
  if (process.env.NODE_ENV === "production") return;
  if (data == null || typeof data === "string") {
    console.info(`${PREFIX} ${scope}`, data ?? "");
    return;
  }
  console.info(`${PREFIX} ${scope}`, data);
}

function getAccessTokenPreview(): string | null {
  const cookieToken = cookieUtils.getCookie("access_token");
  if (cookieToken) return cookieToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

/** Log WebSocket endpoints used during preview / wait (token masked). */
export function logTradePreviewSockets(tradeId: string, context: string): void {
  if (process.env.NODE_ENV === "production") return;
  const id = String(tradeId || "").trim();
  const token = getAccessTokenPreview();
  const tokenHint = token
    ? `${token.slice(0, 8)}…(${token.length} chars)`
    : "missing";

  const tradeConfirm = id
    ? API_CONFIG.P2P.SOCKETS.TRADE_STATUS(id, token || "")
    : "(no trade id)";
  const matchedTrades = API_CONFIG.P2P.SOCKETS.MATCHED_TRADES(token || "");
  const p2pOrders = API_CONFIG.P2P.SOCKETS.P2P_ORDERS(token || "");

  logTradePreview(`sockets (${context})`, {
    tradeId: id || "(empty)",
    token: tokenHint,
    tradeConfirmWs: maskTokenInUrl(tradeConfirm),
    matchedTradesWs: maskTokenInUrl(matchedTrades),
    p2pOrdersWs: maskTokenInUrl(p2pOrders),
    restConfirm: id
      ? `${API_CONFIG.P2P.GET_CONFIRM_ORDER}${id}/confirm/`
      : "(no trade id)",
    matchedTradesHttp: API_CONFIG.P2P.MATCHED_TRADES,
  });
}

function maskTokenInUrl(url: string): string {
  return url.replace(/token=[^&]+/i, "token=***");
}
