"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, MessageCircle, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLiveChatWebSocket } from "../hooks/useLiveChatWebSocket";
import {
  createChatSession,
  getChatMessages,
  reopenChatSession,
  normalizeChatMessage,
  isSessionChatClosed,
  type ChatSession,
} from "../services/liveChatApi";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import { logger } from "@/lib/utils/logger";

const LiveChatPage: React.FC = () => {
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [wsConnectionKey, setWsConnectionKey] = useState(0);
  const [messageInput, setMessageInput] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const closedHistoryLoadedRef = useRef(false);

  const sessionClosed = isSessionChatClosed(session);

  const {
    isConnected,
    messages,
    isTyping,
    sendMessage,
    disconnect,
    setInitialMessages,
  } = useLiveChatWebSocket({
    sessionId: sessionId || "",
    connectionKey: wsConnectionKey,
    enabled: !!sessionId && !sessionClosed,
    onMessage: (message) => {
      logger.debug("live-chat", "Message received:", message);
    },
    onChatHistory: (data) => {
      if (data.status) {
        setSession((prev) =>
          prev ? { ...prev, status: data.status as ChatSession["status"] } : prev
        );
      }
    },
    onChatClosed: () => {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: "closed",
              closed_at: prev.closed_at || new Date().toISOString(),
            }
          : null
      );
    },
    onError: (error) => {
      logger.debug("live-chat", "WebSocket error:", error);
    },
    onClose: () => {
      logger.debug("live-chat", "WebSocket closed");
    },
    autoReconnect: true,
  });
  const isChatOpenForMessaging =
    !sessionClosed && session?.status === "active" && isConnected;

  const applySessionMessagesStable = useCallback(
    (sess: ChatSession | null) => {
      if (sess?.messages?.length) {
        setTimeout(() => {
          setInitialMessages(sess.messages!.map(normalizeChatMessage));
        }, 0);
      }
    },
    [setInitialMessages]
  );

  useEffect(() => {
    if (!sessionClosed) closedHistoryLoadedRef.current = false;
  }, [sessionClosed]);

  useEffect(() => {
    if (!sessionId || !sessionClosed || closedHistoryLoadedRef.current) return;
    closedHistoryLoadedRef.current = true;
    getChatMessages(sessionId)
      .then((r) => {
        if (r.messages?.length) {
          setInitialMessages(r.messages.map(normalizeChatMessage));
        }
      })
      .catch(() => {
        closedHistoryLoadedRef.current = false;
      });
  }, [sessionId, sessionClosed, setInitialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!sessionId && !isCreatingSession) {
      handleCreateSession();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionId && isConnected && !isLoadingHistory) {
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
    setStatusBanner(null);
    try {
      const response = await createChatSession();
      setSession(response.session);
      setSessionId(response.session.session_id);
      applySessionMessagesStable(response.session);
      if (response.message) {
        setStatusBanner(response.message);
        setTimeout(() => setStatusBanner(null), 5000);
      }
      logger.debug("live-chat", "Session ready:", response.session);
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
      if (response.messages?.length) {
        setInitialMessages(response.messages.map(normalizeChatMessage));
      }
    } catch (error: any) {
      logger.error("live-chat", "Failed to load chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReopenChat = async () => {
    if (!sessionId) return;
    setIsReopening(true);
    setStatusBanner(null);
    try {
      const res = await reopenChatSession(sessionId);
      setSession(res.session);
      setWsConnectionKey((k) => k + 1);
      if (res.session.messages?.length) {
        setTimeout(() => {
          setInitialMessages(res.session.messages!.map(normalizeChatMessage));
        }, 0);
      } else {
        loadChatHistory();
      }
      setStatusBanner(res.message || "Chat reopened");
      setTimeout(() => setStatusBanner(null), 6000);
    } catch (error: any) {
      logger.error("live-chat", "Reopen failed:", error);
      setStatusBanner(
        error?.response?.data?.message || "Could not reopen chat. Try again."
      );
    } finally {
      setIsReopening(false);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isChatOpenForMessaging) return;

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

  const subtitle = sessionClosed
    ? "Chat ended"
    : session?.status === "waiting"
      ? "Waiting for an agent…"
      : session?.status === "active"
        ? session.agent_name
          ? `Agent: ${session.agent_name}`
          : "Connected"
        : isConnected
          ? "Connected"
          : "Connecting…";

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--bg-color)] flex flex-col pt-16 md:pt-20">
      <div className="w-full max-w-5xl mx-auto flex flex-col flex-1 px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between py-2 sm:py-2.5 border-b border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#1D1D23] sticky top-16 md:top-20 z-10 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
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
                <div className="flex items-center justify-between gap-3 min-w-0 mt-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        sessionClosed
                          ? "bg-gray-400"
                          : isConnected
                            ? "bg-green-500"
                            : "bg-amber-500"
                      }`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {subtitle}
                    </span>
                  </div>
                  {sessionId && (
                    <button
                      type="button"
                      onClick={handleReopenChat}
                      disabled={!sessionClosed || isReopening}
                      className="inline-flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-xl bg-[#1D8751] text-white text-xs font-medium hover:bg-[#166b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      {isReopening ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      {isReopening ? "Reopening…" : "Reopen"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {statusBanner && (
          <div className="py-2 bg-[#1D8751]/10 border-b border-[#1D8751]/20 text-sm text-[#166b42] dark:text-[#7dd89a] text-center -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
            {statusBanner}
          </div>
        )}

        {/* Reopen button is shown in header when closed */}

        <div className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-3 bg-gray-50 dark:bg-[#15161D] -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 rounded-none">
        {isCreatingSession ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1D8751] mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Starting chat session...
              </p>
            </div>
          </div>
        ) : isLoadingHistory ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <Loader2 className="w-6 h-6 animate-spin text-[#1D8751]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sessionClosed
                  ? "Reopen the chat to send new messages."
                  : "Start the conversation by sending a message"}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSystem =
              message.sender_role === "system" ||
              message.is_system_message === true ||
              message.sender_name === "System";
            const isCustomer =
              !isSystem &&
              (message.sender_role === "customer" ||
                message.sender_role === "user");
            const isSupport = !isSystem && !isCustomer;

            return (
              <div
                key={message.message_id || `${index}-${message.timestamp}`}
                className={`flex ${
                  isSystem ? "justify-center" : isCustomer ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[65%] rounded-2xl px-3 sm:px-4 py-2 ${
                    isSystem
                      ? "bg-amber-50 dark:bg-amber-900/25 text-amber-900 dark:text-amber-100 text-center border border-amber-200/60 dark:border-amber-800/40"
                      : isCustomer
                        ? "bg-[#1D8751] text-white rounded-br-md shadow-sm"
                        : "bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-bl-md shadow-sm"
                  }`}
                >
                  {!isSystem && (
                    <div
                      className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 ${
                        isCustomer
                          ? "text-white/85 text-right"
                          : "text-[#1D8751] dark:text-[#7dd89a]"
                      }`}
                    >
                      {isCustomer ? "You" : "Support"}
                      {isSupport && message.sender_name && message.sender_name !== "Support" ? (
                        <span className="font-normal normal-case text-gray-600 dark:text-gray-300 ml-1">
                          · {message.sender_name}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.message}
                  </div>
                  <div
                    className={`text-[10px] sm:text-xs mt-1 ${
                      isSystem
                        ? "text-amber-700 dark:text-amber-300"
                        : isCustomer
                          ? "text-white/70 text-right"
                          : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isTyping?.isTyping && !sessionClosed && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#2A3441] rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                  {isTyping.userName} is typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 dark:border-[#35353E] py-2.5 sm:py-3 bg-white dark:bg-[#1D1D23] sticky bottom-0 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
          <div className="flex gap-2 w-full items-end">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              sessionClosed
                ? "Reopen chat to send messages…"
                : session?.status !== "active"
                  ? "Wait for an agent to open the chat…"
                : "Type your message..."
            }
            disabled={!isChatOpenForMessaging || isCreatingSession}
            rows={1}
            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-[#35353E] rounded-lg resize-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent outline-none bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[40px] max-h-[120px] overflow-y-auto"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={
              !messageInput.trim() ||
              !isChatOpenForMessaging ||
              isCreatingSession ||
              sessionClosed
            }
            className="px-3 sm:px-4 py-2 h-[40px] bg-[#1D8751] text-white rounded-lg hover:bg-[#166b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Send message"
          >
            {isChatOpenForMessaging ? (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" />
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LiveChatPage;
