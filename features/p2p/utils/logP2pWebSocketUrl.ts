import { logger } from "@/lib/utils/logger";

/** Print the full WebSocket URL (including token) for P2P socket debugging. */
export function logP2pWebSocketUrl(channel: string, url: string): void {
  const label = `[P2P WS ${channel}]`;
  if (typeof console !== "undefined") {
    console.log(`${label} ${url}`);
  }
  logger.info("p2p", `${label} ${url}`);
}
