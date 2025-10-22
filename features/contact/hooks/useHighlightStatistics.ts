import { useState, useEffect } from 'react';
import { marketingApi, type HighlightStatistics } from '../api';

import { logger } from '@/lib/utils/logger';

export const useHighlightStatistics = () => {
  const [statistics, setStatistics] = useState<HighlightStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await marketingApi.getHighlightStatistics();
        setStatistics(data);
      } catch (err) {
        logger.error('general', 'Failed to fetch highlight statistics:', err);
        setError('Failed to load statistics');
        // Set fallback data on error
        setStatistics({
          total_transactions_usdt: '50M+',
          satisfied_clients: '5500+',
          successful_transactions: '50,000+',
          years_of_experience: '5+',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { statistics, loading, error };
};

