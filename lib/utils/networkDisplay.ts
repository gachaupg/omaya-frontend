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

/** Ticker/symbol for the primary row (e.g. USDT). */
export function getAssetPrimaryLabel(asset: AssetLike): string {
  const raw = (asset.ticker || asset.symbol || "").trim();
  if (raw) {
    if (raw.toLowerCase() === "usdt tether") return "USDT";
    return raw.toUpperCase();
  }
  return asset.name?.trim() || "Unknown";
}

export function getAssetNetworkValue(asset: AssetLike): string {
  return asset.network?.trim() || "";
}

/** Subtitle: full name + network, e.g. "Tether (Binance Smart Chain) (BSC)". */
export function formatAssetSubtitle(asset: AssetLike): string {
  const name = asset.name?.trim() || getAssetPrimaryLabel(asset);
  const networkLabel = getNetworkDisplayName(getAssetNetworkValue(asset));
  return `${name} (${networkLabel})`;
}
