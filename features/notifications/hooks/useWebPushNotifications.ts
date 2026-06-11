"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { selectPendingMatchedTradeNotifications } from "@/features/p2p/selectors";
import { pushNotificationsApi } from "@/features/notifications/api";
import { buildTradeNotificationPayload } from "@/features/notifications/buildTradeNotificationPayload";
import {
  getNotificationPermission,
  getRememberedPushSubscriptionEndpoint,
  getVapidPublicKey,
  isWebPushSupported,
  registerServiceWorker,
  rememberPushSubscriptionEndpoint,
  requestNotificationPermission,
  serializePushSubscription,
  showLocalWebNotification,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from "@/lib/notifications/webPushClient";
import { logger } from "@/lib/utils/logger";
import {
  isBrowserNotificationsPreferenceEnabled,
  isBrowserNotificationsPreferenceExplicitlyDisabled,
  setBrowserNotificationsPreference,
} from "@/lib/notifications/notificationPreferences";

export function useWebPushNotifications() {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const pendingNotifications = useSelector(
    selectPendingMatchedTradeNotifications
  );

  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => getNotificationPermission());
  const [isEnabling, setIsEnabling] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferenceEnabled, setPreferenceEnabled] = useState(
    () => isBrowserNotificationsPreferenceEnabled()
  );

  const prevTradeIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedTradeIdsRef = useRef(false);
  const autoEnableAttemptedRef = useRef(false);

  const refreshPermissionState = useCallback(() => {
    setPermission(getNotificationPermission());
    setPreferenceEnabled(isBrowserNotificationsPreferenceEnabled());
  }, []);

  const syncPushSubscription = useCallback(
    async (
      permissionOverride?: NotificationPermission | "unsupported"
    ): Promise<boolean> => {
      const effectivePermission = permissionOverride ?? getNotificationPermission();
      if (!isAuthenticated || effectivePermission !== "granted") return false;

      await registerServiceWorker();

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        logger.debug(
          "notifications",
          "No VAPID public key — server push skipped; local alerts still work"
        );
        setIsSubscribed(true);
        return true;
      }

      const subscription = await subscribeToWebPush(vapidKey);
      if (!subscription) {
        setIsSubscribed(true);
        return true;
      }

      const payload = serializePushSubscription(subscription);
      const remembered = getRememberedPushSubscriptionEndpoint();
      if (remembered === payload.endpoint) {
        setIsSubscribed(true);
        return true;
      }

      try {
        await pushNotificationsApi.subscribe(payload, {
          user_agent: navigator.userAgent,
        });
        rememberPushSubscriptionEndpoint(payload.endpoint);
        setIsSubscribed(true);
        return true;
      } catch (error) {
        logger.debug("notifications", "Push subscribe API failed", error);
        setIsSubscribed(true);
        return true;
      }
    },
    [isAuthenticated]
  );

  const enableWebPush = useCallback(async () => {
    if (!isWebPushSupported()) return false;
    setIsEnabling(true);
    try {
      await registerServiceWorker();
      const nextPermission = await requestNotificationPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") return false;
      setBrowserNotificationsPreference(true);
      setPreferenceEnabled(true);
      await syncPushSubscription(nextPermission);
      return true;
    } finally {
      setIsEnabling(false);
    }
  }, [syncPushSubscription]);

  const disableWebPush = useCallback(async () => {
    const endpoint = getRememberedPushSubscriptionEndpoint();
    if (endpoint) {
      await pushNotificationsApi.unsubscribe(endpoint).catch(() => {
        /* backend may already have removed it */
      });
    }
    await unsubscribeFromWebPush();
    setBrowserNotificationsPreference(false);
    setPreferenceEnabled(false);
    setIsSubscribed(false);
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      autoEnableAttemptedRef.current = false;
      return;
    }
    void registerServiceWorker();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || autoEnableAttemptedRef.current) return;
    if (!isWebPushSupported()) return;

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    if (currentPermission === "granted" && isBrowserNotificationsPreferenceEnabled()) {
      setPreferenceEnabled(true);
      setIsSubscribed(true);
      void syncPushSubscription("granted");
      return;
    }

    if (
      currentPermission === "default" &&
      !isBrowserNotificationsPreferenceExplicitlyDisabled()
    ) {
      autoEnableAttemptedRef.current = true;
      void enableWebPush();
    }
  }, [isAuthenticated, enableWebPush, syncPushSubscription]);

  useEffect(() => {
    if (!isAuthenticated || !isWebPushSupported()) return;
    if (getNotificationPermission() !== "default") return;

    const enableOnGesture = () => {
      void enableWebPush();
    };

    window.addEventListener("pointerdown", enableOnGesture, { once: true });
    return () => window.removeEventListener("pointerdown", enableOnGesture);
  }, [isAuthenticated, enableWebPush]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshPermissionState();
    setPreferenceEnabled(isBrowserNotificationsPreferenceEnabled());
    if (
      getNotificationPermission() === "granted" &&
      isBrowserNotificationsPreferenceEnabled()
    ) {
      setIsSubscribed(true);
      void syncPushSubscription("granted");
    }
  }, [isAuthenticated, refreshPermissionState, syncPushSubscription]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onVisible = () => {
      refreshPermissionState();
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, refreshPermissionState]);

  useEffect(() => {
    if (!isAuthenticated) {
      prevTradeIdsRef.current = new Set();
      hasInitializedTradeIdsRef.current = false;
      setIsSubscribed(false);
      return;
    }

    const currentIds = new Set(
      pendingNotifications.map((trade) => String(trade.id))
    );

    if (!hasInitializedTradeIdsRef.current) {
      prevTradeIdsRef.current = currentIds;
      hasInitializedTradeIdsRef.current = true;
      return;
    }

    if (permission !== "granted" || !preferenceEnabled) {
      prevTradeIdsRef.current = currentIds;
      return;
    }

    const newTrades = pendingNotifications.filter(
      (trade) => !prevTradeIdsRef.current.has(String(trade.id))
    );

    if (newTrades.length > 0 && document.visibilityState === "hidden") {
      for (const trade of newTrades) {
        const payload = buildTradeNotificationPayload(trade, user?.email);
        void showLocalWebNotification(payload);
      }
    }

    prevTradeIdsRef.current = currentIds;
  }, [isAuthenticated, pendingNotifications, permission, preferenceEnabled, user?.email]);

  useEffect(() => {
    if (isAuthenticated) return;

    const endpoint = getRememberedPushSubscriptionEndpoint();
    if (endpoint) {
      void pushNotificationsApi.unsubscribe(endpoint).catch(() => {
        /* backend may already have removed it */
      });
    }
    void unsubscribeFromWebPush();
  }, [isAuthenticated]);

  const browserNotificationsEnabled =
    permission === "granted" && preferenceEnabled;

  return {
    isSupported: isWebPushSupported(),
    permission,
    isEnabling,
    isSubscribed,
    browserNotificationsEnabled,
    enableWebPush,
    disableWebPush,
    refreshPermissionState,
  };
}
