"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { selectPendingMatchedTradeNotificationCount } from "@/features/p2p/selectors";
import {
  isNotificationSoundMuted,
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
} from "@/lib/notifications/notificationPreferences";
import { playTradeNotificationSound } from "@/lib/notifications/tradeNotificationSound";

/**
 * Plays a sound when pending matched-trade notifications increase (WS or HTTP).
 * Requires one user gesture to satisfy browser autoplay policy.
 */
export function useTradeNotificationSound(enabled = true): void {
  const pendingCount = useSelector(selectPendingMatchedTradeNotificationCount);
  const prevCountRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const audioEnabledRef = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    mutedRef.current = isNotificationSoundMuted();

    const enableAudio = () => {
      audioEnabledRef.current = true;
    };
    const onPreferencesChanged = () => {
      mutedRef.current = isNotificationSoundMuted();
    };

    window.addEventListener("click", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });
    window.addEventListener("touchstart", enableAudio, { once: true });
    window.addEventListener(
      NOTIFICATION_PREFERENCES_CHANGED_EVENT,
      onPreferencesChanged
    );

    return () => {
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("keydown", enableAudio);
      window.removeEventListener("touchstart", enableAudio);
      window.removeEventListener(
        NOTIFICATION_PREFERENCES_CHANGED_EVENT,
        onPreferencesChanged
      );
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (!hasInitializedRef.current) {
      prevCountRef.current = pendingCount;
      hasInitializedRef.current = true;
      return;
    }

    if (
      pendingCount > prevCountRef.current &&
      audioEnabledRef.current &&
      !mutedRef.current
    ) {
      playTradeNotificationSound();
    }

    prevCountRef.current = pendingCount;
  }, [enabled, pendingCount]);
}
