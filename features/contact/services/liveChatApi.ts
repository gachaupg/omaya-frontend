import { API_CONFIG } from "@/lib/appConfig";
import { apiClient } from "@/lib/apiClient";
import { logger } from "@/lib/utils/logger";

export interface ChatSession {
  session_id: string;
  status: "waiting" | "active" | "closed" | string;
  queue_position?: number;
  created_at?: string;
  queued_at?: string;
  agent_name?: string;
  assigned_agent?: number;
  closed_at?: string | null;
  close_reason?: string | null;
  messages?: ApiChatMessage[];
  user_name?: string;
  user_email?: string;
}

/** Raw message from API / WebSocket history */
export interface ApiChatMessage {
  message_id?: string;
  sender_name?: string;
  sender_role?: string;
  sender_type?: string;
  message?: string;
  timestamp?: string;
  is_system_message?: boolean;
}

export interface ChatMessage {
  sender_name: string;
  /** customer = you; support = agent */
  sender_role: "customer" | "support" | "system" | "user" | "agent";
  sender_type?: string;
  message: string;
  timestamp: string;
  is_system_message?: boolean;
  message_id?: string;
}

export interface CreateSessionResponse {
  message: string;
  session: ChatSession;
}

export interface SessionDetailsResponse {
  session: ChatSession;
}

export interface MessagesResponse {
  messages: ApiChatMessage[];
}

export interface QueueStatusResponse {
  waiting_count: number;
  average_wait_time: number;
}

export interface ReopenSessionResponse {
  message: string;
  session: ChatSession;
}

/** Map API/WebSocket message to UI message (customer vs support) */
export function normalizeChatMessage(m: ApiChatMessage): ChatMessage {
  if (m.is_system_message) {
    return {
      sender_name: m.sender_name || "System",
      sender_role: "system",
      message: m.message || "",
      timestamp: m.timestamp || new Date().toISOString(),
      is_system_message: true,
      message_id: m.message_id,
    };
  }
  const role = (m.sender_role || "").toLowerCase();
  const type = (m.sender_type || "").toLowerCase();
  const isCustomer =
    role === "customer" ||
    role === "user" ||
    type === "customer";

  return {
    sender_name: m.sender_name || (isCustomer ? "You" : "Support"),
    sender_role: isCustomer ? "customer" : "support",
    sender_type: type || undefined,
    message: m.message || "",
    timestamp: m.timestamp || new Date().toISOString(),
    message_id: m.message_id,
  };
}

/**
 * Create a new chat session. If the API returns an existing session (e.g. 400
 * "You already have an active chat session"), that session is returned instead of throwing.
 */
export const createChatSession = async (): Promise<CreateSessionResponse> => {
  try {
    const response = await apiClient.post<CreateSessionResponse>(
      API_CONFIG.LIVE_CHAT.CREATE_SESSION,
      {}
    );
    logger.debug("live-chat", "Chat session created:", response.data);
    return response.data;
  } catch (error: any) {
    const data = error?.response?.data;
    if (data?.session?.session_id) {
      logger.debug("live-chat", "Using existing session from API:", data.message);
      return {
        message: data.message || "",
        session: data.session as ChatSession,
      };
    }
    logger.error("live-chat", "Failed to create chat session:", error);
    throw error;
  }
};

/**
 * Reopen a closed chat session (no body).
 */
export const reopenChatSession = async (
  sessionId: string
): Promise<ReopenSessionResponse> => {
  try {
    const response = await apiClient.post<ReopenSessionResponse>(
      API_CONFIG.LIVE_CHAT.REOPEN_SESSION(sessionId)
    );
    logger.debug("live-chat", "Session reopened:", response.data);
    return response.data;
  } catch (error: any) {
    const data = error?.response?.data;
    if (data?.session?.session_id) {
      return {
        message: data.message || "",
        session: data.session as ChatSession,
      };
    }
    throw error;
  }
};

export const getSessionDetails = async (
  sessionId: string
): Promise<SessionDetailsResponse> => {
  try {
    const response = await apiClient.get<SessionDetailsResponse>(
      API_CONFIG.LIVE_CHAT.GET_SESSION(sessionId)
    );
    return response.data;
  } catch (error: any) {
    logger.error("live-chat", "Failed to get session details:", error);
    throw error;
  }
};

export const getChatMessages = async (
  sessionId: string
): Promise<MessagesResponse> => {
  try {
    const response = await apiClient.get<MessagesResponse>(
      API_CONFIG.LIVE_CHAT.GET_MESSAGES(sessionId)
    );
    return response.data;
  } catch (error: any) {
    logger.error("live-chat", "Failed to get chat messages:", error);
    throw error;
  }
};

export const getQueueStatus = async (): Promise<QueueStatusResponse> => {
  try {
    const response = await apiClient.get<QueueStatusResponse>(
      API_CONFIG.LIVE_CHAT.QUEUE_STATUS
    );
    return response.data;
  } catch (error: any) {
    logger.error("live-chat", "Failed to get queue status:", error);
    throw error;
  }
};

export function isSessionChatClosed(session: ChatSession | null): boolean {
  if (!session) return false;
  const s = String(session.status || "").toLowerCase();
  if (s === "closed" || s === "inactive" || s === "ended") return true;
  if (session.closed_at != null && session.closed_at !== "") return true;
  return false;
}
