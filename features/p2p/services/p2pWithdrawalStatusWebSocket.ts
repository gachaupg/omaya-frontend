import { API_CONFIG } from "@/lib/appConfig";
import {
  SingletonWebSocket,
  WebSocketMessage as BaseWebSocketMessage,
} from "@/lib/utils/baseWebSocket";

const DISMISSED_KEY_PREFIX = "p2p_withdraw_rejection_dismissed_";
export const P2P_WITHDRAWAL_REJECTED_EVENT = "p2p-withdrawal-rejected";

/** Global rejection store - React reads this, service writes to it. Ensures modal shows regardless of React timing. */
export type RejectionDetail = {
  transactionId: string;
  reason?: string;
  amount?: string;
  currency?: string;
};
let globalRejection: RejectionDetail | null = null;
const rejectionListeners = new Set<(v: RejectionDetail | null) => void>();

export function getGlobalRejection() {
  return globalRejection;
}

export function setGlobalRejection(v: RejectionDetail | null) {
  globalRejection = v;
  rejectionListeners.forEach((fn) => fn(v));
}

export function subscribeToRejection(fn: (v: RejectionDetail | null) => void) {
  rejectionListeners.add(fn);
  if (globalRejection) fn(globalRejection);
  return () => rejectionListeners.delete(fn);
}

function wasDismissedForTransaction(transactionId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${DISMISSED_KEY_PREFIX}${transactionId}`) === "true";
}

/** Show modal via vanilla DOM - works regardless of React. */
function showRejectionModalDOM(detail: RejectionDetail) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("p2p-rejection-modal-root");
  if (existing) return;

  const overlay = document.createElement("div");
  overlay.id = "p2p-rejection-modal-root";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);padding:1rem;";

  const card = document.createElement("div");
  card.style.cssText =
    "position:relative;z-index:10;width:100%;max-width:28rem;border-radius:1rem;border:1px solid #35353E;background:#18181D;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);padding:1.5rem;";
  card.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:1rem;">
      <div style="flex-shrink:0;width:3rem;height:3rem;border-radius:9999px;background:rgba(226,61,58,0.2);display:flex;align-items:center;justify-content:center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E23D3A" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <h2 style="font-size:1.125rem;font-weight:700;color:white;margin:0;">Your request was rejected</h2>
        ${detail.reason ? `<p style="margin-top:0.5rem;font-size:0.875rem;color:#9CA3AF;">Reason: ${detail.reason}</p>` : ""}
        ${detail.amount && detail.currency ? `<p style="margin-top:0.25rem;font-size:0.875rem;color:#6B7280;">Amount: ${detail.amount} ${detail.currency}</p>` : ""}
        <p style="margin-top:0.75rem;font-size:0.75rem;color:#6B7280;">This will not be shown again until your next withdrawal.</p>
      </div>
      <button id="p2p-rejection-close" style="flex-shrink:0;padding:0.25rem;border:none;background:transparent;color:#6B7280;cursor:pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div style="margin-top:1.5rem;display:flex;justify-content:flex-end;">
      <button id="p2p-rejection-ok" style="padding:0.5rem 1rem;border-radius:0.75rem;font-size:0.875rem;font-weight:500;color:white;background:#1D8751;border:none;cursor:pointer;">Okay</button>
    </div>
  `;

  const dismiss = () => {
    localStorage.setItem(`${DISMISSED_KEY_PREFIX}${detail.transactionId}`, "true");
    overlay.remove();
    setGlobalRejection(null);
    window.location.reload();
  };

  card.addEventListener("click", (e) => e.stopPropagation());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) dismiss();
  });
  card.querySelector("#p2p-rejection-close")?.addEventListener("click", dismiss);
  card.querySelector("#p2p-rejection-ok")?.addEventListener("click", dismiss);

  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

export interface P2PWithdrawUpdateData {
  transaction_id: string;
  status: string;
  approved?: string;
  stages?: string;
  amount?: string;
  currency?: string;
  reason?: string;
  timestamp?: string;
}

export interface P2PWithdrawalStatusMessage extends BaseWebSocketMessage {
  type: "p2p_withdraw_update" | "connection_established" | "error";
  data: P2PWithdrawUpdateData;
}

type MessageHandler = (message: P2PWithdrawalStatusMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

/**
 * P2PWithdrawalStatusWebSocket - Global WebSocket for P2P withdrawal status
 *
 * Receives p2p_withdraw_update when a withdrawal is approved/rejected.
 * Use for showing rejection modal when status === "rejected".
 */
export class P2PWithdrawalStatusWebSocket extends SingletonWebSocket<{ token: string }> {
  private lastToken: string = "";
  private p2pMessageHandlers: Set<MessageHandler> = new Set();
  private p2pErrorHandlers: Set<ErrorHandler> = new Set();
  private p2pCloseHandlers: Set<CloseHandler> = new Set();
  private p2pOpenHandlers: Set<OpenHandler> = new Set();

  constructor() {
    super({
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      pingInterval: 30000,
      loggerModule: "p2p-withdrawal-status",
      validateToken: true,
    });

    super.onMessage((baseMessage) => {
      const wsMessage = baseMessage as unknown as P2PWithdrawalStatusMessage;
      this.p2pMessageHandlers.forEach((handler) => handler(wsMessage));

      // Dispatch custom event so modal can show even if React handler wasn't registered yet
      if (wsMessage.type === "p2p_withdraw_update") {
        const data = wsMessage.data as P2PWithdrawUpdateData;
        const status = (data?.status || data?.approved || "").toLowerCase();
        if (status === "rejected" && data.transaction_id) {
          if (typeof window !== "undefined" && !wasDismissedForTransaction(data.transaction_id)) {
            const detail: RejectionDetail = {
              transactionId: data.transaction_id,
              reason: data.reason,
              amount: data.amount,
              currency: data.currency,
            };
            setGlobalRejection(detail);
            document?.dispatchEvent(
              new CustomEvent(P2P_WITHDRAWAL_REJECTED_EVENT, { detail })
            );
            window?.dispatchEvent(new CustomEvent(P2P_WITHDRAWAL_REJECTED_EVENT, { detail }));
            showRejectionModalDOM(detail);
          }
        }
      }
    });

    super.onError((error) => {
      this.p2pErrorHandlers.forEach((handler) => handler(error));
    });

    super.onClose(() => {
      this.p2pCloseHandlers.forEach((handler) => handler());
    });

    super.onOpen(() => {
      this.p2pOpenHandlers.forEach((handler) => handler());
    });
  }

  protected buildUrl(params: { token: string }): string {
    return API_CONFIG.P2P.SOCKETS.P2P_WITHDRAWAL_STATUS(params.token);
  }

  protected getInstanceKey(params: { token: string }): string {
    return "p2p-withdrawal-status";
  }

  protected isSameConnection(params: { token: string }): boolean {
    return this.lastToken === params.token;
  }

  override connect(params: { token: string }): void {
    this.lastToken = params.token;
    super.connect(params);
  }

  override onMessage(handler: MessageHandler): () => void {
    this.p2pMessageHandlers.add(handler);
    return () => this.p2pMessageHandlers.delete(handler);
  }

  override onError(handler: ErrorHandler): () => void {
    this.p2pErrorHandlers.add(handler);
    return () => this.p2pErrorHandlers.delete(handler);
  }

  override onClose(handler: CloseHandler): () => void {
    this.p2pCloseHandlers.add(handler);
    return () => this.p2pCloseHandlers.delete(handler);
  }

  override onOpen(handler: OpenHandler): () => void {
    this.p2pOpenHandlers.add(handler);
    return () => this.p2pOpenHandlers.delete(handler);
  }
}

let p2pWithdrawalStatusWSInstance: P2PWithdrawalStatusWebSocket | null = null;

export const getP2PWithdrawalStatusWebSocket = (): P2PWithdrawalStatusWebSocket => {
  if (!p2pWithdrawalStatusWSInstance) {
    p2pWithdrawalStatusWSInstance = new P2PWithdrawalStatusWebSocket();
  }
  return p2pWithdrawalStatusWSInstance;
};
