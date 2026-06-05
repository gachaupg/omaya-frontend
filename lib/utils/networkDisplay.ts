/** Human-readable network labels (aligned with express asset selectors). */
export function getNetworkDisplayName(network?: string | null): string {
  if (!network || !String(network).trim()) return "Unknown";

  const networkMap: Record<string, string> = {
    bsc: "BSC",
    bep20: "BSC",
    bep2: "BSC",
    matic: "Polygon",
    avaxc: "Avalanche",
    eth: "Ethereum",
    osmo: "Osmosis",
    band: "Band Protocol",
    sol: "Solana",
    solana: "Solana",
    nano: "Nano",
    sxp: "Solar",
    luna: "Terra",
    base: "Base",
    trc20: "TRON",
    trx: "TRON",
    fxprimus: "FXPrimus",
  };

  const key = String(network).trim().toLowerCase();
  return networkMap[key] || String(network).trim();
}

export type AssetLike = {
  name?: string | null;
  ticker?: string | null;
  symbol?: string | null;
  network?: string | null;
};

/** Ticker/symbol for the primary row (e.g. USDT, SOL). */
export function getAssetPrimaryLabel(asset: AssetLike): string {
  const ticker = (asset.ticker || "").trim();
  const symbol = (asset.symbol || "").trim();
  const name = stripNetworkSuffix((asset.name || "").trim());
  const norm = normalizeLabel;

  if (
    symbol &&
    ticker &&
    norm(ticker) === norm(name) &&
    norm(symbol) !== norm(ticker)
  ) {
    return symbol.toUpperCase();
  }

  const raw = ticker || symbol;
  if (raw) {
    if (raw.toLowerCase() === "usdt tether") return "USDT";
    return raw.toUpperCase();
  }
  return name || "Unknown";
}

export function getAssetNetworkValue(asset: AssetLike): string {
  return asset.network?.trim() || "";
}

const NETWORK_SUFFIXES_TO_STRIP = [
  "BSC",
  "Binance Smart Chain",
  "ETH",
  "Ethereum",
  "MATIC",
  "Polygon",
  "AVAX",
  "Avalanche",
  "TRX",
  "Tron",
  "Solana",
  "SOL",
  "Base",
];

function stripNetworkSuffix(value: string): string {
  const pattern = new RegExp(
    `\\s*\\((?:${NETWORK_SUFFIXES_TO_STRIP.map((suffix) =>
      suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    ).join("|")})\\)`,
    "gi"
  );
  return value.replace(pattern, "").trim();
}

const normalizeLabel = (value: string) => value.trim().toLowerCase();

/** Subtitle under ticker + network badge; only when name differs from ticker. */
export function formatAssetSubtitle(asset: AssetLike): string {
  const primary = getAssetPrimaryLabel(asset);
  const rawName = stripNetworkSuffix(asset.name?.trim() || "");

  if (!rawName || normalizeLabel(rawName) === normalizeLabel(primary)) {
    return "";
  }

  return rawName;
}

/** Whether the network pill adds information beyond the primary label. */
export function shouldShowAssetNetworkBadge(asset: AssetLike): boolean {
  const primary = getAssetPrimaryLabel(asset);
  const networkLabel = getNetworkDisplayName(getAssetNetworkValue(asset));
  return normalizeLabel(networkLabel) !== normalizeLabel(primary);
}
