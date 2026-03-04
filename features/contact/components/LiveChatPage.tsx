"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, MessageCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLiveChatWebSocket } from "../hooks/useLiveChatWebSocket";
import { createChatSession, getChatMessages, ChatSession, ChatMessage } from "../services/liveChatApi";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import { logger } from "@/lib/utils/logger";

const LiveChatPage: React.FC = () => {
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    connectionFailed,
    retryConnection,
    messages,
    isTyping,
    sendMessage,
    disconnect,
    setInitialMessages,
  } = useLiveChatWebSocket({
    sessionId: sessionId || "",
    enabled: !!sessionId,
    onMessage: (message) => {
      logger.debug("live-chat", "Message received:", message);
    },
    onChatHistory: (data) => {
      if (data.status) {
        setSession((prev) => (prev ? { ...prev, status: data.status as "waiting" | "active" | "closed" } : prev));
      }
    },
    onError: (error) => {
      logger.debug("live-chat", "WebSocket error:", error);
      // Don't show toast for connection errors - they're handled by auto-reconnect
    },
    onClose: () => {
      logger.debug("live-chat", "WebSocket closed");
    },
    autoReconnect: true,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create session on mount
  useEffect(() => {
    if (!sessionId && !isCreatingSession) {
      handleCreateSession();
    }

    return () => {
      disconnect();
    };
  }, []);

  // Load chat history as fallback if WebSocket doesn't send it
  useEffect(() => {
    if (sessionId && isConnected && !isLoadingHistory) {
      // Wait a bit for WebSocket to send history, then fallback to API if no messages
      const timer = setTimeout(() => {
        if (messages.length === 0) {
          loadChatHistory();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isConnected]);

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const response = await createChatSession();
      const sessionData = (response as any).session;
      setSession(sessionData);
      setSessionId(sessionData.session_id);
      // Load existing messages from session if present (e.g. "already have session" response)
      const existingMessages = (response as any).session?.messages;
      if (Array.isArray(existingMessages) && existingMessages.length > 0) {
        const mapped: ChatMessage[] = existingMessages.map((m: any) => ({
          sender_name: m.is_system_message ? "System" : (m.sender_name || "Unknown"),
          sender_role: (m.sender_role === "customer" ? "user" : m.sender_role === "admin" ? "agent" : m.sender_role || "agent") as "user" | "agent",
          message: m.message || "",
          timestamp: m.timestamp || new Date().toISOString(),
        }));
        setInitialMessages(mapped);
      }
      logger.debug("live-chat", "Session ready:", sessionData);
    } catch (error: any) {
      logger.error("live-chat", "Failed to create session:", error);
      setAuthRedirectPath("/live-chat");
      router.push("/auth/login");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const loadChatHistory = async () => {
    if (!sessionId) return;

    setIsLoadingHistory(true);
    try {
      const response = await getChatMessages(sessionId);
      logger.debug("live-chat", "Chat history loaded:", response.messages);
      
      // Set initial messages from API response
      if (response.messages && response.messages.length > 0) {
        setInitialMessages(response.messages);
      }
    } catch (error: any) {
      logger.error("live-chat", "Failed to load chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isConnected) return;

    sendMessage(messageInput.trim());
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--bg-color)] flex flex-col pt-16 md:pt-20">
      {/* Chat Area - centered with margins */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6 sm:px-8 md:px-10 lg:px-12">
      {/* Header */}
      <div className="flex items-center justify-between py-2 sm:py-2.5 px-4 sm:px-5 border-b border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] sticky top-16 md:top-20 z-10">
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <button
            onClick={() => router.back()}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#1D8751] rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate leading-tight">
                Live Chat Support
              </h2>
              <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isConnected ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
               
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-[#15161D] space-y-3">
        {isCreatingSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1D8751] mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Starting chat session...
              </p>
            </div>
          </div>
        ) : isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#1D8751]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUser = message.sender_role === "user";
            const isSystem = message.sender_name === "System";

            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] sm:max-w-[60%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 ${
                    isSystem
                      ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 mx-auto text-center"
                      : isUser
                      ? "bg-[#1D8751] text-white"
                      : "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white border border-gray-200 dark:border-[#35353E]"
                  }`}
                >
                  {!isSystem && (
                    <div
                      className={`text-xs font-medium mb-0.5 ${
                        isUser
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {message.sender_name}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.message}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isSystem
                        ? "text-yellow-600 dark:text-yellow-300"
                        : isUser
                        ? "text-white/70"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isTyping?.isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#2A2A2A] rounded-xl px-3 py-1.5 border border-gray-200 dark:border-[#35353E]">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                  {isTyping.userName} is typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-[#35353E] p-4 sm:p-5 md:p-6 bg-white dark:bg-[#1D1D23]">
        {connectionFailed && (
          <div className="flex items-center justify-between gap-3 mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <p className="text-sm text-amber-800 dark:text-amber-200">Could not connect. Please try again.</p>
            <button
              type="button"
              onClick={retryConnection}
              className="shrink-0 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        <div className="flex gap-2 w-full items-end">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCreatingSession ? "Starting session..." : !isConnected ? "Connecting..." : "Type your message..."}
            disabled={isCreatingSession}
            rows={1}
            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-[#35353E] rounded-lg resize-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[40px] max-h-[120px] overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected || isCreatingSession}
            className="px-3 sm:px-4 py-2 h-[40px] bg-[#1D8751] text-white rounded-lg hover:bg-[#166b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
            aria-label={!isConnected ? "Connecting..." : "Send message"}
            title={!isConnected ? "Waiting for connection" : "Send message"}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LiveChatPage;

