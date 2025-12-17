"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useGroupedMessages } from "@/features/p2p/hooks/useGroupedMessages";
import { GroupedUser, postTradeMessage } from "@/features/p2p/api";
import { getTradeMessagesWebSocket, cleanupTradeMessagesWebSocket } from "@/features/p2p/services/tradeMessagesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import Link from "next/link";

interface ConversationItemProps {
  group: any;
  displayName: string;
  photoUrl: string | null;
  latestMessage: any;
  isActive: boolean;
  unreadCount: number;
  onSelect: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  displayName,
  photoUrl,
  latestMessage,
  isActive,
  unreadCount,
  onSelect,
  group,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        isActive
          ? "bg-gray-100 dark:bg-[#111827] border border-[#1D8751]"
          : "bg-transparent hover:bg-gray-50 dark:hover:bg-[#111827]/60 border border-transparent"
      }`}
    >
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#1D8751] flex items-center justify-center text-xs font-bold text-white overflow-hidden relative">
          {photoUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <span className="text-white font-medium text-xs absolute">
                  {getInitials(displayName)}
                </span>
              )}
              <img
                src={photoUrl}
                alt={displayName}
                className={`w-full h-full object-cover ${imageLoaded ? "block" : "hidden"}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            </>
          ) : (
            <span className="text-white font-medium text-xs">
              {getInitials(displayName)}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-[#9CA3AF] ml-2 flex-shrink-0">
            {latestMessage?.timestamp
              ? formatTimestamp(latestMessage.timestamp)
              : ""}
          </span>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-[#9CA3AF] truncate">
          {latestMessage?.content ||
            latestMessage?.message ||
            "No messages yet"}
        </p>
      </div>
      {unreadCount > 0 && (
        <div className="flex-shrink-0 ml-2">
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#1D8751] text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        </div>
      )}
    </button>
  );
};

export const Chats: React.FC = () => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  const { groupedUsers, loading, error, refetch } = useGroupedMessages({
    enabled: isAuthenticated,
    limit: 100,
    // Disable automatic polling so the page never reloads on a timer;
    // updates now come from WebSocket events + manual refetch.
    refetchInterval: undefined,
  });

  const [selectedUser, setSelectedUser] = useState<GroupedUser | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Check localStorage for terms acceptance on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const accepted = localStorage.getItem("p2p_terms_accepted");
      if (accepted === "true") {
        setTermsAccepted(true);
      }
    }
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const wsRef = useRef<any>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, any[]>>(new Map());
  const justAddedOptimisticRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevSelectedUserIdRef = useRef<string | null>(null);

  // Track when initial data has been loaded at least once so we don't "reload"
  // the whole page with a spinner on subsequent background fetches.
  useEffect(() => {
    if (!hasLoadedOnce && (groupedUsers || error)) {
      setHasLoadedOnce(true);
    }
  }, [groupedUsers, error, hasLoadedOnce]);

  useEffect(() => {
    if (!selectedUser && groupedUsers && groupedUsers.length > 0) {
      setSelectedUser(groupedUsers[0]);
    }
  }, [groupedUsers, selectedUser]);

  // Compute displayed messages by merging real messages with optimistic ones
  const displayedMessages = useMemo(() => {
    if (!selectedUser || !selectedUser.entity_id) return [];
    
    const realMessages = selectedUser.messages || [];
    const optimistic = optimisticMessages.get(selectedUser.entity_id) || [];
    
    // Filter out optimistic messages that have been replaced by real ones
    const filteredOptimistic = optimistic.filter((optMsg) => {
      // Check if a real message with same content exists (sent within 10 seconds)
      const hasRealMatch = realMessages.some((realMsg) => {
        const sameContent = realMsg.content === optMsg.content;
        const timeDiff = Math.abs(
          new Date(realMsg.timestamp).getTime() - new Date(optMsg.timestamp).getTime()
        );
        return sameContent && timeDiff < 10000; // Within 10 seconds
      });
      return !hasRealMatch; // Keep if no real match found
    });
    
    // Clean up replaced optimistic messages
    if (filteredOptimistic.length !== optimistic.length) {
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        const entityId = selectedUser.entity_id;
        if (filteredOptimistic.length === 0) {
          newMap.delete(entityId);
        } else {
          newMap.set(entityId, filteredOptimistic);
        }
        return newMap;
      });
    }
    
    return [...realMessages, ...filteredOptimistic];
  }, [selectedUser?.messages, selectedUser?.entity_id, optimisticMessages]);

  // Auto-scroll to bottom when chat is opened or messages change
  useEffect(() => {
    const currentEntityId = selectedUser?.entity_id || null;
    
    // If chat changed, scroll to bottom
    if (currentEntityId !== prevSelectedUserIdRef.current) {
      prevSelectedUserIdRef.current = currentEntityId;
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    } else if (displayedMessages.length > 0) {
      // If messages updated, scroll to bottom (but only if user is near bottom)
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          }, 50);
        }
      }
    }
  }, [selectedUser?.entity_id, displayedMessages.length]);

  // Update selectedUser when groupedUsers updates (to get new messages)
  // Only update messages, don't replace entire object to avoid reload
  useEffect(() => {
    if (justAddedOptimisticRef.current) {
      // Skip update if we just added an optimistic message
      return;
    }
    
    if (selectedUser && selectedUser.entity_id && groupedUsers) {
      const updatedUser = groupedUsers.find(
        (user) => user.entity_id === selectedUser.entity_id
      );
      if (updatedUser && updatedUser.messages) {
        // Only update if messages actually changed to avoid unnecessary re-renders
        const currentMessageIds = (selectedUser.messages || []).map(m => m.id).join(',');
        const newMessageIds = updatedUser.messages.map(m => m.id).join(',');
        
        if (currentMessageIds !== newMessageIds) {
          // Merge messages instead of replacing entire object
          setSelectedUser(prev => prev ? {
            ...prev,
            messages: updatedUser.messages
          } : updatedUser);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedUsers]);


  // WebSocket connection for selected user
  useEffect(() => {
    if (!selectedUser || !selectedUser.entity_id || !isAuthenticated) {
      return;
    }

    const getAccessToken = (): string | null => {
      const cookieToken = cookieUtils.getCookie("access_token");
      if (cookieToken) return cookieToken;
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("access_token");
        if (localToken) return localToken;
      }
      return null;
    };

    const token = getAccessToken();
    if (!token || !token.includes(".")) {
      return;
    }

    // Get WebSocket instance for this entity_id (trade_id)
    const ws = getTradeMessagesWebSocket(selectedUser.entity_id);
    wsRef.current = ws;

    // Connect WebSocket
    ws.connect(selectedUser.entity_id, token);

    // Handle incoming messages
    const unsubscribeMessage = ws.onMessage((message: any) => {
      if (message.type === "new_message" || message.type === "message_received") {
        // Message received - the grouped messages will update via the hook
        // The useEffect above will handle updating selectedUser messages without full reload
        // No need to manually refetch here as useGroupedMessages will poll periodically
      }
    });

    return () => {
      unsubscribeMessage();
      // Don't cleanup WebSocket here as it might be used elsewhere
      // cleanupTradeMessagesWebSocket(selectedUser.entity_id);
    };
  }, [selectedUser?.entity_id, isAuthenticated]);

  const conversations = useMemo(() => groupedUsers || [], [groupedUsers]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  const getDisplayName = (userGroup: GroupedUser) => {
    if (userGroup.message_type === "p2p") {
      return (
        userGroup.peer_name ||
        userGroup.peer_email?.split("@")[0] ||
        "Unknown"
      );
    }
    if (userGroup.message_type === "support") {
      return "Support";
    }
    return (
      (userGroup as any).sender_name ||
      (userGroup as any).sender_email?.split("@")[0] ||
      "Unknown"
    );
  };

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((group: any) => {
      // Search by display name (sender/buyer name)
      const displayName = getDisplayName(group)?.toLowerCase?.() || "";
      
      // Search by peer name (for P2P conversations)
      const peerName = (group.peer_name || "").toString().toLowerCase();
      
      // Search by sender name
      const senderName = ((group as any).sender_name || "").toString().toLowerCase();
      
      // Search by emails
      const peerEmail = (group.peer_email || "").toString().toLowerCase();
      const senderEmail = ((group as any).sender_email || "").toString().toLowerCase();

      return (
        displayName.includes(term) ||
        peerName.includes(term) ||
        senderName.includes(term) ||
        peerEmail.includes(term) ||
        senderEmail.includes(term)
      );
    });
  }, [conversations, searchTerm]);

  const getPhotoUrl = (userGroup: GroupedUser, latestMessage: any) => {
    if (userGroup.message_type === "p2p") {
      return (userGroup as any).peer_photo || null;
    }
    return latestMessage?.sender_photo || (userGroup as any).sender_photo || null;
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser || !termsAccepted || isSending) {
      return;
    }

    if (!selectedUser.entity_id) {
      console.error("No entity_id (trade_id) available");
      return;
    }

    const messageContent = messageInput.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      message: messageContent,
      sender_id: user?.id || 0,
      sender_email: user?.email || "",
      sender_name: user?.email || "",
      timestamp: new Date().toISOString(),
      isOptimistic: true, // Flag to identify optimistic messages
    };

    // Add optimistic message immediately - this will be picked up by displayedMessages useMemo
    setOptimisticMessages((prev) => {
      const newMap = new Map(prev);
      const entityId = selectedUser.entity_id;
      const existing = newMap.get(entityId) || [];
      // Check if already exists to avoid duplicates
      if (existing.some(msg => msg.id === tempId)) {
        return prev;
      }
      newMap.set(entityId, [...existing, optimisticMessage]);
      return newMap;
    });
    
    // Set flag to prevent useEffect from overwriting selectedUser immediately
    justAddedOptimisticRef.current = true;
    setTimeout(() => {
      justAddedOptimisticRef.current = false;
    }, 500);

    // Clear input immediately for better UX
    setMessageInput("");
    setIsSending(true);

    try {
      // Send via HTTP POST API (same as ChatBox in orders page)
      await postTradeMessage(selectedUser.entity_id, {
        message: messageContent,
        uploaded_images: [], // No image support in chats yet
        sender_name: user?.email || "",
      });

      // Immediately refetch to get the real message
      refetch();

      // Remove optimistic message after a short delay
      setTimeout(() => {
        setOptimisticMessages((prev) => {
          const newMap = new Map(prev);
          const entityId = selectedUser.entity_id;
          const existing = newMap.get(entityId) || [];
          const filtered = existing.filter((msg) => msg.id !== tempId);
          if (filtered.length === 0) {
            newMap.delete(entityId);
          } else {
            newMap.set(entityId, filtered);
          }
          return newMap;
        });
      }, 1000); // Remove after 1 second, real message should be in by then
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Remove optimistic message on error
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        const entityId = selectedUser.entity_id;
        const existing = newMap.get(entityId) || [];
        const filtered = existing.filter((msg) => msg.id !== tempId);
        if (filtered.length === 0) {
          newMap.delete(entityId);
        } else {
          newMap.set(entityId, filtered);
        }
        return newMap;
      });

      // Restore message in input so user can retry
      setMessageInput(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessages = () => {
    if (!selectedUser) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-gray-600 dark:text-[#A2A4A9]">
          Select a conversation on the left to start chatting.
        </div>
      );
    }

    // Use displayedMessages which includes optimistic messages
    const allMessages = displayedMessages;
    
    // Check if chat is closed - only show if status is "Complete"/"completed" or "Responded"/"responded"
    const chatStatus = selectedUser ? (selectedUser as any).status : null;
    const normalizedStatus = chatStatus ? String(chatStatus).toLowerCase() : null;
    const isChatClosed = normalizedStatus === "complete" || normalizedStatus === "responded";
    
    if (allMessages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-gray-600 dark:text-[#A2A4A9]">
          Select a conversation on the left to start chatting.
        </div>
      );
    }

    return (
      <div 
        ref={messagesContainerRef}
        className="flex flex-col gap-1 px-4 py-4 overflow-y-auto max-h-[calc(100vh-260px)]"
      >
        {allMessages
          .slice()
          .reverse()
          .map((msg: any, index: number) => {
            // Determine if this message is from the logged-in user
            // Compare by sender_id first (most reliable), then by email as fallback
            const isSender = 
              (user?.id && msg.sender_id && msg.sender_id === user.id) ||
              (user?.email && msg.sender_email && 
                msg.sender_email.trim().toLowerCase() === user.email.trim().toLowerCase());
            
            // Extract display name from sender_name or sender_email
            const displayName = msg.sender_name || 
              (msg.sender_email ? msg.sender_email.split('@')[0] : "Unknown User");

            return (
              <div
                key={msg.id || index}
                className={`flex w-full ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    isSender
                      ? "bg-[#1D8751] text-white rounded-lg px-2.5 py-1 max-w-[85%] sm:max-w-xs min-w-[100px] sm:min-w-[120px]"
                      : "bg-gray-200 dark:bg-[#35353E] text-gray-900 dark:text-white rounded-lg px-2.5 py-1 max-w-[85%] sm:max-w-xs min-w-[100px] sm:min-w-[120px]"
                  }
                >
                  {/* Show sender username - "You" for own messages, username for their messages */}
                  <div className={`text-xs font-semibold mb-0 ${isSender ? "text-green-100" : "text-gray-900 dark:text-white"}`}>
                    {isSender ? "You" : displayName}
                  </div>
                  
                  {msg.content && (
                    <div className="text-xs sm:text-sm break-words mb-0.5 whitespace-pre-line">
                      {msg.content}
                    </div>
                  )}
                  
                  <div className="text-[10px] opacity-75 text-right mt-0">
                    {msg.timestamp ? formatTimestamp(msg.timestamp) : ""}
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Chat Closed Notification in messages area */}
        {isChatClosed && (
          <div className="mt-4 mb-2 bg-gray-100 dark:bg-[#2C2C34] rounded-xl p-4 border border-gray-300 dark:border-[#35353E]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-400 dark:border-gray-600 flex items-center justify-center bg-transparent">
                <svg
                  className="w-4 h-4 text-gray-600 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Chat Closed</h3>
                <p className="text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                  This chat is now closed as there are no active or pending orders.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-500 leading-relaxed mt-1">
                  Please note that the chat will automatically reopen only when there is a new order between you and this user.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">
          Please log in to view chats.
        </p>
      </div>
    );
  }

  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-600 dark:text-red-400">
          Error loading chats: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-1 sm:px-2 md:px-4 pt-0 pb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          P2P Trading Chat
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-[#A3A7BF] mt-1">
          Communicate securely with traders.
        </p>
      </div>

      <div className="flex-1 flex gap-3 sm:gap-4 min-h-[480px]">
        {/* Conversations list - Left Card */}
        <div className="w-full sm:w-80 md:w-72 lg:w-80 rounded-2xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#15161D] overflow-hidden flex flex-col">
          <div className="px-3 py-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full bg-gray-100 dark:bg-[var(--bg-color)] border border-gray-300 dark:border-[#272837] px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-[#E5E7EB] placeholder:text-gray-500 dark:placeholder:text-[#6B7280] focus:outline-none focus:border-[#1D8751]"
              />
            </div>
          </div>

          <div className="px-2 pb-2 space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {filteredConversations.length === 0 && (
              <div className="px-3 py-4 text-xs text-gray-600 dark:text-[#9CA3AF]">
                No conversations yet.
              </div>
            )}
            {filteredConversations.map((group: any) => {
              const displayName = getDisplayName(group);
              const latestMessage = group.messages?.[0];
              const isActive = Boolean(
                selectedUser && selectedUser.entity_id === group.entity_id
              );
              const unreadCount = group.messages?.length || 0;
              const photoUrl = getPhotoUrl(group, latestMessage);

              return (
                <ConversationItem
                  key={group.entity_id}
                  group={group}
                  displayName={displayName}
                  photoUrl={photoUrl}
                  latestMessage={latestMessage}
                  isActive={isActive}
                  unreadCount={unreadCount}
                  onSelect={() => setSelectedUser(group)}
                />
              );
            })}
          </div>
        </div>

        {/* Chat panel - Right Card */}
        <div className="flex-1 flex flex-col rounded-2xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#111217] overflow-hidden">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedUser && (() => {
                const latestMessage = selectedUser.messages?.[0];
                const photoUrl = getPhotoUrl(selectedUser, latestMessage);
                const displayName = getDisplayName(selectedUser);
                
                return (
                  <>
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#1D8751] flex items-center justify-center overflow-hidden relative">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const initials = displayName
                                  ? displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                                  : '?';
                                parent.innerHTML = `<span class="text-white font-medium text-xs">${initials}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-white font-medium text-xs">
                            {displayName
                              ? displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                              : '?'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {displayName}
                      </div>
                      {selectedUser.entity_id && (
                        <div className="text-[11px] text-gray-600 dark:text-[#9CA3AF] mt-0.5">
                          Chat ID: {selectedUser.entity_id}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
              {!selectedUser && (
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    No conversation selected
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms banner (only visible if not accepted) */}
          {!termsAccepted && (
            <div className="px-4 pt-4">
              <div className="rounded-2xl border border-[#1D8751] bg-green-50 dark:bg-[#042417] text-gray-900 dark:text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1D8751] flex items-center justify-center text-white text-sm font-bold">
                    P2P
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold">
                      P2P Trading Terms &amp; Conditions
                    </div>
                    <p className="text-[11px] sm:text-xs text-gray-700 dark:text-[#D1D5DB] mt-1 max-w-xl">
                      Before you start chatting, please review and accept our P2P Trading
                      Terms and Conditions. These terms ensure a safe and secure trading
                      environment for all users.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Link
                    href="/p2p/terms"
                    className="px-3 py-1.5 rounded-full border border-[#1D8751] text-[11px] sm:text-xs text-[#1D8751] dark:text-[#D1FAE5] bg-transparent hover:bg-green-100 dark:hover:bg-[#064E3B] transition-colors inline-block"
                  >
                    Read Terms &amp; Conditions
                  </Link>
                  <button
                    onClick={() => {
                      setTermsAccepted(true);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("p2p_terms_accepted", "true");
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#1D8751] text-[11px] sm:text-xs text-white font-medium hover:bg-[#15803D] transition-colors flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    I Accept
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1">{renderMessages()}</div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#1F2937] bg-gray-50 dark:bg-[var(--bg-color)]">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={
                    !termsAccepted 
                      ? "Accept terms to start chatting" 
                      : (() => {
                          const status = selectedUser ? (selectedUser as any).status : null;
                          const normalizedStatus = status ? String(status).toLowerCase() : null;
                          const isClosed = normalizedStatus === "complete" || normalizedStatus === "responded";
                          return isClosed ? "Chat is closed - No active orders" : "Type your message...";
                        })()
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={
                    !termsAccepted || 
                    isSending || 
                    (() => {
                      const status = selectedUser ? (selectedUser as any).status : null;
                      const normalizedStatus = status ? String(status).toLowerCase() : null;
                      return normalizedStatus === "complete" || normalizedStatus === "responded";
                    })()
                  }
                  className="w-full rounded-full bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#6B7280] focus:outline-none focus:border-[#1D8751] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={
                  !termsAccepted || 
                  !messageInput.trim() || 
                  isSending ||
                  (() => {
                    const status = selectedUser ? (selectedUser as any).status : null;
                    const normalizedStatus = status ? String(status).toLowerCase() : null;
                    return normalizedStatus === "complete" || normalizedStatus === "responded";
                  })()
                }
                className={`w-8 h-8 rounded-full bg-[#1D8751] text-white flex items-center justify-center transition-opacity ${
                  (() => {
                    const status = selectedUser ? (selectedUser as any).status : null;
                    const normalizedStatus = status ? String(status).toLowerCase() : null;
                    const isClosed = normalizedStatus === "complete" || normalizedStatus === "responded";
                    return termsAccepted && 
                           messageInput.trim() && 
                           !isSending &&
                           !isClosed;
                  })()
                    ? "opacity-100 hover:bg-[#15803D] cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
                title={
                  !termsAccepted 
                    ? "Accept terms to send messages" 
                    : (() => {
                        const status = selectedUser ? (selectedUser as any).status : null;
                        const normalizedStatus = status ? String(status).toLowerCase() : null;
                        const isClosed = normalizedStatus === "complete" || normalizedStatus === "responded";
                        return isClosed ? "Chat is closed" : (isSending ? "Sending..." : "Send message");
                      })()
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chats;


