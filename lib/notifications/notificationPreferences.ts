export const NOTIFICATION_SOUND_MUTED_KEY = "notification_sound_muted";
export const BROWSER_NOTIFICATIONS_ENABLED_KEY =
  "omaya_browser_notifications_enabled";
export const NOTIFICATION_PREFERENCES_CHANGED_EVENT =
  "omaya-notification-preferences-changed";

export function isNotificationSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFICATION_SOUND_MUTED_KEY) === "1";
}

export function setNotificationSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_SOUND_MUTED_KEY, muted ? "1" : "0");
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_PREFERENCES_CHANGED_EVENT, {
      detail: { soundMuted: muted },
    })
  );
}

export function toggleNotificationSoundMuted(): boolean {
  const next = !isNotificationSoundMuted();
  setNotificationSoundMuted(next);
  return next;
}

export function isBrowserNotificationsPreferenceEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BROWSER_NOTIFICATIONS_ENABLED_KEY) === "1";
}

export function isBrowserNotificationsPreferenceExplicitlyDisabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BROWSER_NOTIFICATIONS_ENABLED_KEY) === "0";
}

export function setBrowserNotificationsPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    BROWSER_NOTIFICATIONS_ENABLED_KEY,
    enabled ? "1" : "0"
  );
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_PREFERENCES_CHANGED_EVENT, {
      detail: { browserNotificationsEnabled: enabled },
    })
  );
}
