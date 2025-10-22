import { useState, useEffect } from 'react';

import { logger } from '@/lib/utils/logger';

export interface ForexRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

interface ForexRatesMap {
  [key: string]: number;
}

/**
 * Hook to fetch and manage forex exchange rates
 * For now, this uses static rates but can be extended to fetch from an API
 */
export const useForexRates = () => {
  const [rates, setRates] = useState<ForexRatesMap>({
    'USD_EUR': 0.95,
    'EUR_USD': 1.05,
    'USD_GBP': 0.82,
    'GBP_USD': 1.22,
    'USD_JPY': 149.50,
    'JPY_USD': 0.0067,
    'EUR_GBP': 0.86,
    'GBP_EUR': 1.16,
    'USD_AUD': 1.55,
    'AUD_USD': 0.65,
    'USD_CAD': 1.38,
    'CAD_USD': 0.72,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get exchange rate for a currency pair
   * @param from - Source currency
   * @param to - Destination currency
   * @returns Exchange rate
   */
  const getRate = (from: string, to: string): number => {
    const key = `${from}_${to}`;
    return rates[key] || 1;
  };

  /**
   * Calculate converted amount
   * @param amount - Amount to convert
   * @param from - Source currency
   * @param to - Destination currency
   * @returns Converted amount
   */
  const convert = (amount: number, from: string, to: string): number => {
    const rate = getRate(from, to);
    return amount * rate;
  };

  /**
   * Fetch latest forex rates from API (placeholder for future implementation)
   */
  const refreshRates = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await get('/trading_engine/forex/rates/');
      // setRates(response.data);
      
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setError(null);
    } catch (err) {
      setError('Failed to fetch forex rates');
      logger.error('general', 'Error fetching forex rates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh rates every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRates();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    rates,
    loading,
    error,
    getRate,
    convert,
    refreshRates,
  };
};

export default useForexRates;

