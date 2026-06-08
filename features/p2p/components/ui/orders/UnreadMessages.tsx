import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/rootReducer'
import { useRouter, usePathname } from 'next/navigation'
import { MdAccountCircle } from 'react-icons/md'
import { useGroupedMessages } from '../../../hooks/useGroupedMessages'
import { GroupedUser } from '../../../api'
import {
  coalesceMessageImages,
  firstMessageImageUrl,
  shouldHideBodyTextForMediaPlaceholder,
  hasRenderableMessageImages,
} from "@/features/p2p/utils/messageMedia";

import {
  expandBucketGroupedUsers,
  resolveThreadIdFromGroup,
} from "@/features/p2p/utils/chatThreadIds";

interface UnreadMessagesProps {
  loading?: boolean;
  onBackToOrders?: () => void;
  backText?: string;
}

interface AvatarMessageItemProps {
  userGroup: any;
  displayName: string;
  photoUrl: string | null;
  latestMessage: any;
  messageCount: number;
  hasImages: boolean;
  imageCount: number;
  hasSupportDocument: boolean;
  isCurrentUser: boolean;
  onMessageClick: (entityId: string, messageType: string, userGroup?: any) => void;
}

const AvatarMessageItem: React.FC<AvatarMessageItemProps> = ({
  userGroup,
  displayName,
  photoUrl,
  latestMessage,
  messageCount,
  hasImages,
  imageCount,
  hasSupportDocument,
  isCurrentUser,
  onMessageClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div
      onClick={() => onMessageClick(userGroup.entity_id, userGroup.message_type, userGroup)}
      className="bg-white dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] rounded-lg p-0 hover:bg-gray-50 dark:hover:bg-[#23232B] cursor-pointer transition-colors"
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1D8751] to-[#166b3e] flex items-center justify-center overflow-hidden relative">
            {photoUrl && !imageError ? (
              <>
                {!imageLoaded && (
                  <span className="text-white font-medium text-lg absolute">
                    {getInitials(displayName)}
                  </span>
                )}
                <img
                  src={photoUrl}
                  alt={displayName}
                  className={`w-full h-full object-cover ${imageLoaded ? 'block' : 'hidden'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(false);
                  }}
                />
              </>
            ) : (
              <span className="text-white font-medium text-lg">
                {getInitials(displayName)}
              </span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {displayName}
              </h3>
              {userGroup.message_type && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  userGroup.message_type === 'p2p' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : userGroup.message_type === 'support'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {userGroup.message_type.toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              {latestMessage ? formatTimestamp(latestMessage.timestamp) : ''}
            </span>
          </div>

          {/* Message Preview — do not let placeholder "Image" hide real thumbnails (appeal/support use support_document too). */}
          <div className="flex items-center space-x-2 min-w-0">
            {(() => {
              const imageUrls = coalesceMessageImages(latestMessage);
              const previewUrl = firstMessageImageUrl(latestMessage);
              const hasRenderable = hasRenderableMessageImages(latestMessage);
              const hasAnyVisual = imageUrls.length > 0 || hasSupportDocument;
              const rawText = String(
                latestMessage?.content ?? latestMessage?.message ?? ""
              ).trim();
              const hidePlaceholder =
                shouldHideBodyTextForMediaPlaceholder(rawText, hasRenderable, false);

              return (
                <>
                  {hasAnyVisual && (
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {previewUrl ? (
                      <>
                        <img
                          src={previewUrl}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                        />
                        {rawText && !hidePlaceholder && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{rawText}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {rawText && !hidePlaceholder
                          ? rawText
                          : hasSupportDocument
                            ? "Attachment"
                            : hasImages
                              ? `${imageCount} image${imageCount !== 1 ? "s" : ""}`
                              : "No content"}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Message Count and Unread Badge */}
          <div className="flex items-center space-x-2 mt-2">
            {messageCount > 1 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {messageCount} message{messageCount !== 1 ? 's' : ''}
              </span>
            )}
            {!isCurrentUser && (
              <>
                <span className="inline-flex items-center justify-center w-5 h-5 bg-[#1D8751] text-white text-xs font-bold rounded-full">
                  !
                </span>
                <span className="text-xs text-[#1D8751] font-medium">Unread</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UnreadMessages: React.FC<UnreadMessagesProps> = ({ loading = false, onBackToOrders,backText = "Back to Orders", }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { totalUnreadCount } = useSelector((state: RootState) => state.unreadMessages)

  // Check if we're on the messages detail page - stop refetching if so
  const isOnMessagesPage = pathname?.includes('/p2p/messages/')

  // Use API to get messages grouped by user
  const { groupedUsers, loading: messagesLoading, error } = useGroupedMessages({
    enabled: isAuthenticated && !isOnMessagesPage, // Disable when on messages page
    limit: 100,
    refetchInterval: isOnMessagesPage ? 0 : 30000, // Stop polling when on messages page
  })

  const expandedGroupedUsers = useMemo(
    () => expandBucketGroupedUsers(groupedUsers),
    [groupedUsers]
  )

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  const handleMessageClick = (entityId: string, messageType: string, userGroup?: any) => {
    if (!entityId) return;

    if (messageType === "p2p") {
      router.push(`/p2p/messages/${entityId}`);
      return;
    }

    if (messageType === "support" || messageType === "appeal") {
      const resolvedThreadId = userGroup
        ? resolveThreadIdFromGroup(userGroup as GroupedUser)
        : entityId;
      if (userGroup) {
        const params = new URLSearchParams({
          type: messageType,
          sender_id: userGroup.sender_id?.toString() || "",
          sender_name: userGroup.sender_name || "",
          sender_email: userGroup.sender_email || "",
          messages: JSON.stringify(userGroup.messages || []),
          trade_id: resolvedThreadId,
        });
        router.push(`/p2p/messages/${resolvedThreadId}?${params.toString()}`);
      } else {
        router.push(
          `/p2p/messages/${resolvedThreadId}?type=${messageType}&trade_id=${encodeURIComponent(resolvedThreadId)}`
        );
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Please log in to view messages</p>
      </div>
    )
  }

  if (loading || messagesLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1D1D23] rounded-lg p-0 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 dark:text-red-400">
          <p className="text-sm">Error loading messages: {error}</p>
        </div>
      </div>
    )
  }

  if (totalUnreadCount === 0 || expandedGroupedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No unread messages</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You're all caught up!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Recent Messages
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onBackToOrders && (
            <button
              onClick={onBackToOrders}
              className="text-sm cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
               <span className="font-medium">{backText}</span>
            </button>
          )}
          {onBackToOrders && (
            <button
              onClick={onBackToOrders}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Close messages"
              title="Close"
            >
              <svg
                className="w-5 h-5"
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

      {/* Messages List - Grouped by User */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {expandedGroupedUsers.map((userGroup: GroupedUser, index: number) => {
          const isCurrentUser = user?.email === userGroup.sender_email
          // For support messages, show "Support" as display name
          // For p2p messages, show peer name
          const displayName = userGroup.message_type === 'p2p' 
            ? (userGroup.peer_name || userGroup.peer_email?.split('@')[0] || 'Unknown')
            : (userGroup.message_type === 'support' ? 'Support' : (userGroup.sender_name || userGroup.sender_email?.split('@')[0] || 'Unknown'))
          
          // Get the most recent message
          const latestMessage = userGroup.messages[0]
          const messageCount = userGroup.messages.length
          
          // Images: arrays + appeal/support `support_document` URL (same coalescing as Chats tab).
          const imageItems = coalesceMessageImages(latestMessage);
          const hasImages = imageItems.length > 0;
          const imageCount = imageItems.length;
          const hasSupportDocument = Boolean(
            latestMessage?.support_document &&
            (userGroup.message_type === "support" || userGroup.message_type === "appeal")
          );
          
          // Determine which photo to use based on message type
          // For P2P: use peer_photo, for support/contact: use sender_photo from message or userGroup
          const photoUrl = userGroup.message_type === 'p2p' 
            ? ((userGroup as any).peer_photo || null)
            : (latestMessage?.sender_photo || (userGroup as any).sender_photo || null)
          
          return (
            <AvatarMessageItem
              key={userGroup.entity_id || index}
              userGroup={userGroup}
              displayName={displayName}
              photoUrl={photoUrl}
              latestMessage={latestMessage}
              messageCount={messageCount}
              hasImages={hasImages}
              imageCount={imageCount}
              hasSupportDocument={hasSupportDocument}
              isCurrentUser={isCurrentUser}
              onMessageClick={handleMessageClick}
            />
          )
        })}
      </div>

      {/* Empty State if no messages in array */}
      {expandedGroupedUsers.length === 0 && totalUnreadCount > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Loading recent messages...
          </p>
        </div>
      )}
    </div>
  )
}

export default UnreadMessages
