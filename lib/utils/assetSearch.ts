import {
  getAssetPrimaryLabel,
  getNetworkDisplayName,
} from "@/lib/utils/networkDisplay";

/** Resolve network string from asset records (swap, exchange, or rates). */
export function resolveAssetNetwork(asset: any): string {
  if (!asset) return "";

  if (asset.network_id) return String(asset.network_id).trim();
  if (asset.network_type) return String(asset.network_type).trim();
  if (asset.network) return String(asset.network).trim();

  if (Array.isArray(asset.networks) && asset.networks.length > 0) {
    const n = asset.networks[0];
    return String(n?.network_type || n?.network_id || n?.network || "").trim();
  }

  return "";
}

/** Common search aliases (query token → extra terms to match in haystack). */
const SEARCH_ALIASES: Record<string, string[]> = {
  ETH: ["ETHEREUM", "ETHER"],
  ETHER: ["ETHEREUM", "ETH"],
  ETHEREUM: ["ETH", "ETHER"],
  BTC: ["BITCOIN"],
  BITCOIN: ["BTC"],
  USDT: ["TETHER"],
  TETHER: ["USDT"],
  USDC: ["USD COIN", "USDCOIN"],
  BNB: ["BINANCE"],
  MATIC: ["POLYGON"],
  POLYGON: ["MATIC"],
  TRX: ["TRON", "TRC20"],
  TRON: ["TRX", "TRC20"],
  SOL: ["SOLANA"],
  SOLANA: ["SOL"],
  AVAX: ["AVALANCHE"],
  AVALANCHE: ["AVAX"],
  DOGE: ["DOGECOIN"],
  DOGECOIN: ["DOGE"],
  XRP: ["RIPPLE"],
  RIPPLE: ["XRP"],
  LTC: ["LITECOIN"],
  LITECOIN: ["LTC"],
};

function resolveLegacyTicker(asset: any): string {
  return String(
    asset?.legacy_ticker ||
      asset?.legacyTicker ||
      asset?.original_ticker ||
      asset?.change_now_ticker ||
      ""
  ).trim();
}

/** All searchable text for an asset, uppercased and space-joined. */
export function getAssetSearchHaystack(asset: any): string {
  const network = resolveAssetNetwork(asset);
  const legacy = resolveLegacyTicker(asset);

  const parts = [
    asset?.ticker,
    asset?.symbol,
    asset?.name,
    legacy,
    network,
    getNetworkDisplayName(network),
    getAssetPrimaryLabel(asset),
    asset?.description,
  ];

  return parts
    .filter((part) => part != null && String(part).trim())
    .join(" ")
    .toUpperCase();
}

function tokenMatchesHaystack(token: string, haystack: string): boolean {
  if (!token) return true;
  if (haystack.includes(token)) return true;

  const aliases = SEARCH_ALIASES[token];
  if (aliases?.some((alias) => haystack.includes(alias))) return true;

  if (token.length >= 2) {
    const words = haystack.split(/[\s/(),\-_.]+/).filter(Boolean);
    if (words.some((word) => word.startsWith(token))) return true;
  }

  return false;
}

/**
 * Match asset against search term.
 * Supports partial ticker/name (e.g. "ETH", "Ethe", "USDT", "BTC"),
 * network labels (e.g. "BSC", "Ethereum"), and multi-word queries (e.g. "ETH BSC").
 */
export function assetMatchesSearchTerm(asset: any, searchTerm: string): boolean {
  const raw = searchTerm.trim();
  if (!raw) return true;

  const haystack = getAssetSearchHaystack(asset);
  const tokens = raw.split(/\s+/).map((t) => t.toUpperCase()).filter(Boolean);

  return tokens.every((token) => tokenMatchesHaystack(token, haystack));
}
