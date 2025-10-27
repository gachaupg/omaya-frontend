"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchUnreadMessages, markAsRead, markAllAsRead, setCurrentPage } from "@/features/p2p/slices/unreadMessagesSlice";
import { useRouter } from "next/navigation";
import { UnreadMessage } from "@/features/p2p/slices/unreadMessagesSlice";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

const UnreadMessagesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { messages, loading, error, currentPage, totalUnreadCount } = useSelector(
    (state: RootState) => state.unreadMessages
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadMessages({ page: currentPage, limit: 20 }));
    }
  }, [dispatch, isAuthenticated, currentPage]);

  const handleMarkAsRead = async (message: UnreadMessage) => {
    try {
      await dispatch(markAsRead({ 
        messageId: message.id, 
        tradeId: message.trade_id 
      })).unwrap();
      toast.success("Message marked as read");
    } catch (error) {
      logger.error("p2p", "Error marking message as read:", error);
      toast.error("Failed to mark message as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      toast.success("All messages marked as read");
    } catch (error) {
      logger.error("p2p", "Error marking all messages as read:", error);
      toast.error("Failed to mark all messages as read");
    }
  };

  const handleSelectMessage = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMessages.size === messages.results.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.results.map(m => m.id)));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      const promises = Array.from(selectedMessages).map(messageId => {
        const message = messages.results.find(m => m.id === messageId);
        if (message) {
          return dispatch(markAsRead({ 
            messageId: message.id, 
            tradeId: message.trade_id 
          }));
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      setSelectedMessages(new Set());
      toast.success("Selected messages marked as read");
    } catch (error) {
      logger.error("p2p", "Error marking selected messages as read:", error);
      toast.error("Failed to mark selected messages as read");
    }
  };

  const handleViewTrade = (tradeId: string) => {
    router.push(`/p2p/${tradeId}/matched`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTradeTypeColor = (type: "buy" | "sell") => {
    return type === "buy" ? "text-green-600" : "text-red-600";
  };

  const getTradeTypeBg = (type: "buy" | "sell") => {
    return type === "buy" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view your unread messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#18181D] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Unread Messages
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              {selectedMessages.size > 0 && (
                <button
                  onClick={handleMarkSelectedAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark Selected as Read ({selectedMessages.size})
                </button>
              )}
              {totalUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1D1D23] rounded-lg p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading messages
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : messages.results.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No unread messages</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You're all caught up! No unread messages at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={selectedMessages.size === messages.results.length && messages.results.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select All
              </label>
            </div>

            {/* Messages */}
            {messages.results.map((message) => (
              <div
                key={message.id}
                className={`bg-white dark:bg-[#1D1D23] rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ${
                  selectedMessages.has(message.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(message.id)}
                    onChange={() => handleSelectMessage(message.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.counterparty_photo ? (
                      <img
                        src={message.counterparty_photo}
                        alt={message.counterparty_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {message.counterparty_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.counterparty_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTradeTypeBg(message.trade_type)} ${getTradeTypeColor(message.trade_type)}`}>
                          {message.trade_type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        <button
                          onClick={() => handleViewTrade(message.trade_id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          View Trade
                        </button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {message.message}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Trade #{message.trade_id}</span>
                        <span>{message.amount} {message.currency}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          message.trade_status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {message.trade_status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleMarkAsRead(message)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Mark as Read
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {messages.results.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {messages.results.length} of {messages.count} messages
            </div>
            <div className="flex space-x-2">
              {messages.previous && (
                <button
                  onClick={() => dispatch(setCurrentPage(currentPage - 1))}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
              )}
              {messages.next && (
                <button
                  onClick={() => dispatch(setCurrentPage(currentPage + 1))}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnreadMessagesPage;
