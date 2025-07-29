import { API_CONFIG } from "@/lib/appConfig";

export function connectSwapStatusWebSocket(swapId: string): WebSocket {
  const wsUrl = API_CONFIG.SWAP.SWAP_STATUS_WS(swapId);
  return new WebSocket(wsUrl);
}
// import { API_CONFIG } from "@/lib/appConfig";

// export function connectSwapStatusWebSocket({
//   swapId,
//   onMessage,
//   onError,
//   onClose,
// }: {
//   swapId: string;
//   onMessage?: (event: MessageEvent) => void;
//   onError?: (event: Event) => void;
//   onClose?: (event: CloseEvent) => void;
// }): WebSocket {
//   const wsUrl = API_CONFIG.SWAP.SWAP_STATUS_WS(swapId);
//   const ws = new WebSocket(wsUrl);

//   if (onMessage) ws.addEventListener("message", onMessage);
//   if (onError) ws.addEventListener("error", onError);
//   if (onClose) ws.addEventListener("close", onClose);

//   return ws;
// }
