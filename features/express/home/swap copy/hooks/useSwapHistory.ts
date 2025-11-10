import { useState, useEffect } from "react";
import { getSwapHistory } from "../api";
import { SwapHistoryResponse } from "../types";

import { logger } from '@/lib/utils/logger';

interface UseSwapHistoryOptions {
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

export const useSwapHistory = (options: UseSwapHistoryOptions = {}) => {
  const { page = 1, limit = 10, autoFetch = true } = options;
  
  const [data, setData] = useState<SwapHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getSwapHistory({ page, limit });
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to fetch swap history");
      logger.error('swap', "Error fetching swap history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [page, limit, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchHistory,
  };
};

