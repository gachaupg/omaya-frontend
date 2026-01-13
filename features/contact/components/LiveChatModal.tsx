"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { useLiveChatWebSocket } from "../hooks/useLiveChatWebSocket";
import { createChatSession, getChatMessages, ChatSession, ChatMessage } from "../services/liveChatApi";
import { showToast } from "@/lib/utils/toast";
import { logger } from "@/lib/utils/logger";

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveChatModal: React.FC<LiveChatModalProps> = ({ isOpen, onClose }) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    messages,
    isTyping,
    sendMessage,
    disconnect,
    setInitialMessages,
  } = useLiveChatWebSocket({
    sessionId: sessionId || "",
    enabled: isOpen && !!sessionId,
    onMessage: (message) => {
      logger.debug("live-chat", "Message received:", message);
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

  // Create session when modal opens
  useEffect(() => {
    if (isOpen && !sessionId && !isCreatingSession) {
      handleCreateSession();
    }

    return () => {
      if (!isOpen) {
        disconnect();
        setSessionId(null);
        setSession(null);
      }
    };
  }, [isOpen]);

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
      setSession(response.session);
      setSessionId(response.session.session_id);
      logger.debug("live-chat", "Session created:", response.session);
    } catch (error: any) {
      logger.error("live-chat", "Failed to create session:", error);
      showToast.error(error?.response?.data?.message || "Failed to start chat session");
      onClose();
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1D1D23] rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] max-h-[600px] flex flex-col border border-gray-200 dark:border-[#35353E]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-[#35353E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1D8751] rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Chat Support
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isConnected
                    ? session?.status === "waiting"
                      ? `Waiting for agent... (Position: ${session.queue_position || 0})`
                      : session?.agent_name
                      ? `Connected to ${session.agent_name}`
                      : "Connected"
                    : "Connecting..."}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
                    className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-4 py-2 ${
                      isSystem
                        ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 mx-auto text-center"
                        : isUser
                        ? "bg-[#1D8751] text-white"
                        : "bg-gray-100 dark:bg-[#2A2A2A] text-gray-900 dark:text-white"
                    }`}
                  >
                    {!isSystem && (
                      <div
                        className={`text-xs font-medium mb-1 ${
                          isUser
                            ? "text-white/80"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.sender_name}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
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
              <div className="bg-gray-100 dark:bg-[#2A2A2A] rounded-2xl px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {isTyping.userName} is typing...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-[#35353E] p-4 sm:p-6">
          <div className="flex gap-2">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!isConnected || isCreatingSession}
              rows={2}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#35353E] rounded-xl resize-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected || isCreatingSession}
              className="px-4 sm:px-6 py-2 bg-[#1D8751] text-white rounded-xl hover:bg-[#166b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[50px]"
            >
              {isConnected ? (
                <Send className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveChatModal;

