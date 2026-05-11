"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useGroupedMessages } from "@/features/p2p/hooks/useGroupedMessages";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";
import { useUnreadMessagesWebSocket } from "@/features/p2p/hooks/useUnreadMessagesWebSocket";
import { RecentMessage } from "@/features/p2p/services/unreadMessagesWebSocket";
import {
  GroupedUser,
  postTradeMessage,
  postThreadMessage,
  getTermsAccepted,
  acceptTerms,
} from "@/features/p2p/api";
import {
  deleteTradeMessage,
  deleteThreadMessage,
  type MessageDeleteType,
} from "@/features/p2p/api";
import { getTradeMessagesWebSocket, cleanupTradeMessagesWebSocket } from "@/features/p2p/services/tradeMessagesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import Link from "next/link";
import TermsAndConditionsModal from "@/features/p2p/components/ui/TermsAndConditionsModal";
import { showToast } from "@/lib/utils/toast";
import {
  coalesceMessageImages,
  resolveMessageImageUrl,
  shouldHideBodyTextForMediaPlaceholder,
  hasRenderableMessageImages,
  normalizeMessageCaptionForDedupe,
} from "@/features/p2p/utils/messageMedia";

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
    <div
      className={`group relative w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${isActive
        ? "bg-gray-100 dark:bg-[#111827] border border-[#1D8751]"
        : "bg-transparent hover:bg-gray-50 dark:hover:bg-[#111827]/60 border border-transparent"
        }`}
    >
      <button onClick={onSelect} className="absolute inset-0" aria-label="Open conversation" />
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
        <div className="text-[11px] text-gray-600 dark:text-[#9CA3AF] truncate flex items-center gap-1.5 min-w-0">
          {(() => {
            if (!latestMessage) {
              return <span>No messages yet</span>;
            }
            const imgs = coalesceMessageImages(latestMessage);
            const firstImg = imgs.length ? resolveMessageImageUrl(imgs[0]) : "";
            const hasRenderableImg = !!firstImg;
            const hasAudios =
              (Array.isArray(latestMessage?.audios) && latestMessage.audios.length > 0) ||
              !!(latestMessage?.audio_url || latestMessage?.audio);
            const text = String(latestMessage.content ?? latestMessage.message ?? "").trim();
            if (firstImg) {
              return (
                <>
                  <img
                    src={firstImg}
                    alt=""
                    className="h-5 w-5 rounded object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
                  />
                  {!shouldHideBodyTextForMediaPlaceholder(text, hasRenderableImg, hasAudios) && (
                    <span className="truncate">{text}</span>
                  )}
                </>
              );
            }
            if (hasAudios) {
              return <span className="truncate">Voice message</span>;
            }
            if (text) return <span className="truncate">{text}</span>;
            return <span>No messages yet</span>;
          })()}
        </div>
      </div>
      {unreadCount > 0 && (
        <div className="flex-shrink-0 ml-2">
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#1D8751] text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        </div>
      )}
    </div>
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

  // Keep chat list/messages live from unread-messages socket updates.
  // This updates conversation previews and new incoming messages without reload.
  useUnreadMessagesWebSocket({
    enabled: isAuthenticated,
    onNewMessage: () => {
      if (unreadRefetchTimeoutRef.current) {
        clearTimeout(unreadRefetchTimeoutRef.current);
      }
      unreadRefetchTimeoutRef.current = setTimeout(() => {
        refetch();
      }, 1200);
    },
    onRecentMessages: (messages: RecentMessage[]) => {
      if (!Array.isArray(messages) || messages.length === 0) return;

      const latestByEntity = new Map<string, RecentMessage>();
      for (const msg of messages) {
        const entityId = String(msg?.entity_id ?? "").trim();
        if (!entityId) continue;
        const existing = latestByEntity.get(entityId);
        if (
          !existing ||
          new Date(String(msg.timestamp || 0)).getTime() >
            new Date(String(existing.timestamp || 0)).getTime()
        ) {
          latestByEntity.set(entityId, msg);
        }
      }
      if (latestByEntity.size === 0) return;

      setLiveGroupedUsers((prev) => {
        if (!prev || prev.length === 0) return prev;
        const next = [...prev];
        let changed = false;

        for (let i = 0; i < next.length; i++) {
          const group: any = next[i];
          const entityId = String(group?.entity_id ?? "").trim();
          if (entityId && closedEntityIdsRef.current.has(entityId)) {
            continue;
          }
          const recent = latestByEntity.get(entityId);
          if (!recent) continue;

          const incomingMessage: any = {
            id: String(recent.id),
            content: String(recent.content ?? ""),
            message: String(recent.content ?? ""),
            sender_id: recent.sender_id,
            sender_name: recent.sender_name,
            sender_email: recent.sender_email,
            timestamp: String(recent.timestamp ?? new Date().toISOString()),
            images: Array.isArray(recent.images) ? recent.images : [],
            audios: [],
          };

          const existingMessages = Array.isArray(group.messages)
            ? [...group.messages]
            : [];
          const exists = existingMessages.some(
            (m: any) => String(m?.id) === incomingMessage.id
          );
          if (exists) continue;

          next[i] = {
            ...group,
            messages: [incomingMessage, ...existingMessages],
          } as GroupedUser;
          changed = true;
        }

        if (!changed) return prev;

        next.sort((a: any, b: any) => {
          const aTs = new Date(
            String(a?.messages?.[0]?.timestamp || 0)
          ).getTime();
          const bTs = new Date(
            String(b?.messages?.[0]?.timestamp || 0)
          ).getTime();
          return bTs - aTs;
        });
        return next;
      });
    },
  });

  useEffect(() => {
    return () => {
      if (unreadRefetchTimeoutRef.current) {
        clearTimeout(unreadRefetchTimeoutRef.current);
      }
    };
  }, []);

  const [selectedUser, setSelectedUser] = useState<GroupedUser | null>(null);
  const [liveGroupedUsers, setLiveGroupedUsers] = useState<GroupedUser[]>([]);

  // State for terms acceptance - use localStorage for instant display, API for source of truth
  const P2P_TERMS_KEY = "p2p_terms_accepted";
  const getCachedTermsAccepted = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(P2P_TERMS_KEY) === "true";
  };
  const [termsAccepted, setTermsAccepted] = useState(getCachedTermsAccepted); // Instant from cache

  useEffect(() => {
    if (!isAuthenticated) {
      setTermsAccepted(false);
      return;
    }
    // Hydrate from localStorage immediately (no API wait)
    setTermsAccepted(getCachedTermsAccepted());

    let cancelled = false;
    const load = async () => {
      try {
        const res = await getTermsAccepted();
        if (!cancelled) {
          const apiAccepted = res.terms_accepted === true;
          setTermsAccepted(apiAccepted);
          if (apiAccepted) {
            localStorage.setItem(P2P_TERMS_KEY, "true");
          }
        }
      } catch {
        if (!cancelled) {
          // On API error, keep cached value (if any) - don't force banner
          setTermsAccepted((prev) => prev || getCachedTermsAccepted());
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);
  
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreview, setAudioPreview] = useState<{ file: File; duration: number; url: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showChatView, setShowChatView] = useState(false); // For mobile/tablet: true = show conversation, false = show list
  const [searchTerm, setSearchTerm] = useState("");
  const wsRef = useRef<any>(null);
  const mediaRefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unreadRefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, any[]>>(new Map());
  const [statusOverridesByEntity, setStatusOverridesByEntity] = useState<Map<string, string>>(new Map());
  const justAddedOptimisticRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevSelectedUserIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closedEntityIdsRef = useRef<Set<string>>(new Set());

  const [hiddenMessageIdsByEntity, setHiddenMessageIdsByEntity] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [deleteMenu, setDeleteMenu] = useState<{
    entityId: string;
    messageId: string;
    isSender: boolean;
  } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLiveGroupedUsers((prev) => {
      const incoming = (groupedUsers || []).filter((g: any) => {
        const entityId = String(g?.entity_id ?? "").trim();
        return !entityId || !closedEntityIdsRef.current.has(entityId);
      });
      if (!prev || prev.length === 0) return incoming;

      const byEntity = new Map<string, any>();
      for (const p of prev as any[]) {
        const entityId = String(p?.entity_id ?? "").trim();
        if (entityId && closedEntityIdsRef.current.has(entityId)) continue;
        byEntity.set(entityId, p);
      }

      for (const g of incoming as any[]) {
        const entityId = String(g?.entity_id ?? "").trim();
        if (!entityId) continue;
        if (closedEntityIdsRef.current.has(entityId)) continue;
        const existing = byEntity.get(entityId);
        if (!existing) {
          byEntity.set(entityId, g);
          continue;
        }

        const existingMessages = Array.isArray(existing?.messages)
          ? existing.messages
          : [];
        const incomingMessages = Array.isArray(g?.messages) ? g.messages : [];
        const mergedById = new Map<string, any>();
        for (const m of existingMessages) mergedById.set(String(m?.id ?? ""), m);
        for (const m of incomingMessages) {
          const id = String(m?.id ?? "");
          const prevMsg = mergedById.get(id);
          mergedById.set(id, prevMsg ? { ...prevMsg, ...m } : m);
        }
        const mergedMessages = Array.from(mergedById.values()).sort(
          (a: any, b: any) =>
            new Date(String(b?.timestamp || 0)).getTime() -
            new Date(String(a?.timestamp || 0)).getTime()
        );

        byEntity.set(entityId, {
          ...existing,
          ...g,
          messages: mergedMessages,
        });
      }

      return Array.from(byEntity.values()).sort((a: any, b: any) => {
        const aTs = new Date(String(a?.messages?.[0]?.timestamp || 0)).getTime();
        const bTs = new Date(String(b?.messages?.[0]?.timestamp || 0)).getTime();
        return bTs - aTs;
      });
    });
  }, [groupedUsers]);

  const isUuid = (value: unknown): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value ?? "").trim()
    );

  const isValidTradeIdForMessages = (value: unknown): boolean => {
    const v = String(value ?? "").trim();
    if (!v) return false;
    const lower = v.toLowerCase();
    if (lower === "undefined" || lower === "null" || lower === "support") return false;
    // Support both UUID and numeric/string trade identifiers so WS can attach
    // regardless of backend ID format.
    return isUuid(v) || /^[0-9]+$/.test(v) || /^[0-9a-z-]+$/i.test(v);
  };

  const extractIdFromMessageId = (value: unknown): string => {
    const v = String(value ?? "").trim();
    if (!v) return "";
    // Support seeds often use "<uuid>_initial" ids.
    if (v.includes("_initial")) {
      const candidate = v.split("_initial")[0]?.trim();
      if (isValidTradeIdForMessages(candidate)) return candidate;
    }
    return "";
  };

  const resolvedTradeId = useMemo(() => {
    if (!selectedUser) return "";
    if (isValidTradeIdForMessages(selectedUser.entity_id)) {
      return String(selectedUser.entity_id).trim();
    }
    const candidates: unknown[] = [
      (selectedUser as any)?.trade_id,
      (selectedUser as any)?.support_request_id,
      ...(Array.isArray((selectedUser as any)?.messages)
        ? (selectedUser as any).messages.flatMap((m: any) => [
            m?.trade_id,
            m?.trade,
            m?.entity_id,
            m?.support_request_id,
            extractIdFromMessageId(m?.id),
          ])
        : []),
    ];
    for (const c of candidates) {
      if (isValidTradeIdForMessages(c)) return String(c).trim();
    }
    return "";
  }, [selectedUser]);

  const resolvedThreadId = useMemo(() => {
    const rawType = String((selectedUser as any)?.message_type || "")
      .trim()
      .toLowerCase();
    if (!selectedUser) return "";
    if (rawType === "p2p") return resolvedTradeId;
    const candidates: unknown[] = [
      selectedUser.entity_id,
      (selectedUser as any)?.support_request_id,
      (selectedUser as any)?.appeal_id,
      ...(Array.isArray((selectedUser as any)?.messages)
        ? (selectedUser as any).messages.flatMap((m: any) => [
            m?.entity_id,
            m?.support_request_id,
            m?.appeal_id,
            extractIdFromMessageId(m?.id),
          ])
        : []),
    ];
    for (const c of candidates) {
      if (isValidTradeIdForMessages(c)) return String(c).trim();
    }
    return "";
  }, [selectedUser, resolvedTradeId]);

  const normalizeChatStatus = useCallback((value: unknown): string => {
    const s = String(value || "").trim().toLowerCase();
    if (!s) return "";
    if (s === "canceled") return "cancelled";
    if (s === "complete") return "completed";
    return s;
  }, []);

  const isTerminalChatStatus = useCallback(
    (value: unknown): boolean => {
      const s = normalizeChatStatus(value);
      return s === "completed" || s === "resolved" || s === "cancelled";
    },
    [normalizeChatStatus]
  );

  const getEffectiveChatStatus = useCallback(
    (userObj: GroupedUser | null | undefined): string => {
      if (!userObj) return "";
      const entityId = String((userObj as any)?.entity_id || "").trim();
      const override = entityId ? statusOverridesByEntity.get(entityId) : undefined;
      const base =
        override ??
        (userObj as any)?.status ??
        (userObj as any)?.trade_status ??
        (userObj as any)?.order_status ??
        (Array.isArray((userObj as any)?.messages) &&
        (userObj as any).messages.length > 0
          ? (userObj as any).messages[0]?.status ??
            (userObj as any).messages[0]?.trade_status ??
            (userObj as any).messages[0]?.order_status
          : "");
      return normalizeChatStatus(base);
    },
    [normalizeChatStatus, statusOverridesByEntity]
  );

  const closeConversationInstantly = useCallback(
    (entityId: string, status: string) => {
      const normalizedStatus = normalizeChatStatus(status);
      if (!entityId || !isTerminalChatStatus(normalizedStatus)) return;
      // Keep cancelled/resolved/completed chats visible in the list.
      // We only keep status updated; no auto-removal/no auto-navigation.
    },
    [isTerminalChatStatus, normalizeChatStatus]
  );

  const handleRealtimeTradeStatusUpdate = useCallback(
    (statusUpdate: any) => {
      const incomingTradeId = String(
        statusUpdate?.trade_id ?? statusUpdate?.id ?? ""
      ).trim();
      if (
        resolvedTradeId &&
        incomingTradeId &&
        incomingTradeId !== String(resolvedTradeId)
      ) {
        return;
      }

      const normalized = normalizeChatStatus(
        statusUpdate?.status ??
          statusUpdate?.trade_status ??
          statusUpdate?.order_status
      );
      if (!normalized) return;

      const currentEntityId = String(selectedUser?.entity_id || "").trim();
      if (currentEntityId) {
        setStatusOverridesByEntity((prev) => {
          const next = new Map(prev);
          const existing = normalizeChatStatus(next.get(currentEntityId));
          // Never downgrade terminal states (completed/resolved/cancelled).
          if (isTerminalChatStatus(existing) && !isTerminalChatStatus(normalized)) {
            return prev;
          }
          next.set(currentEntityId, normalized);
          return next;
        });
      }

      if (currentEntityId && isTerminalChatStatus(normalized)) {
        closeConversationInstantly(currentEntityId, normalized);
      }

      setSelectedUser((prev) => {
        if (!prev) return prev;
        const prevStatus = normalizeChatStatus((prev as any)?.status);
        const mergedStatus =
          isTerminalChatStatus(prevStatus) && !isTerminalChatStatus(normalized)
            ? prevStatus
            : normalized;
        return {
          ...prev,
          status: mergedStatus,
        } as GroupedUser;
      });
    },
    [
      closeConversationInstantly,
      isTerminalChatStatus,
      normalizeChatStatus,
      resolvedTradeId,
      selectedUser?.entity_id,
    ]
  );

  useTradeStatusWebSocket({
    tradeId: resolvedTradeId,
    enabled:
      Boolean(isAuthenticated && selectedUser && resolvedTradeId) &&
      String((selectedUser as any)?.message_type || "").toLowerCase() === "p2p",
    onStatusUpdate: handleRealtimeTradeStatusUpdate,
  });

  // Close emoji picker when clicking outside or when no conversation is selected
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Close emoji picker when no conversation is selected
  useEffect(() => {
    if (!selectedUser && showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  }, [selectedUser, showEmojiPicker]);

  // Compute if chat is closed (trade completed/cancelled)
  const isChatClosed = useMemo(() => {
    const normalizedStatus = getEffectiveChatStatus(selectedUser);
    return normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "resolved" || normalizedStatus === "cancelled";
  }, [getEffectiveChatStatus, selectedUser]);

  // Close emoji picker when chat becomes closed
  useEffect(() => {
    if (isChatClosed && showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  }, [isChatClosed, showEmojiPicker]);

  // Common emojis
  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
    "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👋", "👏",
    "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️"
  ];

  const handleEmojiClick = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Track when initial data has been loaded at least once so we don't "reload"
  // the whole page with a spinner on subsequent background fetches.
  useEffect(() => {
    if (!hasLoadedOnce && (groupedUsers || error)) {
      setHasLoadedOnce(true);
    }
  }, [groupedUsers, error, hasLoadedOnce]);

  useEffect(() => {
    if (!selectedUser && liveGroupedUsers && liveGroupedUsers.length > 0) {
      setSelectedUser(liveGroupedUsers[0]);
    }
  }, [liveGroupedUsers, selectedUser]);

  // Compute displayed messages by merging real messages with optimistic ones
  const displayedMessages = useMemo(() => {
    if (!selectedUser || !selectedUser.entity_id) return [];

    const hiddenForEntity = hiddenMessageIdsByEntity.get(selectedUser.entity_id) || new Set<string>();
    const realMessages = selectedUser.messages || [];
    const optimistic = optimisticMessages.get(selectedUser.entity_id) || [];

    const sameMessageSender = (a: any, b: any) => {
      if (a?.sender_id && b?.sender_id && a.sender_id === b.sender_id) return true;
      const ae = String(a?.sender_email ?? "").trim().toLowerCase();
      const be = String(b?.sender_email ?? "").trim().toLowerCase();
      return !!ae && ae === be;
    };

    // Filter out optimistic messages that have been replaced by real ones
    const filteredOptimistic = optimistic.filter((optMsg) => {
      const hasRealMatch = realMessages.some((realMsg) => {
        if (!sameMessageSender(realMsg, optMsg)) return false;

        const realText = String(realMsg?.content ?? realMsg?.message ?? "").trim();
        const optText = String(optMsg?.content ?? optMsg?.message ?? "").trim();
        const realNorm = normalizeMessageCaptionForDedupe(realText);
        const optNorm = normalizeMessageCaptionForDedupe(optText);
        const sameNormalizedCaption = realNorm === optNorm;
        const realRenderable = hasRenderableMessageImages(realMsg);
        const optRenderable = hasRenderableMessageImages(optMsg);
        const bothMediaOnly =
          sameNormalizedCaption &&
          realNorm === "" &&
          realRenderable &&
          optRenderable;
        const sameContent = (sameNormalizedCaption && realNorm !== "") || bothMediaOnly;
        const timeDiff = Math.abs(
          new Date(realMsg.timestamp).getTime() - new Date(optMsg.timestamp).getTime()
        );
        return sameContent && timeDiff < 10000;
      });
      return !hasRealMatch;
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

    const merged = [...realMessages, ...filteredOptimistic];
    if (hiddenForEntity.size === 0) return merged;
    return merged.filter((m: any) => !hiddenForEntity.has(String(m?.id ?? "")));
  }, [
    selectedUser?.messages,
    selectedUser?.entity_id,
    optimisticMessages,
    hiddenMessageIdsByEntity,
    user?.id,
    user?.email,
  ]);

  const isAdminUser = useMemo(() => {
    const raw =
      (user as any)?.user_type ??
      (user as any)?.role ??
      (user as any)?.type ??
      "";
    const s = String(raw).toLowerCase();
    return (
      s.includes("admin") ||
      s.includes("staff") ||
      Boolean((user as any)?.is_staff) ||
      Boolean((user as any)?.is_superuser)
    );
  }, [user]);

  const hideMessageLocally = useCallback((entityId: string, messageId: string) => {
    const id = String(messageId || "").trim();
    if (!entityId || !id) return;
    setHiddenMessageIdsByEntity((prev) => {
      const next = new Map(prev);
      const existing = next.get(entityId) ? new Set(next.get(entityId)!) : new Set<string>();
      existing.add(id);
      next.set(entityId, existing);
      return next;
    });
    // Also remove from optimistic map if it exists there.
    setOptimisticMessages((prev) => {
      const next = new Map(prev);
      const list = next.get(entityId) || [];
      const filtered = list.filter((m: any) => String(m?.id ?? "") !== id);
      if (filtered.length === 0) next.delete(entityId);
      else next.set(entityId, filtered);
      return next;
    });
  }, []);

  const handleDeleteMessage = useCallback(
    async (msg: any, deleteType: MessageDeleteType) => {
      if (!selectedUser) return;
      const entityId = selectedUser.entity_id;
      const messageId = String(msg?.id ?? "").trim();
      if (!messageId) return;

      // Optimistic/local-only rows can be removed immediately without hitting API.
      if (messageId.startsWith("temp-")) {
        hideMessageLocally(entityId, messageId);
        setDeleteMenu(null);
        return;
      }

      const messageType = String((selectedUser as any)?.message_type || "")
        .trim()
        .toLowerCase();
      try {
        if (messageType === "support" || messageType === "appeal") {
          await deleteThreadMessage({
            type: messageType as "support" | "appeal",
            message_id: messageId,
            delete_type: deleteType,
          });
        } else {
          const tradeId = resolvedTradeId;
          if (!tradeId) throw new Error("Missing trade id for this conversation");
          await deleteTradeMessage(tradeId, messageId, deleteType);
        }

        hideMessageLocally(entityId, messageId);
        setDeleteMenu(null);
        showToast.success("Message deleted");
      } catch (error: any) {
        const apiMsg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to delete message";
        showToast.error("Delete failed", String(apiMsg));
      }
    },
    [hideMessageLocally, resolvedTradeId, selectedUser]
  );

  const startLongPress = useCallback(
    (entityId: string, messageId: string, isSender: boolean) => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
      longPressTimerRef.current = window.setTimeout(() => {
        setDeleteMenu({ entityId, messageId, isSender });
      }, 550);
    },
    []
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

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

    if (selectedUser && selectedUser.entity_id && liveGroupedUsers) {
      const updatedUser = liveGroupedUsers.find(
        (user) => user.entity_id === selectedUser.entity_id
      );
      if (updatedUser && updatedUser.messages) {
        // Only update if messages actually changed to avoid unnecessary re-renders
        const currentMessageIds = (selectedUser.messages || []).map(m => m.id).join(',');
        const newMessageIds = updatedUser.messages.map(m => m.id).join(',');
        const currentStatus = getEffectiveChatStatus(selectedUser);
        const nextStatus = getEffectiveChatStatus(updatedUser as GroupedUser);

        if (currentMessageIds !== newMessageIds || currentStatus !== nextStatus) {
          // Merge messages/status instead of replacing entire object
          setSelectedUser(prev => {
            if (!prev) return updatedUser;
            const prevStatus = normalizeChatStatus((prev as any).status);
            const incomingStatus =
              nextStatus || (updatedUser as any).status || (prev as any).status;
            const normalizedIncomingStatus = normalizeChatStatus(incomingStatus);
            const mergedStatus =
              isTerminalChatStatus(prevStatus) &&
              !isTerminalChatStatus(normalizedIncomingStatus)
                ? prevStatus
                : incomingStatus;
            return {
              ...prev,
              messages: updatedUser.messages,
              status: mergedStatus,
            } as GroupedUser;
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getEffectiveChatStatus, isTerminalChatStatus, liveGroupedUsers, normalizeChatStatus]);


  // WebSocket connection for selected user
  useEffect(() => {
    if (!selectedUser || !resolvedTradeId || !isAuthenticated) {
      return;
    }
    if (String((selectedUser as any)?.message_type || "").toLowerCase() !== "p2p") {
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
    const ws = getTradeMessagesWebSocket(resolvedTradeId);
    wsRef.current = ws;

    // Connect WebSocket
    ws.connect(resolvedTradeId, token);

    // Handle incoming messages immediately for instant UI updates.
    const unsubscribeMessage = ws.onMessage((wsMessage: any) => {
      const payload =
        wsMessage?.data && typeof wsMessage.data === "object"
          ? wsMessage.data
          : wsMessage;
      if (!payload) return;

      const incomingTradeId = String(
        payload?.trade_id ?? payload?.trade ?? resolvedTradeId ?? ""
      ).trim();
      const isCurrentTrade =
        !incomingTradeId ||
        !resolvedTradeId ||
        incomingTradeId === String(resolvedTradeId);

      // Handle status updates (e.g. resolved/cancelled/completed) in real-time so
      // closed-state UI updates without requiring a manual page reload.
      const statusFromPayloadRaw =
        payload?.status ??
        payload?.trade_status ??
        payload?.order_status ??
        wsMessage?.status ??
        wsMessage?.trade_status ??
        wsMessage?.order_status;
      const statusFromPayload = normalizeChatStatus(statusFromPayloadRaw);
      const isStatusEvent =
        wsMessage?.type === "status_update" || statusFromPayload.length > 0;
      if (isStatusEvent && isCurrentTrade) {
        const currentEntityId = String(selectedUser?.entity_id || "").trim();
        if (currentEntityId && statusFromPayload) {
          setStatusOverridesByEntity((prev) => {
            const next = new Map(prev);
            const existing = normalizeChatStatus(next.get(currentEntityId));
            if (
              isTerminalChatStatus(existing) &&
              !isTerminalChatStatus(statusFromPayload)
            ) {
              return prev;
            }
            next.set(currentEntityId, statusFromPayload);
            return next;
          });
        }
        setSelectedUser((prev) => {
          if (!prev) return prev;
          const prevStatus = normalizeChatStatus((prev as any)?.status);
          const mergedStatus =
            isTerminalChatStatus(prevStatus) &&
            !isTerminalChatStatus(statusFromPayload)
              ? prevStatus
              : statusFromPayload || (prev as any).status;
          return {
            ...prev,
            status: mergedStatus,
          } as GroupedUser;
        });
        if (currentEntityId && isTerminalChatStatus(statusFromPayload)) {
          closeConversationInstantly(currentEntityId, statusFromPayload);
        }
        // Keep grouped conversations list in sync with latest status.
        refetch();
      }

      // Accept both explicit message types and message-shaped payloads.
      const isMessageEvent =
        wsMessage?.type === "new_message" ||
        wsMessage?.type === "message_received" ||
        payload?.message !== undefined ||
        Array.isArray(payload?.images) ||
        Array.isArray(payload?.audios);
      if (!isMessageEvent) return;

      if (!payload?.id) return;

      const incomingTrade =
        String(payload.trade_id ?? payload.trade ?? resolvedTradeId ?? "").trim();
      if (incomingTrade && resolvedTradeId && incomingTrade !== String(resolvedTradeId)) {
        return;
      }

      const normalizedMessage = {
        id: String(payload.id),
        content: String(payload.content ?? payload.message ?? ""),
        message: String(payload.message ?? payload.content ?? ""),
        support_document: String(
          (payload as any).support_document ??
            (payload as any).support_document_url ??
            ""
        ).trim(),
        images: Array.isArray(payload.images)
          ? payload.images
          : Array.isArray(payload.uploaded_images)
          ? payload.uploaded_images
          : [],
        audios: Array.isArray(payload.audios)
          ? payload.audios
          : Array.isArray(payload.uploaded_audios)
          ? payload.uploaded_audios
          : [],
        audio_url: payload.audio_url,
        audio: payload.audio,
        sender_id: payload.sender_id ?? payload.sender ?? 0,
        sender_email: String(payload.sender_email ?? payload.sender_name ?? payload.sender ?? ""),
        sender_name: String(payload.sender_name ?? payload.sender_email ?? payload.sender ?? ""),
        timestamp: String(payload.timestamp ?? new Date().toISOString()),
      };

      setSelectedUser((prev) => {
        if (!prev) return prev;
        const existing = Array.isArray((prev as any).messages) ? (prev as any).messages : [];
        const existingIndex = existing.findIndex(
          (m: any) => String(m?.id) === normalizedMessage.id
        );

        // Some backends emit the same message twice: first without media,
        // then again with images/audios attached. Merge instead of dropping.
        if (existingIndex !== -1) {
          const current = existing[existingIndex] || {};
          const merged = {
            ...current,
            ...normalizedMessage,
            content:
              normalizedMessage.content?.trim() ||
              current.content ||
              current.message ||
              "",
            message:
              normalizedMessage.message?.trim() ||
              current.message ||
              current.content ||
              "",
            images:
              Array.isArray(normalizedMessage.images) &&
              normalizedMessage.images.length > 0
                ? normalizedMessage.images
                : Array.isArray(current.images)
                  ? current.images
                  : [],
            audios:
              Array.isArray(normalizedMessage.audios) &&
              normalizedMessage.audios.length > 0
                ? normalizedMessage.audios
                : Array.isArray(current.audios)
                  ? current.audios
                  : [],
            audio_url:
              normalizedMessage.audio_url || current.audio_url || undefined,
            audio: normalizedMessage.audio || current.audio || undefined,
            support_document:
              (normalizedMessage as any).support_document ||
              (current as any).support_document ||
              "",
          };
          const nextMessages = [...existing];
          nextMessages[existingIndex] = merged;
          return {
            ...prev,
            messages: nextMessages,
          } as GroupedUser;
        }

        // Keep latest-first order expected by this tab.
        return {
          ...prev,
          messages: [normalizedMessage as any, ...existing],
        } as GroupedUser;
      });

      // Media can arrive delayed on backend processing; if socket payload is empty/blank,
      // force a quick API refetch so image/audio shows as soon as available.
      const hasText = normalizedMessage.content.trim().length > 0;
      const hasImages = coalesceMessageImages(normalizedMessage).length > 0;
      const hasAudios = Array.isArray(normalizedMessage.audios) && normalizedMessage.audios.length > 0;
      if (!hasText && !hasImages && !hasAudios) {
        if (mediaRefetchTimeoutRef.current) {
          clearTimeout(mediaRefetchTimeoutRef.current);
        }
        mediaRefetchTimeoutRef.current = setTimeout(() => {
          refetch();
        }, 300);
      }
    });

    return () => {
      unsubscribeMessage();
      if (mediaRefetchTimeoutRef.current) {
        clearTimeout(mediaRefetchTimeoutRef.current);
      }
      // Don't cleanup WebSocket here as it might be used elsewhere
      // cleanupTradeMessagesWebSocket(selectedUser.entity_id);
    };
  }, [
    closeConversationInstantly,
    isTerminalChatStatus,
    selectedUser?.entity_id,
    resolvedTradeId,
    isAuthenticated,
    normalizeChatStatus,
    refetch,
  ]);

  const conversations = useMemo(() => {
    return liveGroupedUsers || [];
  }, [liveGroupedUsers]);

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

  const getDateSeparatorLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const msgDate = date.toDateString();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (msgDate === today) return "Today";
    if (msgDate === yesterdayStr) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  const getDisplayName = React.useCallback((userGroup: GroupedUser) => {
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
  }, []);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((group: any) => {
      // Search by display name (sender/buyer name)
      const displayName = (getDisplayName(group) ?? "").toString().toLowerCase();

      // Search by peer name (for P2P conversations)
      const peerName = (group.peer_name ?? "").toString().toLowerCase();

      // Search by sender name
      const senderName = (group.sender_name ?? "").toString().toLowerCase();

      // Search by emails
      const peerEmail = (group.peer_email ?? "").toString().toLowerCase();
      const senderEmail = (group.sender_email ?? "").toString().toLowerCase();

      // Search in latest message content
      const latestMsg = group.messages?.[0];
      const messageContent = (
        latestMsg?.content ??
        latestMsg?.message ??
        ""
      )
        .toString()
        .toLowerCase();

      return (
        displayName.includes(term) ||
        peerName.includes(term) ||
        senderName.includes(term) ||
        peerEmail.includes(term) ||
        senderEmail.includes(term) ||
        messageContent.includes(term)
      );
    });
  }, [conversations, searchTerm, getDisplayName]);

  const getPhotoUrl = (userGroup: GroupedUser, latestMessage: any) => {
    if (userGroup.message_type === "p2p") {
      return (userGroup as any).peer_photo || null;
    }
    return latestMessage?.sender_photo || (userGroup as any).sender_photo || null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedUser || !termsAccepted) return;
    const filesArray = Array.from(e.target.files);
    setUploadedImages((prev) => [...prev, ...filesArray]);
    // Allow selecting the same file again
    e.target.value = "";
  };

  const removeSelectedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Update recording seconds display while recording
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    setRecordingSeconds(0);
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
      setRecordingSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    if (!selectedUser || !termsAccepted || isSending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStartRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const durationSeconds = Math.round((Date.now() - recordingStartRef.current) / 1000);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'm4a';
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
        const url = URL.createObjectURL(blob);
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setAudioPreview({ file, duration: durationSeconds, url });
      };
      mediaRecorder.start(500); // 500ms timeslice ensures we get data during recording
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  // Live seconds counter while recording
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - recordingStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  const handleSendAudioPreview = () => {
    if (!audioPreview) return;
    handleSendAudioMessage(audioPreview.file, audioPreview.duration);
    URL.revokeObjectURL(audioPreview.url);
    setAudioPreview(null);
  };

  const handleDiscardAudioPreview = () => {
    if (!audioPreview) return;
    URL.revokeObjectURL(audioPreview.url);
    setAudioPreview(null);
  };

  const handleSendAudioMessage = async (audioFile: File, durationSeconds: number = 0) => {
    if (!selectedUser?.entity_id) return;
    const messageType = String((selectedUser as any)?.message_type || "")
      .trim()
      .toLowerCase();
    const targetId = messageType === "p2p" ? resolvedTradeId : resolvedThreadId;
    if (!targetId) {
      console.error("No valid thread/trade UUID for voice message", {
        messageType,
        resolvedTradeId,
        resolvedThreadId,
      });
      return;
    }
    if (messageType !== "p2p" && messageType !== "support" && messageType !== "appeal") {
      return;
    }
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: tempId,
      content: '',
      message: '',
      audios: [{ id: tempId, audio_url: URL.createObjectURL(audioFile), duration: durationSeconds }],
      sender_id: user?.id || 0,
      sender_email: user?.email || '',
      sender_name: user?.email || '',
      timestamp: new Date().toISOString(),
      isOptimistic: true,
    };
    setOptimisticMessages((prev) => {
      const newMap = new Map(prev);
      const entityId = selectedUser.entity_id;
      const existing = newMap.get(entityId) || [];
      newMap.set(entityId, [...existing, optimisticMessage]);
      return newMap;
    });
    justAddedOptimisticRef.current = true;
    setTimeout(() => { justAddedOptimisticRef.current = false; }, 500);
    setIsSending(true);
    try {
      if (messageType === "p2p") {
        await postTradeMessage(targetId, {
          message: "",
          uploaded_images: [],
          uploaded_audios: [audioFile],
          duration: durationSeconds,
          sender_name: user?.email || "",
        });
      } else {
        await postThreadMessage({
          type: messageType as "support" | "appeal",
          entity_id: targetId,
          message: "",
          uploaded_images: [],
          uploaded_audios: [audioFile],
          duration: durationSeconds,
          sender_name: user?.email || "",
        });
      }
      refetch();
      setTimeout(() => {
        setOptimisticMessages((prev) => {
          const newMap = new Map(prev);
          const entityId = selectedUser.entity_id;
          const existing = newMap.get(entityId) || [];
          const filtered = existing.filter((m) => m.id !== tempId);
          if (filtered.length === 0) newMap.delete(entityId);
          else newMap.set(entityId, filtered);
          return newMap;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      const msg = error instanceof Error ? error.message : String(error);
      showToast.error("Could not send voice message", msg);
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        const entityId = selectedUser.entity_id;
        const existing = newMap.get(entityId) || [];
        const filtered = existing.filter((m) => m.id !== tempId);
        if (filtered.length === 0) newMap.delete(entityId);
        else newMap.set(entityId, filtered);
        return newMap;
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTermsAccept = async () => {
    try {
      await acceptTerms();
      setTermsAccepted(true);
      localStorage.setItem(P2P_TERMS_KEY, "true");
    } catch (err) {
      console.error("Failed to accept terms:", err);
    }
  };
  const handleSendMessage = async () => {
    if (
      (!messageInput.trim() && uploadedImages.length === 0) ||
      !selectedUser ||
      !termsAccepted ||
      isSending
    ) {
      return;
    }

    const messageType = String((selectedUser as any)?.message_type || "")
      .trim()
      .toLowerCase();
    const targetId = messageType === "p2p" ? resolvedTradeId : resolvedThreadId;
    if (!targetId) {
      console.error("No valid thread/trade UUID available for message send", {
        messageType,
        entity_id: (selectedUser as any)?.entity_id,
        resolvedTradeId,
        resolvedThreadId,
      });
      return;
    }

    const messageContent = messageInput.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const imagesToSend = uploadedImages;
    // Image-only: empty caption in UI; postThreadMessage / postTradeMessage still send a server fallback when needed.
    const outgoingMessageText =
      messageContent || (imagesToSend.length > 0 ? "" : "");

    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      content: outgoingMessageText,
      message: outgoingMessageText,
      images: imagesToSend.map((file) => URL.createObjectURL(file)),
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
    setUploadedImages([]);
    setIsSending(true);

    try {
      if (messageType === "p2p") {
        // P2P trade chat endpoint:
        // POST /trading_engine/trades/<trade_uuid>/messages/
        await postTradeMessage(targetId, {
          message: outgoingMessageText,
          uploaded_images: imagesToSend,
          sender_name: user?.email || "",
        });
      } else if (messageType === "support" || messageType === "appeal") {
        // Support/appeal: same attachments as trade chat (multipart when images present).
        await postThreadMessage({
          type: messageType,
          entity_id: targetId,
          message: outgoingMessageText,
          uploaded_images: imagesToSend,
          sender_name: user?.email || "",
        });
      } else {
        throw new Error(`Unsupported message type: ${messageType || "unknown"}`);
      }

      // Immediately refetch to get the real message
      refetch();

      // Drop optimistic row only after a long fallback so blob previews survive until
      // the server message includes a real image URL (dedupe removes it earlier when it does).
      setTimeout(() => {
        setOptimisticMessages((prev) => {
          const newMap = new Map(prev);
          const entityId = selectedUser.entity_id;
          const existing = newMap.get(entityId) || [];
          const removed = existing.find((m) => m.id === tempId);
          if (removed?.images && Array.isArray(removed.images)) {
            for (const u of removed.images) {
              if (typeof u === "string" && u.startsWith("blob:")) {
                URL.revokeObjectURL(u);
              }
            }
          }
          const filtered = existing.filter((msg) => msg.id !== tempId);
          if (filtered.length === 0) {
            newMap.delete(entityId);
          } else {
            newMap.set(entityId, filtered);
          }
          return newMap;
        });
      }, 45000);
    } catch (error) {
      console.error("Failed to send message:", error);
      const msg = error instanceof Error ? error.message : String(error);
      showToast.error("Could not send message", msg);

      if (Array.isArray(optimisticMessage.images)) {
        for (const u of optimisticMessage.images) {
          if (typeof u === "string" && u.startsWith("blob:")) {
            URL.revokeObjectURL(u);
          }
        }
      }

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

      // Restore message and attachments so user can retry
      setMessageInput(messageContent);
      setUploadedImages(imagesToSend);
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
        <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-600 dark:text-[#A2A4A9]">
          Select a conversation on the left to start chatting.
        </div>
      );
    }

    // Use displayedMessages which includes optimistic messages
    const allMessages = displayedMessages;

    // Check if chat is closed - disable if status is complete/resolved/cancelled
    const normalizedStatus = getEffectiveChatStatus(selectedUser);
    const isChatClosed = normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "resolved" || normalizedStatus === "cancelled";

    if (allMessages.length === 0) {
      return (
        <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-600 dark:text-[#A2A4A9]">
          Select a conversation on the left to start chatting.
        </div>
      );
    }

    const reversedMessages = allMessages.slice().reverse();

    return (
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-1 px-4 py-4 overflow-y-scroll flex-1 min-h-0 scrollbar-thin"
      >
        {reversedMessages.map((msg: any, index: number) => {
            // Determine if this message is from the logged-in user
            const isSender =
              (user?.id && msg.sender_id && msg.sender_id === user.id) ||
              (user?.email && msg.sender_email &&
                msg.sender_email.trim().toLowerCase() === user.email.trim().toLowerCase());

            const displayName = msg.sender_name ||
              (msg.sender_email ? msg.sender_email.split('@')[0] : "Unknown User");

            const imageItems = coalesceMessageImages(msg);
            const hasRenderableImages = hasRenderableMessageImages(msg);
            const audioListForFlag =
              Array.isArray(msg.audios) && msg.audios.length > 0
                ? msg.audios
                : msg.audio_url || msg.audio
                  ? [{ id: msg.id, audio_url: msg.audio_url || msg.audio, duration: 0 }]
                  : [];
            const hasRenderableAudios = audioListForFlag.some((a: { audio_url?: string }) =>
              String(a?.audio_url ?? "").trim()
            );
            const rawBodyText = String(msg.content ?? msg.message ?? "").trim();
            const showBodyText =
              rawBodyText &&
              !shouldHideBodyTextForMediaPlaceholder(
                rawBodyText,
                hasRenderableImages,
                hasRenderableAudios
              );

            const prevMsg = index > 0 ? reversedMessages[index - 1] : null;
            const prevDate = prevMsg?.timestamp ? new Date(prevMsg.timestamp).toDateString() : "";
            const currDate = msg.timestamp ? new Date(msg.timestamp).toDateString() : "";
            const showDateSeparator = !msg.timestamp || index === 0 || prevDate !== currDate;

            return (
              <React.Fragment key={msg.id || index}>
                {/* Date separator (Today, Yesterday, or formatted date) */}
                {showDateSeparator && msg.timestamp && (
                  <div className="flex justify-center py-3">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2C2C34] px-3 py-1.5 rounded-full">
                      {getDateSeparatorLabel(msg.timestamp)}
                    </span>
                  </div>
                )}
                <div
                  className={`flex w-full ${isSender ? "justify-end" : "justify-start"}`}
                >
                <div className="relative group">
                  <div
                    onTouchStart={() =>
                      startLongPress(selectedUser.entity_id, String(msg?.id ?? ""), isSender)
                    }
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setDeleteMenu({
                        entityId: selectedUser.entity_id,
                        messageId: String(msg?.id ?? ""),
                        isSender,
                      });
                    }}
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

                  {showBodyText && (
                    <div className="text-xs sm:text-sm break-words mb-0.5 whitespace-pre-line">
                      {rawBodyText}
                    </div>
                  )}

                  {/* Image attachments (if present) */}
                  {hasRenderableImages && (
                    <div className={`flex flex-wrap gap-2 ${showBodyText ? "mt-1" : ""}`}>
                      {imageItems.map((img: unknown, idx: number) => {
                        const imageUrl = resolveMessageImageUrl(img);
                        if (!imageUrl) return null;
                        return (
                          <img
                            key={`${msg.id}-img-${idx}`}
                            src={imageUrl}
                            alt={`attachment-${idx + 1}`}
                            className="max-w-[220px] max-h-48 w-auto h-auto rounded object-contain border border-white/20 cursor-pointer hover:opacity-90 bg-black/10"
                            onClick={() => window.open(imageUrl, "_blank")}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Voice/audio messages - API: audios: [{ id, audio_url, duration }], or legacy audio_url/audio */}
                  {(() => {
                    const audioList = Array.isArray(msg.audios) && msg.audios.length > 0
                      ? msg.audios
                      : (msg.audio_url || msg.audio)
                        ? [{ id: msg.id, audio_url: msg.audio_url || msg.audio, duration: 0 }]
                        : [];
                    if (audioList.length === 0) return null;
                    return (
                      <div className="mt-1 flex flex-col gap-2">
                        {audioList.map((a: { id?: string; audio_url: string; duration?: number }, idx: number) => (
                          <div key={a.id || `audio-${idx}`} className="flex items-center gap-2">
                            <audio
                              controls
                              className="max-w-full h-8 min-w-[180px]"
                              src={a.audio_url}
                              preload="metadata"
                            >
                              Your browser does not support audio playback.
                            </audio>
                            {typeof a.duration === 'number' && a.duration > 0 && (
                              <span className="text-[10px] opacity-75">{a.duration}s</span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="text-[10px] opacity-75 text-right mt-0">
                    {msg.timestamp ? formatTimestamp(msg.timestamp) : ""}
                  </div>
                  </div>

                  {/* Delete icon (hover/long-press) */}
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteMenu({
                        entityId: selectedUser.entity_id,
                        messageId: String(msg?.id ?? ""),
                        isSender,
                      })
                    }
                    className="absolute -top-2 -right-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center w-7 h-7 rounded-full bg-white/90 dark:bg-[#23232B] border border-[#E3E6F0] dark:border-[#35353E] shadow-sm"
                    aria-label="Delete message"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600 dark:text-[#8B90A5]" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z" />
                    </svg>
                  </button>

                  {/* Delete menu */}
                  {deleteMenu &&
                    deleteMenu.entityId === selectedUser.entity_id &&
                    deleteMenu.messageId === String(msg?.id ?? "") && (
                      <div
                        className={`absolute z-50 mt-2 ${
                          isSender ? "right-0" : "left-0"
                        }`}
                      >
                        <div className="w-52 rounded-xl border border-[#E3E6F0] dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] shadow-xl overflow-hidden">
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#23232B]"
                            onClick={() => handleDeleteMessage(msg, "delete_for_me")}
                          >
                            Delete for me
                          </button>
                          {(isSender || isAdminUser) && (
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#23232B]"
                              onClick={() => handleDeleteMessage(msg, "delete_for_everyone")}
                            >
                              Delete for everyone
                            </button>
                          )}
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-[#8B90A5] hover:bg-gray-50 dark:hover:bg-[#23232B]"
                            onClick={() => setDeleteMenu(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
              </React.Fragment>
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
                  This chat is now closed as the trade has been {normalizedStatus === "cancelled" ? "cancelled" : normalizedStatus === "resolved" ? "resolved" : "completed"}.
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
    <div className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-1 sm:px-2 md:px-4 pt-0 pb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          P2P Trading Chat
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-[#A3A7BF] mt-1">
          Communicate securely with traders.
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0 overflow-hidden">
        {/* Conversations list - Left Card - Hidden on mobile/tablet when chat is open */}
        <div className={`w-full lg:w-72 xl:w-80 rounded-2xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#15161D] overflow-hidden flex flex-col min-h-0 ${showChatView ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex-shrink-0 px-3 py-2">
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

          <div className="px-2 pb-1 space-y-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
            {filteredConversations.length === 0 && (
              <div className="px-3 py-4 text-xs text-gray-600 dark:text-[#9CA3AF]">
                {searchTerm.trim()
                  ? "No matching conversations."
                  : "No conversations yet."}
              </div>
            )}
            {filteredConversations.map((group: any) => {
              const displayName = getDisplayName(group);
              const latestMessage = group.messages?.[0];
              const isActive = Boolean(
                selectedUser && selectedUser.entity_id === group.entity_id
              );
              // Count only incoming messages (from others), not messages the user sent
              const unreadCount = (group.messages || []).filter((msg: any) => {
                const isFromMe =
                  (user?.id && msg.sender_id && msg.sender_id === user.id) ||
                  (user?.email && msg.sender_email &&
                    msg.sender_email.trim().toLowerCase() === (user.email || "").trim().toLowerCase());
                return !isFromMe;
              }).length;
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
                  onSelect={() => {
                    setSelectedUser(group);
                    // On mobile/tablet, show chat view when a conversation is selected
                    setShowChatView(true);
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Chat panel - Right Card - Hidden on mobile/tablet when list is shown */}
        <div className={`flex-1 flex flex-col rounded-2xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#111217] overflow-hidden min-h-0 ${showChatView ? 'flex' : 'hidden lg:flex'}`}>
          {/* Chat header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Back button for mobile/tablet */}
              <button
                onClick={() => setShowChatView(false)}
                className="lg:hidden flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#1F2937] flex items-center justify-center transition-colors"
                aria-label="Back to conversations"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

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
            <div className="flex-shrink-0 px-4 pt-4">
              <div className="rounded-2xl border border-[#1D8751] bg-green-100 dark:bg-[#042417] text-gray-900 dark:text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute inset-y-0 right-0 w-1/2 dark:w-1/2 bg-gradient-to-l from-gray-400/70 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-2 relative z-10">
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
                <div className="flex flex-wrap gap-2 mt-1 relative z-10">
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="px-3 py-1.5 rounded-full border border-[#1D8751] text-[11px] sm:text-xs text-[#1D8751] dark:text-[#D1FAE5] bg-transparent hover:bg-green-200 dark:hover:bg-[#064E3B] transition-colors inline-block"
                  >
                    Read Terms &amp; Conditions
                  </button>
                  <button
                    onClick={handleTermsAccept}
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

          {/* Messages area - scrolls independently */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{renderMessages()}</div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-[#1F2937] bg-gray-50 dark:bg-[var(--bg-color)]">
            {/* Audio preview - listen before sending */}
            {audioPreview && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151]">
                <audio
                  src={audioPreview.url}
                  controls
                  className="h-9 max-w-[180px]"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {audioPreview.duration}s
                </span>
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleSendAudioPreview}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-md bg-[#1D8751] text-white text-sm font-medium hover:bg-[#176b40] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardAudioPreview}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-md bg-gray-300 dark:bg-[#4B5563] text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-400 dark:hover:bg-[#6B7280] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Selected image previews */}
            {uploadedImages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedImages.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`selected-${idx}`}
                      className="w-12 h-12 rounded object-cover border border-gray-200 dark:border-[#35353E]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                      aria-label="Remove image"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Attach image - Left side */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedUser || !termsAccepted || isSending || isRecording || isChatClosed}
                className="w-8 h-8 flex-shrink-0 rounded-md bg-gray-300 dark:bg-[#374151] text-gray-600 dark:text-gray-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 dark:hover:bg-[#4B5563] transition-colors"
                title={isChatClosed ? "Chat is closed" : !selectedUser ? "Select a conversation to attach images" : "Attach image"}
                aria-label="Attach image"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              {/* Audio recording - record voice message with seconds count */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isRecording && (
                  <span className="text-xs font-medium text-red-500 tabular-nums min-w-[2ch]">
                    {recordingSeconds}s
                  </span>
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!selectedUser || !termsAccepted || isSending || !!audioPreview || isChatClosed}
                  className={`w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    isRecording
                      ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                      : "bg-gray-300 dark:bg-[#374151] text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-[#4B5563]"
                  }`}
                  title={
                    isChatClosed
                      ? "Chat is closed"
                      : !selectedUser
                        ? "Select a conversation to record"
                        : audioPreview
                          ? "Send or discard recording first"
                          : isRecording
                            ? "Click to stop recording"
                            : "Record voice message"
                  }
                  aria-label={isRecording ? "Stop recording" : "Record voice message"}
                >
                  {isRecording ? (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-4a4 4 0 01-8 0V9a4 4 0 118 0v2z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Input field */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={
                    !selectedUser
                      ? "Select a conversation to start chatting"
                      : !termsAccepted
                        ? "Accept terms to start chatting"
                        : isChatClosed
                          ? "Chat is closed - Trade completed, resolved, or cancelled"
                          : "Type your message..."
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={
                    !selectedUser ||
                    !termsAccepted ||
                    isSending ||
                    isRecording ||
                    isChatClosed
                  }
                  className="w-full rounded-lg bg-gray-100 dark:bg-[#374151] border border-gray-300 dark:border-[#374151] px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                disabled={!selectedUser || !termsAccepted || isSending}
                onChange={handleImageChange}
              />

              {/* Emoji picker button */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  disabled={!selectedUser || !termsAccepted || isSending || isRecording || isChatClosed}
                  className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-300 dark:bg-[#374151] text-gray-600 dark:text-gray-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 dark:hover:bg-[#4B5563] transition-colors"
                  title={isChatClosed ? "Chat is closed" : !selectedUser ? "Select a conversation to use emojis" : "Pick emoji"}
                  aria-label="Pick emoji"
                  onClick={() => {
                    if (selectedUser && termsAccepted && !isSending && !isChatClosed) {
                      setShowEmojiPicker(!showEmojiPicker);
                    }
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Emoji picker dropdown */}
                {showEmojiPicker && selectedUser && !isChatClosed && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 h-48 bg-white dark:bg-[#1F2937] border border-gray-300 dark:border-[#374151] rounded-lg shadow-lg p-3 overflow-y-auto z-50">
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-[#374151] rounded transition-colors cursor-pointer"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send button - Rectangular green */}
              <button
                onClick={handleSendMessage}
                disabled={
                  !selectedUser ||
                  !termsAccepted ||
                  (!messageInput.trim() && uploadedImages.length === 0) ||
                  isSending ||
                  isChatClosed
                }
                className={`w-10 h-8 flex-shrink-0 rounded-lg bg-[#1D8751] text-white flex items-center justify-center transition-all ${selectedUser &&
                  termsAccepted &&
                  (messageInput.trim() || uploadedImages.length > 0) &&
                  !isSending &&
                  !isChatClosed
                  ? "opacity-100 hover:bg-[#15803D] cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
                  }`}
                title={
                  !selectedUser
                    ? "Select a conversation to send messages"
                    : !termsAccepted
                      ? "Accept terms to send messages"
                      : isChatClosed
                        ? "Chat is closed"
                        : (isSending ? "Sending..." : "Send message")
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

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={async () => {
          try {
            await acceptTerms();
            setTermsAccepted(true);
            setShowTermsModal(false);
          } catch (err) {
            console.error("Failed to accept terms:", err);
          }
        }}
      />
    </div>
  );
};

export default Chats;


