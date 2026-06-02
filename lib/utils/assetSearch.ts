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

/** Primary ticker for sorting (uppercase). */
export function getAssetTickerNormalized(asset: any): string {
  return String(asset?.ticker || asset?.symbol || asset?.name || "")
    .trim()
    .toUpperCase();
}

function normalizeNetworkKey(network: string): string {
  return network.trim().toLowerCase();
}

type TickerNameMatchLevel = "exact" | "alias" | "prefix" | "none";

/** Whether the asset ticker matches the search token (exact, alias, or prefix). */
function getTickerMatchLevel(
  ticker: string,
  legacy: string,
  token: string
): TickerNameMatchLevel {
  const t = token.toUpperCase();
  const tick = ticker.toUpperCase();
  const leg = legacy.toUpperCase();
  if (!t) return "none";

  if (tick === t || leg === t) return "exact";

  const tokenAliases = SEARCH_ALIASES[t];
  if (tokenAliases?.some((alias) => tick === alias || leg === alias)) {
    return "alias";
  }

  for (const [key, vals] of Object.entries(SEARCH_ALIASES)) {
    if ((key === tick || key === leg) && vals.includes(t)) return "alias";
  }

  if (
    t.length >= 2 &&
    (tick.startsWith(t) || leg.startsWith(t))
  ) {
    return "prefix";
  }

  return "none";
}

/** Whether the asset display name matches the search token (exact or prefix). */
function getNameMatchLevel(asset: any, token: string): TickerNameMatchLevel {
  const name = String(asset?.name || "")
    .trim()
    .toUpperCase();
  const t = token.toUpperCase();
  if (!name || !t) return "none";

  if (name === t) return "exact";

  const tokenAliases = SEARCH_ALIASES[t];
  if (tokenAliases?.some((alias) => name === alias)) return "exact";

  if (t.length >= 2 && name.startsWith(t)) return "prefix";

  return "none";
}

function networkMatchesSearchToken(
  network: string,
  networkDisplay: string,
  token: string
): boolean {
  const t = token.toUpperCase();
  const n = network.toUpperCase();
  const nd = networkDisplay.toUpperCase();
  if (!t) return true;
  if (n.includes(t) || nd.includes(t)) return true;

  const aliases = SEARCH_ALIASES[t];
  if (aliases?.some((alias) => n.includes(alias) || nd.includes(alias))) {
    return true;
  }

  for (const [key, vals] of Object.entries(SEARCH_ALIASES)) {
    if (key === t && vals.some((v) => n.includes(v) || nd.includes(v))) return true;
    if (vals.includes(t) && (n.includes(key) || nd.includes(key))) return true;
  }

  return false;
}

/**
 * Lower rank = higher in dropdown when searching.
 * 0 exact symbol, 1 symbol alias (e.g. SOL for "Solana"), 2 exact name,
 * 3 symbol prefix, 4 name prefix, 5–7 symbol/name with wrong network,
 * 8 network-only (e.g. tokens on Solana chain), 9 other haystack matches.
 */
export function getAssetSearchPriority(asset: any, searchTerm: string): number {
  const raw = searchTerm.trim();
  if (!raw) return 100;

  const tokens = raw.split(/\s+/).map((t) => t.toUpperCase()).filter(Boolean);
  if (!tokens.length) return 100;

  const primaryToken = tokens[0];
  const networkTokens = tokens.slice(1);
  const ticker = getAssetTickerNormalized(asset);
  const legacy = resolveLegacyTicker(asset).toUpperCase();
  const network = resolveAssetNetwork(asset);
  const networkDisplay = getNetworkDisplayName(network);

  const tickerMatch = getTickerMatchLevel(ticker, legacy, primaryToken);
  const nameMatch = getNameMatchLevel(asset, primaryToken);

  const allNetworkTokensMatch =
    networkTokens.length === 0 ||
    networkTokens.every((t) =>
      networkMatchesSearchToken(network, networkDisplay, t)
    );

  if (tickerMatch === "exact" && allNetworkTokensMatch) return 0;
  if (tickerMatch === "alias" && allNetworkTokensMatch) return 1;
  if (nameMatch === "exact" && allNetworkTokensMatch) return 2;
  if (tickerMatch === "prefix" && allNetworkTokensMatch) return 3;
  if (nameMatch === "prefix" && allNetworkTokensMatch) return 4;

  if (tickerMatch === "exact" && !allNetworkTokensMatch) return 5;
  if (tickerMatch === "alias" && !allNetworkTokensMatch) return 6;
  if (nameMatch === "exact" && !allNetworkTokensMatch) return 7;

  if (
    tickerMatch === "none" &&
    nameMatch === "none" &&
    networkTokens.length === 0 &&
    networkMatchesSearchToken(network, networkDisplay, primaryToken)
  ) {
    return 8;
  }

  return 9;
}

/** Default Express ordering when the dropdown search is empty. */
export function compareAssetsDefaultPopular(a: any, b: any): number {
  const tickerA = (a?.ticker || a?.symbol || a?.name || "")
    .toString()
    .toLowerCase();
  const tickerB = (b?.ticker || b?.symbol || b?.name || "")
    .toString()
    .toLowerCase();
  const networkA = normalizeNetworkKey(
    resolveAssetNetwork(a) || String(a?.network || "")
  );
  const networkB = normalizeNetworkKey(
    resolveAssetNetwork(b) || String(b?.network || "")
  );

  if (
    tickerA === "usdt" &&
    networkA === "bsc" &&
    !(tickerB === "usdt" && networkB === "bsc")
  ) {
    return -1;
  }
  if (
    tickerB === "usdt" &&
    networkB === "bsc" &&
    !(tickerA === "usdt" && networkA === "bsc")
  ) {
    return 1;
  }

  if (
    tickerA === "usdc" &&
    networkA === "bsc" &&
    !(tickerB === "usdc" && networkB === "bsc")
  ) {
    return -1;
  }
  if (
    tickerB === "usdc" &&
    networkB === "bsc" &&
    !(tickerA === "usdc" && networkA === "bsc")
  ) {
    return 1;
  }

  const isFxpA = tickerA === "fxp" || tickerA === "fxprimus";
  const isFxpB = tickerB === "fxp" || tickerB === "fxprimus";
  if (isFxpA && !isFxpB) return -1;
  if (isFxpB && !isFxpA) return 1;

  return 0;
}

/** Sort comparator: search-aware when term is set, popular default otherwise. */
export function compareAssetsForDisplay(a: any, b: any, searchTerm: string): number {
  const term = searchTerm.trim();
  if (term) {
    const pa = getAssetSearchPriority(a, term);
    const pb = getAssetSearchPriority(b, term);
    if (pa !== pb) return pa - pb;

    const tickerCmp = getAssetTickerNormalized(a).localeCompare(
      getAssetTickerNormalized(b)
    );
    if (tickerCmp !== 0) return tickerCmp;

    return normalizeNetworkKey(resolveAssetNetwork(a)).localeCompare(
      normalizeNetworkKey(resolveAssetNetwork(b))
    );
  }

  return compareAssetsDefaultPopular(a, b);
}

export function sortAssetsForDisplay<T>(assets: T[], searchTerm: string): T[] {
  return [...assets].sort((a, b) => compareAssetsForDisplay(a, b, searchTerm));
}
