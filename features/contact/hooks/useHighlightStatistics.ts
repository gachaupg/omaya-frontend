import { useState, useEffect } from 'react';
import type { HighlightStatistics } from '../api';
import { MARKETING_HIGHLIGHT_STATS } from '@/lib/constants/marketingHighlightStats';

/** Always exposes canonical marketing stats (API may return stale values). */
export const useHighlightStatistics = () => {
  const [statistics, setStatistics] = useState<HighlightStatistics | null>(
    MARKETING_HIGHLIGHT_STATS
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatistics(MARKETING_HIGHLIGHT_STATS);
    setLoading(false);
    setError(null);
  }, []);

  return { statistics, loading, error };
};

