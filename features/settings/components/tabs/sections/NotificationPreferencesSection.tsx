"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useWebPush } from "@/features/notifications/components/WebPushProvider";
import {
  isNotificationSoundMuted,
  setNotificationSoundMuted,
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
} from "@/lib/notifications/notificationPreferences";

function NotificationSwitch({
  enabled,
  disabled,
  label,
  onToggle,
}: {
  enabled: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex h-7 w-[52px] min-w-[52px] shrink-0 items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D8751]/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled
          ? "justify-end bg-[#1D8751]"
          : "justify-start bg-gray-300 dark:bg-[#4A4A56]"
      }`}
    >
      <span className="block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.28)]" />
    </button>
  );
}

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
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-[#35353E] dark:bg-[#18181D]/60 sm:rounded-none sm:border-0 sm:border-b sm:bg-transparent sm:p-0 sm:py-4 sm:dark:bg-transparent last:sm:border-b-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-white">
              {label}
            </p>
            <NotificationSwitch
              enabled={enabled}
              disabled={disabled}
              label={label}
              onToggle={onToggle}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-[#8C8CA1]">
            {description}
          </p>
        </div>
      </div>
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
      <div className="mb-1 mt-1 text-sm font-bold text-gray-900 dark:text-white">
        Notifications
      </div>
      <section className="min-w-0 overflow-hidden rounded-xl border border-[#E8EFF5] bg-card p-2 dark:border-[#35353E] dark:bg-card sm:space-y-0 sm:p-3 sm:px-4">
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
