import { API_CONFIG } from "@/lib/appConfig";

export function connectSwapStatusWebSocket(
  swapId: string,
  {
    onMessage,
    onOpen,
    onError,
    onClose,
  }: {
    onMessage?: (event: MessageEvent) => void;
    onOpen?: (event: Event) => void;
    onError?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
  } = {}
): WebSocket {
  const wsUrl = API_CONFIG.SWAP.SWAP_STATUS_WS(swapId);
  const ws = new WebSocket(wsUrl);

  if (onMessage) ws.onmessage = onMessage;
  if (onOpen) ws.onopen = onOpen;
  if (onError) ws.onerror = onError;
  if (onClose) ws.onclose = onClose;

  return ws;
}
