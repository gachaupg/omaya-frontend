const LEGACY_KEYS = ["profile_photo", "p2p_profile_image"] as const;
const SCOPED_PREFIX = "profile_photo_user_";

export function resolveProfilePhotoUserKey(
  user: { user_id?: string; id?: number | string } | null | undefined
): string {
  if (!user) return "";
  return String(user.user_id ?? user.id ?? "").trim();
}

function scopedKey(userKey: string): string {
  return `${SCOPED_PREFIX}${userKey}`;
}

export function getCachedProfilePhoto(
  userKey: string | null | undefined
): string | null {
  if (typeof window === "undefined") return null;
  const key = String(userKey ?? "").trim();
  if (!key) return null;
  return localStorage.getItem(scopedKey(key));
}

export function setCachedProfilePhoto(
  userKey: string | null | undefined,
  photo: string
): void {
  if (typeof window === "undefined") return;
  const key = String(userKey ?? "").trim();
  const url = String(photo ?? "").trim();
  if (!key || !url) return;
  localStorage.setItem(scopedKey(key), url);
}

export function clearProfilePhotoCache(): void {
  if (typeof window === "undefined") return;
  for (const legacyKey of LEGACY_KEYS) {
    localStorage.removeItem(legacyKey);
  }
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const storageKey = localStorage.key(i);
    if (storageKey?.startsWith(SCOPED_PREFIX)) {
      localStorage.removeItem(storageKey);
    }
  }
}
