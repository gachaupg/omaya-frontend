import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchUnreadMessages, updateUnreadCount } from '../slices/unreadMessagesSlice';
import { getUnreadMessageCount } from '../api';
import { logger } from '@/lib/utils/logger';

export const useUnreadMessages = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { totalUnreadCount, loading } = useSelector((state: RootState) => state.unreadMessages);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await getUnreadMessageCount();
      dispatch(updateUnreadCount(response.count));
      logger.debug('p2p', 'Unread message count updated:', response.count);
    } catch (error) {
      logger.error('p2p', 'Error fetching unread message count:', error);
    }
  };

  // Fetch unread messages
  const fetchMessages = async (page: number = 1, limit: number = 20) => {
    if (!isAuthenticated) return;
    
    try {
      await dispatch(fetchUnreadMessages({ page, limit })).unwrap();
    } catch (error) {
      logger.error('p2p', 'Error fetching unread messages:', error);
    }
  };

  // Auto-fetch count on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  return {
    totalUnreadCount,
    loading,
    fetchUnreadCount,
    fetchMessages,
  };
};
