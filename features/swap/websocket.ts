/**
 * @deprecated This file is deprecated. Use features/swap/services/swapStatusWebSocket.ts instead.
 * This file is kept for backward compatibility only.
 */

// Re-export from the new location
export {
  getSwapStatusWebSocket,
  cleanupSwapStatusWebSocket,
  connectSwapStatusWebSocket,
  type WebSocketMessage,
} from "./services/swapStatusWebSocket";
