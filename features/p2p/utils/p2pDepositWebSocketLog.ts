declare global {
  interface Window {
    __OMAYA_P2P_DEPOSIT_WS_LOGS__?: Array<{
      ts: string;
      event: string;
      payload?: unknown;
    }>;
  }
}

export function maskP2pDepositWebSocketUrl(url: string): string {
  return url.replace(/([?&]token=)[^&]+/gi, "$1***");
}

/** P2P deposit status WebSocket debug logging — uses console.warn for production builds. */
export function p2pDepositWebSocketLog(
  event: string,
  payload?: Record<string, unknown> | string | unknown
): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    payload,
  };

  if (typeof window !== "undefined") {
    const logs = window.__OMAYA_P2P_DEPOSIT_WS_LOGS__ ?? [];
    logs.push(entry);
    if (logs.length > 200) {
      logs.shift();
    }
    window.__OMAYA_P2P_DEPOSIT_WS_LOGS__ = logs;
  }

  console.warn(`[P2P Deposit WebSocket] ${event}`, payload ?? "");
}
