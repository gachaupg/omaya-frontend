/**
 * WebSocket URL utilities - append auth token to WebSocket URLs
 */

/**
 * Appends ?token= or &token= to a WebSocket URL when token is provided.
 * Safe to call with null/undefined token - returns original URL unchanged.
 */
export function appendTokenToWebSocketUrl(
  url: string,
  token: string | null | undefined
): string {
  if (!url || typeof url !== "string") return url;
  if (!token || typeof token !== "string" || token.length < 10) return url;

  try {
    const separator = url.includes("?") ? "&" : "?";
    const encodedToken = encodeURIComponent(token);
    return `${url}${separator}token=${encodedToken}`;
  } catch {
    return url;
  }
}
