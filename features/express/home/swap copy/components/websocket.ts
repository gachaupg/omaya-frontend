/**
 * @deprecated This file is deprecated. Use features/swap/services/swapStatusWebSocket.ts instead.
 * This file is kept for backward compatibility only.
 */

// Re-export from the new location
export {
  connectSwapStatusWebSocket,
  getSwapStatusWebSocket,
  cleanupSwapStatusWebSocket,
  type WebSocketMessage,
} from "../services/swapStatusWebSocket";
