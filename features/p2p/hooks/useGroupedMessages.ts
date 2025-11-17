import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchGroupedMessages } from "../slices/unreadMessagesSlice";
import { logger } from "@/lib/utils/logger";

interface UseGroupedMessagesOptions {
  enabled?: boolean;
  limit?: number;
  refetchInterval?: number; // Polling interval in milliseconds
}

/**
 * Hook for fetching messages grouped by user using API instead of WebSocket
 *
 * @param options Configuration options
 * @returns Loading state and error
 */
export const useGroupedMessages = (
  options: UseGroupedMessagesOptions = {}
) => {
  const { enabled = true, limit = 100, refetchInterval } = options;
  const dispatch = useDispatch<AppDispatch>();
  const { groupedUsers, groupedMessagesLoading, groupedMessagesError } = useSelector(
    (state: RootState) => state.unreadMessages
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial fetch
    dispatch(fetchGroupedMessages({ limit }));

    // Set up polling if refetchInterval is provided
    let intervalId: NodeJS.Timeout | null = null;
    if (refetchInterval && refetchInterval > 0) {
      intervalId = setInterval(() => {
        logger.debug("grouped-messages", "Polling for grouped messages");
        dispatch(fetchGroupedMessages({ limit }));
      }, refetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, limit, refetchInterval, dispatch]);

  return {
    groupedUsers,
    loading: groupedMessagesLoading,
    error: groupedMessagesError,
    refetch: () => dispatch(fetchGroupedMessages({ limit })),
  };
};












