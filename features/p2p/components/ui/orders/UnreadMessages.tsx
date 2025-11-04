import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/rootReducer'
import { useRouter } from 'next/navigation'
import { MdAccountCircle } from 'react-icons/md'
import { useUnreadMessagesWebSocket } from '../../../hooks/useUnreadMessagesWebSocket'

interface UnreadMessagesProps {
  loading?: boolean;
  onBackToOrders?: () => void;
}

const UnreadMessages: React.FC<UnreadMessagesProps> = ({ loading = false, onBackToOrders }) => {
  const router = useRouter()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { totalUnreadCount, recentMessages } = useSelector((state: RootState) => state.unreadMessages)

  // Use WebSocket to get real-time recent messages
  useUnreadMessagesWebSocket({
    enabled: isAuthenticated,
  })

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

  const handleMessageClick = (message: any) => {
    // Navigate to the trade chat page
    if (message.entity_id) {
      router.push(`/p2p/messages/${message.entity_id}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Please log in to view messages</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1D1D23] rounded-lg p-4 animate-pulse">
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

  if (totalUnreadCount === 0 || recentMessages.length === 0) {
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Messages
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {onBackToOrders && (
          <button
            onClick={onBackToOrders}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Back to Orders
          </button>
        )}
      </div>

      {/* Messages List - WhatsApp Style */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {recentMessages.map((message, index) => {
          const isCurrentUser = user?.email === message.sender_email
          const displayName = message.sender_name || message.sender_email?.split('@')[0] || 'Unknown'
          
          return (
            <div
              key={message.id}
              onClick={() => handleMessageClick(message)}
              className="bg-white dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-[#23232B] cursor-pointer transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1D8751] to-[#166b3e] flex items-center justify-center overflow-hidden">
                    <span className="text-white font-medium text-lg">
                      {getInitials(displayName)}
                    </span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {displayName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>

                  {/* Message Preview */}
                  <div className="flex items-center space-x-2">
                    {message.images && message.images.length > 0 && (
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {(() => {
                        if (message.content) return message.content;
                        if (message.images?.length) {
                          return `${message.images.length} image${message.images.length !== 1 ? 's' : ''}`;
                        }
                        return 'No content';
                      })()}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {!isCurrentUser && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-[#1D8751] text-white text-xs font-bold rounded-full">
                        !
                      </span>
                      <span className="text-xs text-[#1D8751] font-medium">Unread</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State if no messages in array */}
      {recentMessages.length === 0 && totalUnreadCount > 0 && (
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
