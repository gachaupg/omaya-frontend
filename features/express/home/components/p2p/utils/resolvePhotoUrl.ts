import { API_BASE_URL } from "@/config/api";

/** Resolve relative profile URLs (e.g. /media/...) to a full API URL. */
export function resolvePhotoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL.replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}

export function pickAdvertiserPhoto(order: Record<string, unknown>): string {
  const candidates = [
    order.advertiser_photo,
    order.seller_photo,
    order.buyer_photo,
    order.profile_photo,
    order.photo,
  ];

  for (const candidate of candidates) {
    const resolved = resolvePhotoUrl(
      typeof candidate === "string" ? candidate : undefined
    );
    if (resolved) return resolved;
  }

  return "";
}
