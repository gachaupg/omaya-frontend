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
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string | null;
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

export interface FavoriteAsset {
  favorite_asset_id: string;
  asset_symbol: string;
  asset_image: string;
  added_on: string; 
}
