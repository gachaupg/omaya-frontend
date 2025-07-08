/**
 * types.ts – auto‑generated placeholder
 */

/**
 * Market data types for cryptocurrency information
 */

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: Roi | null;
  last_updated: string;
}

export interface Roi {
  times: number;
  currency: string;
  percentage: number;
}

export interface MarketDataParams {
  vs_currency?: string;
  ids?: string;
  category?: string;
  order?:
    | "market_cap_desc"
    | "market_cap_asc"
    | "volume_desc"
    | "volume_asc"
    | "id_desc"
    | "id_asc"
    | "gecko_desc"
    | "gecko_asc"
    | "price_desc"
    | "price_asc"
    | "h24_change_desc"
    | "h24_change_asc"
    | "trust_score_desc"
    | "trust_score_asc";
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  price_change_percentage?: string;
  locale?: string;
}

export interface MarketDataResponse {
  data: MarketData[];
  success: boolean;
  error?: string;
}

export interface MarketDataState {
  markets: MarketData[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
