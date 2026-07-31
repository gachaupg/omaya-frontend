/**
 * Formats a user's name for compact UI (e.g. user cards).
 * When the full name has more than two words, shows first and last only.
 */
export function formatUserDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "User"
): string {
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return shortenDisplayName(full, fallback);
}

export function shortenDisplayName(
  name: string,
  fallback = "User"
): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return trimmed;

  return `${parts[0]} ${parts[parts.length - 1]}`;
}
