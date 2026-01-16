"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import { useLiveChat } from '../hooks/useLiveChat';
import { logger } from '@/lib/utils/logger';

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    session,
    messages,
    isConnected,
    isConnecting,
    queueStatus,
    typingIndicator,
    error,
    startChat,
    sendMessage,
    closeChat,
  } = useLiveChat();

  // Start chat when component opens
  useEffect(() => {
    if (isOpen && !session && !isConnecting) {
      startChat();
    }
  }, [isOpen, session, isConnecting, startChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && sendMessage(message)) {
      setMessage('');
    }
  };

  const handleClose = () => {
    closeChat();
    onClose();
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Chat Button */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-[#1D8751] text-white p-4 rounded-full shadow-lg hover:bg-[#166b3e] transition-colors flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          {session && session.status === 'waiting' && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full animate-pulse"></span>
          )}
        </button>
      )}

      {/* Chat Window */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex flex-col bg-white dark:bg-[var(--card-color)] border border-[#E8EFF5] dark:border-[#35353E] rounded-t-2xl sm:rounded-2xl shadow-2xl transition-all duration-300 ${
          isMinimized
            ? 'w-0 h-0 opacity-0 pointer-events-none'
            : 'w-full sm:w-96 h-[600px] sm:h-[500px] opacity-100'
        }`}
        style={{
          bottom: isMinimized ? '-100%' : '0',
          right: isMinimized ? '-100%' : '0',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8EFF5] dark:border-[#35353E] bg-[#1D8751] text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Live Chat Support</h3>
              {session && (
                <p className="text-xs opacity-90">
                  {session.status === 'waiting'
                    ? `Waiting... (Position: ${session.queue_position || '?'})`
                    : session.status === 'active'
                    ? 'Connected'
                    : 'Closed'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-[var(--bg-color)]">
          {/* Connection Status */}
          {isConnecting && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-sm text-[#788099] dark:text-[#A3A3A3]">
                <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-[#FEE2E2] dark:bg-[#7F1D1D]/50 border border-[#EF4444] rounded-lg p-3 text-sm text-[#991B1B] dark:text-[#FCA5A5]">
              {error}
            </div>
          )}

          {/* Queue Status */}
          {session?.status === 'waiting' && queueStatus && (
            <div className="bg-[#FEF3C7] dark:bg-[#78350F]/50 border border-[#F59E0B] rounded-lg p-3 text-sm text-[#92400E] dark:text-[#FCD34D]">
              <p className="font-medium">Waiting for an agent...</p>
              {queueStatus.waiting_count > 0 && (
                <p className="text-xs mt-1">
                  {queueStatus.waiting_count} {queueStatus.waiting_count === 1 ? 'person' : 'people'} ahead of you
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.sender_role === 'user'
                    ? 'bg-[#1D8751] text-white'
                    : msg.sender_name === 'System'
                    ? 'bg-[#F3F4F6] dark:bg-[#35353E] text-[#6B7280] dark:text-[#A3A3A3]'
                    : 'bg-white dark:bg-[#1A1A1F] text-[#111827] dark:text-white border border-[#E8EFF5] dark:border-[#35353E]'
                }`}
              >
                {msg.sender_role === 'agent' && msg.sender_name !== 'System' && (
                  <p className="text-xs font-medium mb-1 opacity-80">{msg.sender_name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                <p className="text-xs mt-1 opacity-70">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {typingIndicator && typingIndicator.is_typing && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#1A1A1F] border border-[#E8EFF5] dark:border-[#35353E] rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#788099] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[#788099] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[#788099] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#E8EFF5] dark:border-[#35353E] p-4 bg-white dark:bg-[var(--card-color)]">
          {session?.status === 'closed' ? (
            <div className="text-center py-2 text-sm text-[#788099] dark:text-[#A3A3A3]">
              This chat has been closed.
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isConnected ? "Type your message..." : "Connecting..."}
                disabled={!isConnected}
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-[var(--bg-color)] border border-[#E8EFF5] dark:border-[#35353E] rounded-xl text-sm text-[#111827] dark:text-white placeholder-[#788099] focus:outline-none focus:ring-2 focus:ring-[#1D8751] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!isConnected || !message.trim()}
                className="bg-[#1D8751] text-white p-2 rounded-xl hover:bg-[#166b3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default LiveChat;

