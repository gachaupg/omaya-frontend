"use client";

import React from 'react';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useRouter } from 'next/navigation';

interface UnreadMessageIndicatorProps {
  className?: string;
  showCount?: boolean;
  onClick?: () => void;
}

const UnreadMessageIndicator: React.FC<UnreadMessageIndicatorProps> = ({
  className = '',
  showCount = true,
  onClick,
}) => {
  const { totalUnreadCount } = useUnreadMessages();
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/p2p/messages');
    }
  };

  if (totalUnreadCount === 0) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center ${className}`}
      title={`${totalUnreadCount} unread message${totalUnreadCount !== 1 ? 's' : ''}`}
    >
      <svg
        className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      
      {showCount && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] animate-pulse">
          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
        </span>
      )}
    </button>
  );
};

export default UnreadMessageIndicator;
