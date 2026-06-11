"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useWebPush } from "@/features/notifications/components/WebPushProvider";
import {
  isNotificationSoundMuted,
  setNotificationSoundMuted,
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
} from "@/lib/notifications/notificationPreferences";
function PreferenceToggle({
  label,
  description,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-[#35353E] last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-[#8C8CA1] mt-0.5">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={onToggle}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          enabled ? "bg-[#1D8751]" : "bg-gray-300 dark:bg-[#35353E]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

const NotificationPreferencesSection: React.FC = () => {
  const {
    isSupported,
    permission,
    isEnabling,
    browserNotificationsEnabled,
    enableWebPush,
    disableWebPush,
    refreshPermissionState,
  } = useWebPush();

  const [soundMuted, setSoundMuted] = useState(false);

  useEffect(() => {
    setSoundMuted(isNotificationSoundMuted());

    const onPreferencesChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ soundMuted?: boolean }>).detail;
      if (typeof detail?.soundMuted === "boolean") {
        setSoundMuted(detail.soundMuted);
      } else {
        setSoundMuted(isNotificationSoundMuted());
      }
    };

    window.addEventListener(
      NOTIFICATION_PREFERENCES_CHANGED_EVENT,
      onPreferencesChanged
    );
    return () =>
      window.removeEventListener(
        NOTIFICATION_PREFERENCES_CHANGED_EVENT,
        onPreferencesChanged
      );
  }, []);

  useEffect(() => {
    refreshPermissionState();
  }, [refreshPermissionState]);

  const handleBrowserNotificationsToggle = useCallback(async () => {
    if (browserNotificationsEnabled) {
      await disableWebPush();
      refreshPermissionState();
      return;
    }
    await enableWebPush();
    refreshPermissionState();
  }, [
    browserNotificationsEnabled,
    disableWebPush,
    enableWebPush,
    refreshPermissionState,
  ]);

  const handleSoundToggle = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev;
      setNotificationSoundMuted(next);
      return next;
    });
  }, []);

  const browserDescription = !isSupported
    ? "Not supported in this browser."
    : permission === "denied"
      ? "Blocked in browser settings. Allow notifications for this site to enable alerts when you're away."
      : browserNotificationsEnabled
        ? "You'll get alerts when you're away from the site."
        : isEnabling
          ? "Enabling browser notifications…"
          : "Get trade alerts when you're away from the site.";

  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1 mt-1">
        Notifications
      </div>
      <section className="dark:bg-card bg-card rounded-xl dark:border-[#35353E] border-[#E8EFF5] border p-3 sm:px-4 sm:py-1">
        <PreferenceToggle
          label="Browser notifications"
          description={browserDescription}
          enabled={browserNotificationsEnabled}
          disabled={!isSupported || permission === "denied" || isEnabling}
          onToggle={() => void handleBrowserNotificationsToggle()}
        />
        <PreferenceToggle
          label="Notification sound"
          description={
            soundMuted
              ? "Trade notification sounds are muted."
              : "Play a sound when new trade notifications arrive."
          }
          enabled={!soundMuted}
          onToggle={handleSoundToggle}
        />
      </section>
    </>
  );
};

export default NotificationPreferencesSection;
