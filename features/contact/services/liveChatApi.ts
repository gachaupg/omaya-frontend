import { API_CONFIG } from "@/lib/appConfig";
import { apiClient } from "@/lib/apiClient";
import { logger } from "@/lib/utils/logger";

export interface ChatSession {
  session_id: string;
  status: "waiting" | "active" | "closed";
  queue_position?: number;
  created_at: string;
  agent_name?: string;
}

export interface ChatMessage {
  sender_name: string;
  sender_role: "user" | "agent";
  message: string;
  timestamp: string;
}

export interface CreateSessionResponse {
  message: string;
  session: ChatSession;
}

export interface SessionDetailsResponse {
  session: ChatSession;
}

export interface MessagesResponse {
  messages: ChatMessage[];
}

export interface QueueStatusResponse {
  waiting_count: number;
  average_wait_time: number;
}

/**
 * Create a new chat session, or reuse existing session if backend returns "already have session"
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
    // Backend may return 409/400 "You already have an active chat session" with session in body
    const data = error?.response?.data;
    if (data?.session?.session_id) {
      logger.debug("live-chat", "Using existing session:", data.session);
      return {
        message: data.message || "Existing session",
        session: {
          session_id: data.session.session_id,
          status: data.session.status,
          queue_position: data.session.queue_position,
          created_at: data.session.created_at,
          agent_name: data.session.agent_name,
        },
      };
    }
    logger.error("live-chat", "Failed to create chat session:", error);
    throw error;
  }
};

/**
 * Get session details
 */
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

/**
 * Get chat history/messages
 */
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

/**
 * Get queue status (public endpoint)
 */
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




