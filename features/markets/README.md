# Markets Feature - CoinGecko API Integration

This feature provides real-time cryptocurrency market data integration using the CoinGecko API.

## Overview

The markets feature includes:

- **API Integration**: Direct integration with CoinGecko API for live market data
- **Redux State Management**: Centralized state management with async thunks
- **Custom Hooks**: Reusable hooks for data fetching and state management
- **UI Components**: Responsive market table with filtering and search
- **Auto-refresh**: Automatic data updates every 30 seconds

## API Configuration

### CoinGecko API Key

The integration uses a demo API key: `CG-fw2rF4aBSmvBwYnc9Jw4bKBo`

To use your own API key, set the environment variable:

```bash
NEXT_PUBLIC_COINGECKO_API_KEY=your_api_key_here
```

### API Endpoints Used

- `GET /coins/markets` - Fetch market data for cryptocurrencies
- Supports various parameters for filtering and sorting

## File Structure

```
features/markets/
├── api.ts                 # API functions for CoinGecko integration
├── types.ts              # TypeScript type definitions
├── slices/
│   └── marketSlice.ts    # Redux slice with async thunks
├── hooks/
│   └── useLiveMarkets.ts # Custom hooks for data management
├── components/
│   └── MarketTable.tsx   # Main market data display component
└── README.md             # This documentation
```

## Usage Examples

### Basic Usage with Hook

```tsx
import { useLiveMarkets } from "@/features/markets/hooks/useLiveMarkets";

const MyComponent = () => {
  const { markets, loading, error, fetchTopMarkets } = useLiveMarkets({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {markets.map((market) => (
        <div key={market.id}>
          {market.name}: ${market.current_price}
        </div>
      ))}
    </div>
  );
};
```

### Direct API Usage

```tsx
import { fetchTopMarkets, searchMarkets } from "@/features/markets/api";

// Fetch top 20 cryptocurrencies
const getTopMarkets = async () => {
  const response = await fetchTopMarkets(20, "usd");
  if (response.success) {
    console.log("Top markets:", response.data);
  }
};

// Search for specific cryptocurrencies
const searchForCoins = async () => {
  const response = await searchMarkets("bitcoin", "usd");
  if (response.success) {
    console.log("Search results:", response.data);
  }
};
```

### Redux Usage

```tsx
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTopMarketsAsync,
  selectMarkets,
} from "@/features/markets/slices/marketSlice";

const MyComponent = () => {
  const dispatch = useDispatch();
  const markets = useSelector(selectMarkets);

  useEffect(() => {
    dispatch(fetchTopMarketsAsync({ limit: 50, currency: "usd" }));
  }, [dispatch]);

  return (
    <div>
      {markets.map((market) => (
        <div key={market.id}>{market.name}</div>
      ))}
    </div>
  );
};
```

## Data Types

### MarketData Interface

```typescript
interface MarketData {
  id: string; // Coin ID (e.g., "bitcoin")
  symbol: string; // Symbol (e.g., "btc")
  name: string; // Full name (e.g., "Bitcoin")
  image: string; // Image URL
  current_price: number; // Current price in USD
  market_cap: number; // Market capitalization
  market_cap_rank: number; // Market cap rank
  total_volume: number; // 24h trading volume
  high_24h: number; // 24h high price
  low_24h: number; // 24h low price
  price_change_24h: number; // 24h price change
  price_change_percentage_24h: number; // 24h price change percentage
  market_cap_change_24h: number; // 24h market cap change
  market_cap_change_percentage_24h: number; // 24h market cap change percentage
  circulating_supply: number; // Circulating supply
  total_supply: number; // Total supply
  max_supply: number; // Maximum supply
  ath: number; // All-time high
  ath_change_percentage: number; // ATH change percentage
  ath_date: string; // ATH date
  atl: number; // All-time low
  atl_change_percentage: number; // ATL change percentage
  atl_date: string; // ATL date
  roi: Roi | null; // Return on investment data
  last_updated: string; // Last update timestamp
}
```

## Features

### Auto-refresh

The `useLiveMarkets` hook automatically refreshes data every 30 seconds by default.

### Error Handling

Comprehensive error handling with user-friendly error messages and retry functionality.

### Loading States

Loading indicators and skeleton states for better user experience.

### Filtering

Support for filtering by:

- Market performance (Gainers, Losers)
- Market cap ranking
- New listings
- Trending assets

### Search

Real-time search functionality for finding specific cryptocurrencies.

### Responsive Design

Mobile-friendly table design with proper spacing and typography.

## API Rate Limits

The CoinGecko API has rate limits:

- Demo API key: 50 calls/minute
- Pro API key: Higher limits based on plan

The implementation includes proper error handling for rate limit exceeded errors.

## Testing

Test the API connection:

```tsx
import { testApiConnection } from "@/features/markets/api";

const testConnection = async () => {
  const isWorking = await testApiConnection();
  console.log("API connection:", isWorking ? "Working" : "Failed");
};
```

## Environment Variables

```bash
# Optional: Your CoinGecko API key
NEXT_PUBLIC_COINGECKO_API_KEY=your_api_key_here
```

## Dependencies

- `axios` - HTTP client for API requests
- `@reduxjs/toolkit` - Redux state management
- `react-redux` - React Redux bindings

## Contributing

When adding new features:

1. Update types in `types.ts`
2. Add API functions in `api.ts`
3. Update Redux slice if needed
4. Create or update components
5. Update this README

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure your API key is valid and has sufficient permissions
2. **Rate Limiting**: Implement proper caching if hitting rate limits
3. **Network Errors**: Check internet connection and API endpoint availability
4. **Type Errors**: Ensure all new data structures are properly typed

### Debug Mode

Enable debug logging by setting the log level in your logger configuration.
