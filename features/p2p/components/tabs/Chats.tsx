"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useGroupedMessages } from "@/features/p2p/hooks/useGroupedMessages";
import { GroupedUser, postTradeMessage, getTermsAccepted, acceptTerms } from "@/features/p2p/api";
import { getTradeMessagesWebSocket, cleanupTradeMessagesWebSocket } from "@/features/p2p/services/tradeMessagesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import Link from "next/link";
import TermsAndConditionsModal from "@/features/p2p/components/ui/TermsAndConditionsModal";

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
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${isActive
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
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, any[]>>(new Map());
  const justAddedOptimisticRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevSelectedUserIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      mediaRecorder.start();
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
      await postTradeMessage(selectedUser.entity_id, {
        message: '',
        uploaded_images: [],
        uploaded_audios: [audioFile],
        duration: durationSeconds,
        sender_name: user?.email || '',
      });
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

    if (!selectedUser.entity_id) {
      console.error("No entity_id (trade_id) available");
      return;
    }

    const messageContent = messageInput.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const imagesToSend = uploadedImages;

    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      message: messageContent,
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
      // Send via HTTP POST API (same as ChatBox in orders page)
      await postTradeMessage(selectedUser.entity_id, {
        message: messageContent,
        uploaded_images: imagesToSend,
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
        <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-600 dark:text-[#A2A4A9]">
          Select a conversation on the left to start chatting.
        </div>
      );
    }

    // Use displayedMessages which includes optimistic messages
    const allMessages = displayedMessages;

    // Check if chat is closed - disable if status is "Complete"/"completed", "Responded"/"responded", or "Cancelled"/"cancelled"
    const chatStatus = selectedUser ? (selectedUser as any).status : null;
    const normalizedStatus = chatStatus ? String(chatStatus).toLowerCase() : null;
    const isChatClosed = normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "responded" || normalizedStatus === "cancelled";

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

                  {/* Image attachments (if present) */}
                  {Array.isArray(msg.images) && msg.images.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {msg.images.map((img: any, idx: number) => {
                        const imageUrl =
                          typeof img === "string"
                            ? img
                            : img?.image_url || img?.image || img?.url || "";
                        if (!imageUrl) return null;
                        return (
                          <img
                            key={`${msg.id}-img-${idx}`}
                            src={imageUrl}
                            alt={`attachment-${idx + 1}`}
                            className="w-20 h-20 rounded object-cover border border-white/20 cursor-pointer hover:opacity-90"
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
                  This chat is now closed as the trade has been {normalizedStatus === "cancelled" ? "cancelled" : "completed"}.
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
                disabled={!selectedUser || !termsAccepted || isSending || isRecording}
                className="w-8 h-8 flex-shrink-0 rounded-md bg-gray-300 dark:bg-[#374151] text-gray-600 dark:text-gray-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 dark:hover:bg-[#4B5563] transition-colors"
                title={!selectedUser ? "Select a conversation to attach images" : "Attach image"}
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
                  disabled={!selectedUser || !termsAccepted || isSending || !!audioPreview}
                  className={`w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    isRecording
                      ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                      : "bg-gray-300 dark:bg-[#374151] text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-[#4B5563]"
                  }`}
                  title={
                    !selectedUser
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
                        : (() => {
                          const status = selectedUser ? (selectedUser as any).status : null;
                          const normalizedStatus = status ? String(status).toLowerCase() : null;
                          const isClosed = normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "responded" || normalizedStatus === "cancelled";
                          return isClosed ? "Chat is closed - Trade completed or cancelled" : "Type your message...";
                        })()
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={
                    !selectedUser ||
                    !termsAccepted ||
                    isSending ||
                    isRecording ||
                    (() => {
                      const status = selectedUser ? (selectedUser as any).status : null;
                      const normalizedStatus = status ? String(status).toLowerCase() : null;
                      return normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "responded" || normalizedStatus === "cancelled";
                    })()
                  }
                  className="w-full rounded-lg bg-black dark:bg-[#374151] border-0 px-4 py-2.5 text-xs sm:text-sm text-white dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!selectedUser || !termsAccepted || isSending || isRecording}
                  className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-300 dark:bg-[#374151] text-gray-600 dark:text-gray-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 dark:hover:bg-[#4B5563] transition-colors"
                  title={!selectedUser ? "Select a conversation to use emojis" : "Pick emoji"}
                  aria-label="Pick emoji"
                  onClick={() => {
                    if (selectedUser && termsAccepted && !isSending) {
                      setShowEmojiPicker(!showEmojiPicker);
                    }
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Emoji picker dropdown */}
                {showEmojiPicker && selectedUser && (
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
                  (() => {
                    const status = selectedUser ? (selectedUser as any).status : null;
                    const normalizedStatus = status ? String(status).toLowerCase() : null;
                    return normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "responded" || normalizedStatus === "cancelled";
                  })()
                }
                className={`w-10 h-8 flex-shrink-0 rounded-lg bg-[#1D8751] text-white flex items-center justify-center transition-all ${(() => {
                  const status = selectedUser ? (selectedUser as any).status : null;
                  const normalizedStatus = status ? String(status).toLowerCase() : null;
                  const isClosed = normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "responded" || normalizedStatus === "cancelled";
                  return selectedUser &&
                    termsAccepted &&
                    (messageInput.trim() || uploadedImages.length > 0) &&
                    !isSending &&
                    !isClosed;
                })()
                  ? "opacity-100 hover:bg-[#15803D] cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
                  }`}
                title={
                  !selectedUser
                    ? "Select a conversation to send messages"
                    : !termsAccepted
                      ? "Accept terms to send messages"
                      : (() => {
                        const status = selectedUser ? (selectedUser as any).status : null;
                        const normalizedStatus = status ? String(status).toLowerCase() : null;
                        const isClosed = normalizedStatus === "complete" || normalizedStatus === "completed" || normalizedStatus === "responded" || normalizedStatus === "cancelled";
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


