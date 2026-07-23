"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  setMessage,
  clearMessage,
  TradeMessage,
  setMessages,
  replaceOptimisticMessage,
  clearMessagesForTrade,
} from "@/features/p2p/slices/messageSlice";
import {
  dedupeTradeMessages,
  messageBelongsToTrade,
} from "@/features/p2p/utils/tradeMessageDedupe";
import { getTradeMessages, postTradeMessage, GroupedMessage } from "@/features/p2p/api";
import { MdAccountCircle } from "react-icons/md";
import { useTradeMessagesWebSocket } from "@/features/p2p/hooks/useTradeMessagesWebSocket";
import { useUnreadMessagesWebSocket } from "@/features/p2p/hooks/useUnreadMessagesWebSocket";
import P2PTradeCanceledModal from "./P2PTradeCanceledModal";
import { useTheme } from "@/context/theme";
import { P2P_TRADE_CANCELED_EVENT } from "@/features/p2p/constants/tradeSocketEvents";
import { Copy, RefreshCw } from "lucide-react";
import { VoiceAudioPlayer } from "@/features/p2p/components/ui/VoiceAudioPlayer";
import {
  formatRecordingDuration,
  normalizeAudioList,
} from "@/features/p2p/utils/messageMedia";
import {
  getCounterpartyEmail,
  isCurrentUserChatMessage,
  resolveChatSenderDisplayName,
  resolveChatSenderPhoto,
  resolveCounterpartyChatPhoto,
  resolveCounterpartyDisplayName,
} from "@/features/p2p/utils/chatMessageDisplay";
import { getTradePartyPhotoByEmail } from "@/features/p2p/utils/matchedTradeNotifications";

interface MessageImage {
  id: string;
  image: string;
  image_url: string;
}

// Type guard to check if image is a MessageImage object
const isMessageImage = (img: any): img is MessageImage => {
  return img && typeof img === 'object' && ('image_url' in img || 'image' in img);
};

const extractImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object") {
    return (
      img.image_url ||
      img.image ||
      img.url ||
      img.src ||
      img.file ||
      img.attachment ||
      img.path ||
      ""
    );
  }
  return "";
};

/** API often returns the same attachment in both `images` and `uploaded_images` — show once. */
const getMessageImageList = (msg: any): any[] => {
  const primary = Array.isArray(msg?.images) ? msg.images : [];
  const secondary = Array.isArray(msg?.uploaded_images) ? msg.uploaded_images : [];
  const seen = new Set<string>();
  const merged: any[] = [];

  const pushUnique = (img: any) => {
    const url = extractImageUrl(img).trim();
    if (!url) {
      merged.push(img);
      return;
    }
    const key = url.split("?")[0].toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(img);
  };

  for (const img of primary) pushUnique(img);
  for (const img of secondary) pushUnique(img);
  return merged;
};

const isValidTradeIdForMessages = (value: unknown): value is string => {
  const v = String(value ?? "").trim();
  if (!v) return false;
  if (v.toLowerCase() === "support" || v.toLowerCase() === "undefined" || v.toLowerCase() === "null") {
    return false;
  }
  return true;
};

const extractIdFromMessageId = (value: unknown): string => {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (v.includes("_initial")) {
    const candidate = v.split("_initial")[0]?.trim();
    if (isValidTradeIdForMessages(candidate)) return candidate;
  }
  return "";
};

const ChatBox: React.FC<{
  tradeId: string;
  userId: string;
  userName: string;
  autoreply: string;
  seller_photo: string;
  buyer_photo?: string;
  buyer?: string;
  seller?: string;
  currentUserEmail?: string;
  advertiserEmail?: string;
  /** `buy` | `sell` — used when buyer/seller emails alone cannot resolve counterparty photo */
  orderType?: string;
  owner: string;
  buyerName?: string;
  sellerName?: string;
  messageType?: 'p2p' | 'support';
  peerName?: string;
  supportMessages?: GroupedMessage[];
  onClose?: () => void;
}> = ({ tradeId, userId, userName, autoreply, seller_photo, buyer_photo, buyer, seller, currentUserEmail, orderType, owner, buyerName, sellerName, messageType = 'p2p', peerName, supportMessages, onClose }) => {

  const tradePhotoContext = React.useMemo(
    () => ({
      buyer,
      seller,
      buyer_photo,
      seller_photo,
      owner,
      order_type: orderType,
    }),
    [buyer, seller, buyer_photo, seller_photo, owner, orderType]
  );

  const dispatch = useDispatch();
  const message = useSelector((state: RootState) => state.message.message);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  // Get messages from Redux (populated by WebSocket) and sort by timestamp
  const messagesFromRedux = useSelector(
    (state: RootState) => state.message.messages[tradeId] || []
  );

  const sortedMessages = React.useMemo(() => {
    const scoped = messagesFromRedux.filter((msg) =>
      messageBelongsToTrade(msg, tradeId)
    );
    return dedupeTradeMessages([...scoped], currentUserEmail);
  }, [messagesFromRedux, tradeId, currentUserEmail]);

  const counterpartyEmail = React.useMemo(
    () => getCounterpartyEmail(currentUserEmail, { buyer, seller }),
    [currentUserEmail, buyer, seller]
  );

  const otherPersonData = React.useMemo(() => {
    const peerPhoto =
      resolveCounterpartyChatPhoto(
        sortedMessages,
        currentUserEmail,
        tradePhotoContext
      ) ||
      getTradePartyPhotoByEmail(counterpartyEmail, tradePhotoContext);

    if (messageType === "support") {
      return {
        photo: peerPhoto,
        displayName: peerName || "Support",
      };
    }

    return {
      photo: peerPhoto,
      displayName: resolveCounterpartyDisplayName({
        currentUserEmail,
        buyer,
        seller,
        buyerName,
        sellerName,
        peerName,
        owner,
        orderType,
        advertiserName: userName,
        messages: sortedMessages,
      }),
    };
  }, [
    sortedMessages,
    currentUserEmail,
    tradePhotoContext,
    counterpartyEmail,
    buyer,
    seller,
    buyerName,
    sellerName,
    messageType,
    peerName,
    owner,
    orderType,
    userName,
  ]);

  const apiTradeId = React.useMemo(() => {
    if (isValidTradeIdForMessages(tradeId)) return tradeId;
    if (messageType !== "support") return null;

    const candidates: unknown[] = [];
    if (Array.isArray(supportMessages)) {
      for (const msg of supportMessages) {
        const m = msg as any;
        candidates.push(
          m?.trade_id,
          m?.trade,
          m?.entity_id,
          m?.support_request_id,
          extractIdFromMessageId(m?.id)
        );
      }
    }

    for (const c of candidates) {
      if (isValidTradeIdForMessages(c)) return String(c).trim();
    }
    return null;
  }, [tradeId, messageType, supportMessages]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedChatId, setCopiedChatId] = useState(false);
  const [tradeCanceledModal, setTradeCanceledModal] = useState<{
    open: boolean;
    message?: string;
  }>({ open: false });
  const { isDark } = useTheme();

  const handleCopyChatId = () => {
    if (tradeId) {
      navigator.clipboard.writeText(tradeId);
      setCopiedChatId(true);
      setTimeout(() => setCopiedChatId(false), 2000);
    }
  };

  // Add file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // Use WebSocket for real-time messages only for P2P messages
  // For support messages, use API polling instead
  const { isConnected: wsConnected } = useTradeMessagesWebSocket({
    tradeId,
    enabled: isAuthenticated && messageType === 'p2p', // Only enable WebSocket for P2P messages
    onTradeCanceled: ({ message: cancelMsg }) => {
      setTradeCanceledModal((prev) =>
        prev.open ? prev : { open: true, message: cancelMsg }
      );
    },
  });

  // Secondary real-time channel: unread-messages socket.
  // If trade-messages socket misses/defers an event, this channel still nudges an immediate refresh.
  useUnreadMessagesWebSocket({
    enabled: isAuthenticated && messageType === "p2p" && !!tradeId,
    onRecentMessages: (recent) => {
      if (!Array.isArray(recent) || recent.length === 0) return;
      const currentTrade = String(tradeId || "").trim();
      if (!currentTrade) return;
      const hasCurrentTradeUpdate = recent.some((m: any) => {
        const entity = String(m?.entity_id ?? "").trim();
        return entity && entity === currentTrade;
      });
      if (hasCurrentTradeUpdate) {
        fetchMessages();
      }
    },
  });

  useEffect(() => {
    setTradeCanceledModal({ open: false, message: undefined });
  }, [tradeId]);

  useEffect(() => {
    if (!tradeId || messageType !== "p2p") return;
    const onCanceled = (e: Event) => {
      const d = (e as CustomEvent<{ tradeId?: string; message?: string }>).detail;
      if (d?.tradeId == null || String(d.tradeId) !== String(tradeId)) return;
            setTradeCanceledModal((prev) =>
        prev.open ? prev : { open: true, message: d.message }
      );
    };
    window.addEventListener(P2P_TRADE_CANCELED_EVENT, onCanceled);
    return () => window.removeEventListener(P2P_TRADE_CANCELED_EVENT, onCanceled);
  }, [tradeId, messageType]);

  // Ref for auto-scroll
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesListRef = React.useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const prevMessageCountRef = React.useRef(0);
  const [imageLoadingStates, setImageLoadingStates] = React.useState<Record<string, boolean>>({});

  // Audio recording state (like P2P trading chat)
  const [audioPreview, setAudioPreview] = useState<{ file: File; duration: number; url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingStartRef = React.useRef<number>(0);

  // Track user scroll behavior
  const handleScroll = React.useCallback(() => {
    if (messagesListRef.current) {
      const container = messagesListRef.current;
      const scrollThreshold = 50; // pixels from bottom
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom < scrollThreshold;

      setIsAtBottom(isNearBottom);

      // If user scrolls up significantly, mark as manually scrolled
      if (distanceFromBottom > scrollThreshold) {
        setUserHasScrolled(true);
      } else {
        // If user scrolls back to bottom, reset flag
        setUserHasScrolled(false);
      }
    }
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesListRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Live mm:ss counter while recording audio
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const tick = () => {
      setRecordingSeconds(Math.floor((Date.now() - recordingStartRef.current) / 1000));
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Smart auto-scroll when messages update
  useEffect(() => {
    const messageCountChanged = prevMessageCountRef.current !== sortedMessages.length;
    prevMessageCountRef.current = sortedMessages.length;

    // Only auto-scroll if:
    // 1. User hasn't manually scrolled up OR is already at bottom
    // 2. There are new messages (count changed)
    if (messageCountChanged && (!userHasScrolled || isAtBottom)) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [sortedMessages, userHasScrolled, isAtBottom]);

  const lastFetchFingerprintRef = React.useRef<string>("");
  const fetchGenerationRef = React.useRef(0);

  // Fetch messages — merge by default; replace only on trade switch / initial load.
  const fetchMessages = React.useCallback(
    async (options?: { replace?: boolean }) => {
      if (isAuthenticated && apiTradeId) {
        const generation = fetchGenerationRef.current;
        const replace = options?.replace === true;
        setIsRefreshing(true);
        try {
          const data = await getTradeMessages(apiTradeId);
          if (generation !== fetchGenerationRef.current) return;
          const { setMessages } = await import("@/features/p2p/slices/messageSlice");
          const results = (data as any)?.results;
          if (!Array.isArray(results)) return;

          const fingerprint = results
            .map((m: any) =>
              [
                m?.id,
                m?.message ?? m?.content ?? "",
                Array.isArray(m?.audios) ? m.audios.length : 0,
                m?.audios?.[0]?.audio_url ?? m?.audio_url ?? "",
                Array.isArray(m?.images) ? m.images.length : 0,
                m?.timestamp ?? "",
              ].join("|")
            )
            .join(";;");
          if (!replace && fingerprint === lastFetchFingerprintRef.current) return;
          lastFetchFingerprintRef.current = fingerprint;

          dispatch(
            setMessages({
              tradeId,
              messages: results,
              replace,
            })
          );
        } catch (error) {
          // Silent error
        } finally {
          setIsRefreshing(false);
        }
      }
    },
    [isAuthenticated, apiTradeId, dispatch, tradeId]
  );

  // Polling interval for support/fallback refresh
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const SUPPORT_POLL_MS = 5000;
  const P2P_FALLBACK_POLL_MS = 1500;

  // On trade change, wipe this trade's bucket and ignore in-flight fetches.
  useEffect(() => {
    fetchGenerationRef.current += 1;
    lastFetchFingerprintRef.current = "";
    if (!tradeId) return;
    dispatch(clearMessagesForTrade(tradeId));
  }, [tradeId, dispatch]);

  useEffect(() => {
    // If support messages are passed as props, use them directly (don't fetch)
    if (messageType === 'support' && supportMessages && supportMessages.length > 0) {
      // Convert GroupedMessage[] to TradeMessage[] format and set in Redux
      const convertedMessages: TradeMessage[] = supportMessages.map((msg) => ({
        id: msg.id,
        trade: parseInt(tradeId) || 0,
        sender: msg.sender_id ?? 0,
        sender_name: msg.sender_name || '',
        message: msg.content,
        images: Array.isArray(msg.images) ? msg.images.map((img: any) =>
          typeof img === 'string' ? img : img.image_url || img.image
        ) : [],
        timestamp: msg.timestamp,
        seller_photo: seller_photo || '',
      }));
      dispatch(
        setMessages({
          tradeId,
          messages: convertedMessages,
          replace: true,
        })
      );
      return;
    }

    lastFetchFingerprintRef.current = "";

    // Fetch initial messages once on mount (replace after bucket was cleared)
    if (messageType === 'p2p') {
      fetchMessages({ replace: true });
    } else if (messageType === 'support') {
      // For support: Use API polling (only if not passed as props)
      if (!supportMessages || supportMessages.length === 0) {
        fetchMessages({ replace: true });
        pollingIntervalRef.current = setInterval(() => {
          fetchMessages();
        }, SUPPORT_POLL_MS);
      }
    } else {
      fetchMessages({ replace: true });
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [tradeId, messageType, fetchMessages, supportMessages, dispatch]);

  // Poll only when WebSocket is disconnected — avoids audio player reload flicker.
  useEffect(() => {
    if (messageType !== "p2p") return;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (wsConnected) return;
    pollingIntervalRef.current = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchMessages();
    }, P2P_FALLBACK_POLL_MS);
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [messageType, wsConnected, fetchMessages]);

  // Auto-refresh when websocket message may still be incomplete (media delayed by backend processing).
  const lastMessageIdRef = React.useRef<string | null>(null);
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if the latest message has images and needs refresh
    if (sortedMessages.length > 0) {
      const latestMessage = sortedMessages[sortedMessages.length - 1];

      // Only process if this is a new message (different ID from last processed)
      if (latestMessage.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = latestMessage.id;

        const hasTemporaryId = latestMessage.id && latestMessage.id.toString().startsWith('temp-');
        const hasText = !!(latestMessage.message && String(latestMessage.message).trim().length > 0);
        const hasImages = Array.isArray((latestMessage as any).images) && (latestMessage as any).images.length > 0;
        const hasAudios =
          (Array.isArray((latestMessage as any).audios) && (latestMessage as any).audios.length > 0) ||
          !!((latestMessage as any).audio_url || (latestMessage as any).audio || (latestMessage as any).recording_url);
        const likelyIncompleteMediaMessage = !hasText && !hasImages && !hasAudios;

        // Refresh for optimistic temp messages and for websocket messages that arrive blank first.
        if (hasTemporaryId || likelyIncompleteMediaMessage) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }

          // Schedule a quick refetch from API to pull final media URLs.
          refreshTimeoutRef.current = setTimeout(() => {
            fetchMessages();
          }, 150);
        }
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [sortedMessages.length, fetchMessages]); // Only trigger when message count changes

  // Handle manual refresh
  const handleRefresh = () => {
    fetchMessages();
  };

  // Audio recording handlers (mirroring P2P trading chat)
  const startRecording = async () => {
    if (!isAuthenticated || !tradeId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStartRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const durationSeconds = Math.round(
          (Date.now() - recordingStartRef.current) / 1000
        );
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "m4a";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, {
          type: mimeType,
        });
        const url = URL.createObjectURL(blob);
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setAudioPreview({ file, duration: durationSeconds, url });
      };
      mediaRecorder.start(500);
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
            setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  const handleSendAudioMessage = async (
    audioFile: File,
    durationSeconds: number = 0
  ) => {
    if (!apiTradeId) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: TradeMessage = {
      id: tempId,
      trade: parseInt(tradeId) || tradeId,
      trade_id: tradeId,
      sender: currentUserEmail || "",
      sender_name: currentUserEmail || "",
      sender_username: userName || "",
      message: "",
      images: [],
      audios: [
        {
          id: tempId,
          audio_url: URL.createObjectURL(audioFile),
          duration: durationSeconds,
        },
      ],
      timestamp: new Date().toISOString(),
      seller_photo: "",
    };

    const { addMessageFromWS } = await import("@/features/p2p/slices/messageSlice");
    dispatch(addMessageFromWS({ tradeId, message: optimisticMessage }));

    try {
      const response = await postTradeMessage(apiTradeId, {
        message: "",
        uploaded_images: [],
        uploaded_audios: [audioFile],
        duration: durationSeconds,
        sender_name: currentUserEmail || "",
      });

      const created = (response as any)?.id != null ? (response as TradeMessage) : null;
      if (created?.id) {
        dispatch(
          replaceOptimisticMessage({
            tradeId,
            tempId,
            message: {
              ...created,
              id: String(created.id),
              trade_id: (created as any).trade_id || tradeId,
              message: "",
              sender_name: created.sender_name || currentUserEmail || "",
              audios:
                Array.isArray(created.audios) && created.audios.length > 0
                  ? created.audios
                  : optimisticMessage.audios,
              audio_url: (created as any).audio_url || optimisticMessage.audios?.[0]?.audio_url,
            },
          })
        );
      }

      // Refresh for final audio URLs when uploads are still processing
      fetchMessages();
    } catch (e) {
            fetchMessages();
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

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Store File objects directly for FormData upload
      setUploadedImages(filesArray);
      // Clear the input to allow selecting the same files again
      e.target.value = '';
    }
  };

  // Update handleSend to include images and sender email
  const handleSend = async () => {
    if (!apiTradeId) return;
    if (!message.trim() && uploadedImages.length === 0) return;

    const messageContent = message;
    const images = uploadedImages;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: TradeMessage = {
      id: tempId,
      trade: parseInt(tradeId) || tradeId,
      trade_id: tradeId,
      sender: currentUserEmail || '',
      sender_name: currentUserEmail || '',
      sender_username: userName || '',
      message: messageContent,
      images: images.map(file => URL.createObjectURL(file)), // Create preview URLs
      timestamp: new Date().toISOString(),
      seller_photo: '',
    };

    // Add optimistic message to Redux immediately
    const { addMessageFromWS } = await import("@/features/p2p/slices/messageSlice");
    dispatch(addMessageFromWS({ tradeId, message: optimisticMessage }));

    // Clear input and images immediately for better UX
    dispatch(clearMessage());
    setUploadedImages([]);

    try {
      // Send via HTTP
      const response = await postTradeMessage(apiTradeId, {
        message: messageContent || '',
        uploaded_images: images,
        sender_name: currentUserEmail || ""
      });

      const created = (response as any)?.id != null ? (response as TradeMessage) : null;
      if (created?.id) {
        const createdText = String(
          (created as any).message ?? (created as any).content ?? messageContent
        );
        dispatch(
          replaceOptimisticMessage({
            tradeId,
            tempId,
            message: {
              ...created,
              id: String(created.id),
              trade_id: (created as any).trade_id || tradeId,
              message: createdText,
              sender_name: created.sender_name || currentUserEmail || "",
              images:
                Array.isArray(created.images) && created.images.length > 0
                  ? created.images
                  : optimisticMessage.images,
            },
          })
        );
      }

      // Refresh for final S3 URLs when uploads are still processing
      fetchMessages();
    } catch (e) {
      // On error, restore the message and images
      dispatch(setMessage(messageContent));
      setUploadedImages(images);

      // Remove the optimistic message
      fetchMessages();
    }
  };

  // Function to scroll to bottom manually
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setUserHasScrolled(false);
  };

  return (
    <>
    <div>
      <div className="flex items-center justify-between gap-2 text-xs mb-2">
        <span className="truncate">Chat with {otherPersonData.displayName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-[#1D8751] dark:bg-[#1D8751] text-white hover:bg-[#166b3e] transition-colors disabled:opacity-50 shrink-0"
            title="Refresh messages and load images"
            aria-label="Refresh messages"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 dark:hover:bg-accent transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
              aria-label="Close chat"
              title="Close"
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="chat-container mt-4 sm:mt-6 flex flex-col mb-2 h-80 sm:h-96 bg-card border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] p-2 sm:p-4 relative">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {otherPersonData.photo ? <img className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" src={otherPersonData.photo} alt={otherPersonData.displayName} /> : <MdAccountCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#1D8751] flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-md truncate">{otherPersonData.displayName}</div>
                {tradeId && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">ID: {tradeId}</span>
                    <button
                      onClick={handleCopyChatId}
                      className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors text-[#1D8751] flex-shrink-0"
                      title={copiedChatId ? "Copied!" : "Copy chat ID"}
                      aria-label="Copy chat ID"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    {copiedChatId && (
                      <span className="text-[10px] text-[#1D8751] font-medium">Copied!</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <hr className="border-[#E8EFF5] dark:border-[#35353E] mt-2 flex-shrink-0" />
        <div
          ref={messagesListRef}
          className="messages-list flex-1 flex flex-col gap-2 overflow-y-auto mb-2 min-h-0"
        >
          {autoreply && (
            <p className="text-[#051015] dark:text-white bg-gray-100 dark:bg-[var(--card-color)] p-2 rounded-lg text-sm italic">
              {autoreply}
            </p>
          )}
          {sortedMessages.map((msg) => {
            const isSender = isCurrentUserChatMessage(
              msg,
              currentUserEmail,
              userId
            );

            const displayName = resolveChatSenderDisplayName(msg, {
              isCurrentUser: isSender,
              buyerName,
              sellerName,
              buyerEmail: buyer,
              sellerEmail: seller,
              counterpartyDisplayName: otherPersonData.displayName,
            });

            const messagePhoto = resolveChatSenderPhoto(msg, {
              currentUserEmail,
              tradePhotoContext,
            });

            const messageImages = getMessageImageList(msg);

            return (
              <div
                key={msg.id}
                className={`flex gap-2 items-end ${isSender ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Show photo only for receiver messages */}
                {!isSender && (
                  <div className="flex-shrink-0">
                    {messagePhoto ? (
                      <img
                        className="w-8 h-8 rounded-full object-cover"
                        src={messagePhoto}
                        alt={displayName}
                      />
                    ) : (
                      <MdAccountCircle className="w-8 h-8 text-[#1D8751]" />
                    )}
                  </div>
                )}

                <div
                  className={
                    isSender
                      ? "bg-[#1D8751] text-white rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-xs min-w-[100px] sm:min-w-[120px]"
                      : "bg-gray-200 dark:bg-[#35353E] dark:text-white text-gray-900 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-xs min-w-[100px] sm:min-w-[120px]"
                  }
                >
                  {/* Show sender username - "You" for own messages, username for their messages */}
                  <div className={`text-xs font-semibold mb-1 ${isSender ? "text-green-100" : "text-[#1D8751] dark:text-[#1D8751]"}`}>
                    {displayName}
                  </div>
                  {msg.message && msg.message.trim() && <div className="text-xs sm:text-sm break-words mb-2">{msg.message}</div>}

                  {/* Image attachments */}
                  {messageImages.length > 0 && (
                    <div className={msg.message && msg.message.trim() ? "mt-0" : "mt-0"}>
                      <div className="flex gap-2 flex-wrap justify-start">
                        {messageImages.map((img: any, idx: number) => {
                          const imageUrl = extractImageUrl(img);

                          const imageKey = (isMessageImage(img) && img.id) ? img.id : `img-${msg.id}-${idx}`;

                          // If no valid URL, show a simple placeholder
                          if (!imageUrl || imageUrl.trim() === '') {
                            return (
                              <div key={imageKey} className="relative inline-block">
                                <div className="w-24 h-24 rounded bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-[#1D8751] flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">No Image</div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={imageKey} className="relative inline-block">
                              {/* Loading spinner overlay */}
                              {imageLoadingStates[imageKey] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded z-10">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751]"></div>
                                </div>
                              )}
                              <div className="relative w-24 h-24">
                                <img
                                  src={imageUrl}
                                  alt={`attachment-${idx + 1}`}
                                  className="w-full h-full rounded object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-[#1D8751] bg-white dark:bg-gray-800"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                  onLoadStart={() => {
                                    setImageLoadingStates(prev => ({ ...prev, [imageKey]: true }));
                                  }}
                                  onLoad={(e) => {
                                    setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                  }}
                                  onError={(e) => {
                                    setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
                                  }}
                                  style={{ display: 'block' }}
                                />
                              </div>
                              <div className="text-xs mt-1 text-center">
                                <a
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1D8751] dark:text-[#1D8751] hover:underline font-medium"
                                >
                                  View Full
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Voice/audio messages */}
                  {(() => {
                    const anyMsg: any = msg;
                    const audioList = normalizeAudioList(anyMsg);
                    if (audioList.length === 0) return null;
                    return (
                      <div className="mt-1 flex flex-col gap-2">
                        {audioList.map((a, idx) => (
                          <VoiceAudioPlayer
                            key={a.id || `audio-${msg.id}-${idx}`}
                            src={a.audio_url}
                            duration={a.duration}
                          />
                        ))}
                      </div>
                    );
                  })()}
                  <div className={`text-xs mt-1 ${isSender ? "text-green-100" : "text-gray-500 dark:text-gray-400"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button - only show when user has scrolled up */}
        {userHasScrolled && !isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-16 sm:bottom-20 right-2 sm:right-14 bg-[#1D8751] text-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-[#166339] transition-colors z-10 animate-bounce"
            title="Scroll to bottom"
          >
            <svg
              width="16"
              height="16"
              className="sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <hr className="border-[#E8EFF5] dark:border-[#35353E] mt-2 flex-shrink-0" />
        {/* Audio preview - listen before sending */}
        {audioPreview && (
          <div className="flex items-center gap-3 p-2 mt-2 rounded-lg bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151] flex-shrink-0">
            <audio
              src={audioPreview.url}
              controls
              className="h-8 max-w-[160px]"
            />
            <span className="text-[11px] text-gray-600 dark:text-gray-400 tabular-nums">
              {formatRecordingDuration(audioPreview.duration)}
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={handleSendAudioPreview}
                className="px-2.5 py-1 rounded-md bg-[#1D8751] text-white text-xs font-medium hover:bg-[#176b40]"
              >
                Send
              </button>
              <button
                type="button"
                onClick={handleDiscardAudioPreview}
                className="px-2.5 py-1 rounded-md bg-gray-300 dark:bg-[#4B5563] text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-400 dark:hover:bg-[#6B7280]"
              >
                Discard
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-1.5 sm:gap-2 mt-2 flex-shrink-0">
          <input
            className="flex-1 min-w-0 rounded px-2 py-1.5 sm:py-1 text-xs sm:text-sm text-[#788099] dark:text-white border-none outline-none"
            value={message}
            onChange={(e) => dispatch(setMessage(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Enter your message"
          />
          {/* Paperclip icon for image upload */}
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 dark:bg-[var(--card-color)] bg-gray-100 rounded-lg flex-shrink-0"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Attach image"
          >
            <svg width="16" height="16" className="sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <path
                d="M16.5 6.5l-7.8 7.8a3 3 0 104.2 4.2l7.1-7.1a5 5 0 00-7.1-7.1l-8.5 8.5"
                stroke="#1D8751"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          {/* Audio recording - record voice message with seconds count */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isRecording && (
              <span className="text-[10px] sm:text-xs font-medium text-red-500 tabular-nums min-w-[5ch]">
                {formatRecordingDuration(recordingSeconds)}
              </span>
            )}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isAuthenticated || !!audioPreview}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  : "bg-gray-100 dark:bg-[#35353E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4B5563]"
              }`}
              title={
                audioPreview
                  ? "Send or discard the current recording first"
                  : isRecording
                  ? "Click to stop recording"
                  : "Record voice message"
              }
              aria-label={isRecording ? "Stop recording" : "Record voice message"}
            >
              {isRecording ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3a4 4 0 00-4 4v5a4 4 0 108 0V7a4 4 0 00-4-4z" />
                  <path d="M6 11a1 1 0 00-2 0 8 8 0 0014 5.291V15a1 1 0 10-2 0v1.291A6 6 0 016 11z" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim() && uploadedImages.length === 0}
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-[#1D8751] text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg
              width="18"
              height="18"
              className="sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {/* Preview selected images */}
        {uploadedImages.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap flex-shrink-0">
            {uploadedImages.map((file, idx) => (
              <div key={idx} className="relative w-12 h-12">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`preview-${idx}`}
                  className="w-full h-full object-cover rounded border border-[#35353E]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    <P2PTradeCanceledModal
      isOpen={tradeCanceledModal.open}
      message={tradeCanceledModal.message}
      onClose={() => setTradeCanceledModal({ open: false })}
      isDark={isDark}
    />
    </>
  );
};

export default ChatBox;


