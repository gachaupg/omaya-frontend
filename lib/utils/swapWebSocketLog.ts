declare global {
  interface Window {
    __OMAYA_SWAP_WS_LOGS__?: Array<{
      ts: string;
      event: string;
      payload?: unknown;
    }>;
  }
}

/** Swap WebSocket debug logging — uses console.warn so logs survive production builds. */
export function swapWebSocketLog(
  event: string,
  payload?: Record<string, unknown> | string | unknown
): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    payload,
  };

  if (typeof window !== "undefined") {
    const logs = window.__OMAYA_SWAP_WS_LOGS__ ?? [];
    logs.push(entry);
    if (logs.length > 200) {
      logs.shift();
    }
    window.__OMAYA_SWAP_WS_LOGS__ = logs;
  }

  console.warn(`[Swap WebSocket] ${event}`, payload ?? "");
}

export function maskSwapWebSocketUrlForLog(url: string): string {
  return url.replace(/([?&]token=)[^&]+/gi, "$1***");
}
