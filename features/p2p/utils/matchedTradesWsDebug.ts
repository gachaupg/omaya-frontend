import { API_CONFIG } from "@/lib/appConfig";
import { logger } from "@/lib/utils/logger";

const LOG_PREFIX = "[matched-trades WS]";

export function maskTokenInWsUrl(url: string): string {
  return url.replace(/token=[^&]+/i, "token=***");
}

export function getMatchedTradesWebSocketUrl(token: string): string {
  return API_CONFIG.P2P.SOCKETS.MATCHED_TRADES(token);
}

/** Log the matched-trades WebSocket URL (token masked) and related HTTP fallback. */
export function logMatchedTradesWebSocketUrl(
  token: string,
  context: string
): void {
  const url = getMatchedTradesWebSocketUrl(token);
  logger.info("p2p", `${LOG_PREFIX} ${context}`, {
    wss: maskTokenInWsUrl(url),
    path: "/ws/matched-trades/",
    httpFallback: API_CONFIG.P2P.MATCHED_TRADES,
    tokenPresent: Boolean(token?.trim()),
    tokenLength: token?.length ?? 0,
  });
}

export function logMatchedTradesWebSocketMessage(
  type: string,
  summary: Record<string, unknown>
): void {
  logger.debug("p2p", `${LOG_PREFIX} message`, { type, ...summary });
}
