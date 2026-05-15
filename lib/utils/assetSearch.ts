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

/** Match asset against search term (ticker, name, symbol, network). */
export function assetMatchesSearchTerm(asset: any, searchTerm: string): boolean {
  const term = searchTerm.trim().toUpperCase();
  if (!term) return true;

  const ticker = (asset?.ticker || "").toUpperCase();
  const name = (asset?.name || "").toUpperCase();
  const symbol = (asset?.symbol || "").toUpperCase();
  const network = resolveAssetNetwork(asset).toUpperCase();

  return (
    ticker.includes(term) ||
    name.includes(term) ||
    symbol.includes(term) ||
    network.includes(term)
  );
}
