import { useMemo } from 'react';

interface UseDataDisplayProps<T> {
  data: T[] | null | undefined;
  loading: boolean;
  error: string | null;
  fallbackData?: T[];
  dataName: string;
}

interface UseDataDisplayReturn<T> {
  displayData: T[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
  shouldShowLoading: boolean;
  shouldShowData: boolean;
}

/**
 * Custom hook to handle consistent data display logic
 * Always shows cached data when available, regardless of loading state
 */
export function useDataDisplay<T>({
  data,
  loading,
  error,
  fallbackData = [],
  dataName,
}: UseDataDisplayProps<T>): UseDataDisplayReturn<T> {
  return useMemo(() => {
    // Determine what data to display
    const displayData = data || fallbackData;
    const hasData = displayData && displayData.length > 0;
    const hasError = !!error;
    const isEmpty = !hasData;
    
    // Show loading only if no cached data is available and we're currently loading
    const shouldShowLoading = loading && !hasData;
    
    // Show data if we have any data available (cached or fresh)
    const shouldShowData = hasData;
    
    console.log(`📊 ${dataName} Display State:`, {
      hasData,
      hasError,
      isEmpty,
      shouldShowLoading,
      shouldShowData,
      dataLength: data?.length || 0,
      fallbackLength: fallbackData?.length || 0,
      displayLength: displayData?.length || 0,
      loading,
    });

    return {
      displayData: displayData || [],
      isLoading: shouldShowLoading,
      hasError,
      errorMessage: error,
      isEmpty,
      shouldShowLoading,
      shouldShowData,
    };
  }, [data, loading, error, fallbackData, dataName]);
}

/**
 * Hook specifically for assets data with common fallback assets
 */
export function useAssetsDisplay(
  exchangeAssets: any[] | null | undefined,
  swapAssets: any[] | null | undefined,
  exchangeLoading: boolean,
  swapLoading: boolean,
  exchangeError: string | null,
  swapError: string | null
) {
  // Combine both asset sources
  const combinedAssets = useMemo(() => {
    const assets = [];
    
    // Add exchange assets if available
    if (exchangeAssets && exchangeAssets.length > 0) {
      assets.push(...exchangeAssets);
    }
    
    // Add swap assets if available (avoid duplicates)
    if (swapAssets && swapAssets.length > 0) {
      const existingSymbols = new Set(assets.map(asset => asset?.ticker || asset?.symbol));
      const uniqueSwapAssets = swapAssets.filter(asset => 
        !existingSymbols.has(asset?.ticker || asset?.symbol)
      );
      assets.push(...uniqueSwapAssets);
    }
    
    return assets;
  }, [exchangeAssets, swapAssets]);

  // Common fallback assets
  const fallbackAssets = useMemo(() => [
    {
      asset_id: "fallback-usdt-bsc",
      ticker: "USDT",
      symbol: "USDT",
      name: "Tether USD",
      network: "BSC",
      image_url: "",
      is_fiat: false,
      is_stable: true,
    },
    {
      asset_id: "fallback-btc",
      ticker: "BTC",
      symbol: "BTC", 
      name: "Bitcoin",
      network: "BTC",
      image_url: "",
      is_fiat: false,
      is_stable: false,
    },
    {
      asset_id: "fallback-eth",
      ticker: "ETH",
      symbol: "ETH",
      name: "Ethereum", 
      network: "ETH",
      image_url: "",
      is_fiat: false,
      is_stable: false,
    },
  ], []);

  const isAnyLoading = exchangeLoading || swapLoading;
  const hasAnyError = !!exchangeError || !!swapError;
  const errorMessage = exchangeError || swapError;

  return useDataDisplay({
    data: combinedAssets,
    loading: isAnyLoading,
    error: hasAnyError ? errorMessage : null,
    fallbackData: fallbackAssets,
    dataName: 'Assets',
  });
}

/**
 * Hook specifically for payment methods data
 */
export function usePaymentMethodsDisplay(
  paymentMethods: any[] | null | undefined,
  loading: boolean,
  error: string | null
) {
  // Common fallback payment methods
  const fallbackPaymentMethods = useMemo(() => [
    {
      provider_name: "Bank Transfer",
      payment_method: "Bank Transfer",
      payment_method_type: "bank_transfer",
      account_name: "Demo Bank Account",
      account_number: "****1234",
    },
    {
      provider_name: "Mobile Money",
      payment_method: "Mobile Money", 
      payment_method_type: "mobile_money",
      account_name: "Demo Mobile Account",
      account_number: "****5678",
    },
  ], []);

  return useDataDisplay({
    data: paymentMethods,
    loading,
    error,
    fallbackData: fallbackPaymentMethods,
    dataName: 'Payment Methods',
  });
}
