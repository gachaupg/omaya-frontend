import { API_CONFIG } from "@/lib/appConfig";
import {
  SingletonWebSocket,
  WebSocketMessage as BaseWebSocketMessage,
} from "@/lib/utils/baseWebSocket";

// WebSocket message for payment_detail_updated
export interface PaymentDetailUpdatedData {
  id: string;
  provider: {
    id: string;
    name: string;
    method: string;
    logo: string;
  };
  account_name: string;
  account_number: string | null;
  wallet_address: string | null;
  status: string;
  rejection_reason: string | null;
  allow_auto_send: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebSocketMessage extends BaseWebSocketMessage {
  type: "payment_detail_updated" | "payment_detail_added" | "payment_details_list" | "connection_established" | "error";
  data: PaymentDetailUpdatedData | PaymentDetailUpdatedData[] | { message?: string; connection_id?: string };
}

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

/**
 * UserPaymentDetailsWebSocket - WebSocket for real-time payment detail updates
 *
 * When payment_detail_updated is received, the consumer should refetch user payment details.
 */
export class UserPaymentDetailsWebSocket extends SingletonWebSocket<{ token: string }> {
  private lastToken: string = "";
  // Use different names to avoid shadowing base class handlers (prevents infinite recursion)
  private paymentMessageHandlers: Set<MessageHandler> = new Set();
  private paymentErrorHandlers: Set<ErrorHandler> = new Set();
  private paymentCloseHandlers: Set<CloseHandler> = new Set();
  private paymentOpenHandlers: Set<OpenHandler> = new Set();

  constructor() {
    super({
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      pingInterval: 30000,
      loggerModule: "user-payment-details",
      validateToken: true,
    });

    super.onMessage((baseMessage) => {
      const wsMessage = baseMessage as unknown as WebSocketMessage;
      this.paymentMessageHandlers.forEach((handler) => handler(wsMessage));
    });

    super.onError((error) => {
      this.paymentErrorHandlers.forEach((handler) => handler(error));
    });

    super.onClose(() => {
      this.paymentCloseHandlers.forEach((handler) => handler());
    });

    super.onOpen(() => {
      this.paymentOpenHandlers.forEach((handler) => handler());
    });
  }

  protected buildUrl(params: { token: string }): string {
    return API_CONFIG.PAYMENTS.SOCKETS.USER_PAYMENT_DETAILS(params.token);
  }

  protected getInstanceKey(params: { token: string }): string {
    return "user-payment-details";
  }

  protected isSameConnection(params: { token: string }): boolean {
    return this.lastToken === params.token;
  }

  override connect(params: { token: string }): void {
    this.lastToken = params.token;
    super.connect(params);
  }

  override onMessage(handler: MessageHandler): () => void {
    this.paymentMessageHandlers.add(handler);
    return () => this.paymentMessageHandlers.delete(handler);
  }

  override onError(handler: ErrorHandler): () => void {
    this.paymentErrorHandlers.add(handler);
    return () => this.paymentErrorHandlers.delete(handler);
  }

  override onClose(handler: CloseHandler): () => void {
    this.paymentCloseHandlers.add(handler);
    return () => this.paymentCloseHandlers.delete(handler);
  }

  override onOpen(handler: OpenHandler): () => void {
    this.paymentOpenHandlers.add(handler);
    return () => this.paymentOpenHandlers.delete(handler);
  }
}

let userPaymentDetailsWSInstance: UserPaymentDetailsWebSocket | null = null;

export const getUserPaymentDetailsWebSocket = (): UserPaymentDetailsWebSocket => {
  if (!userPaymentDetailsWSInstance) {
    userPaymentDetailsWSInstance = new UserPaymentDetailsWebSocket();
  }
  return userPaymentDetailsWSInstance;
};

export const cleanupUserPaymentDetailsWebSocket = (): void => {
  if (userPaymentDetailsWSInstance) {
    userPaymentDetailsWSInstance.disconnect();
    userPaymentDetailsWSInstance = null;
  }
};
