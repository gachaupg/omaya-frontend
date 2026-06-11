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

const WEB_PUSH_PROMPT_DISMISSED_KEY = "omaya_web_push_prompt_dismissed";

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

  const prevTradeIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedTradeIdsRef = useRef(false);

  const syncPushSubscription = useCallback(async () => {
    if (!isAuthenticated || permission !== "granted") return false;

    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      logger.debug("notifications", "No VAPID public key — push subscribe skipped");
      return false;
    }

    const subscription = await subscribeToWebPush(vapidKey);
    if (!subscription) return false;

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
      return false;
    }
  }, [isAuthenticated, permission]);

  const enableWebPush = useCallback(async () => {
    if (!isWebPushSupported()) return false;
    setIsEnabling(true);
    try {
      await registerServiceWorker();
      const nextPermission = await requestNotificationPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") return false;
      return await syncPushSubscription();
    } finally {
      setIsEnabling(false);
    }
  }, [syncPushSubscription]);

  const dismissWebPushPrompt = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WEB_PUSH_PROMPT_DISMISSED_KEY, "1");
    }
  }, []);

  const shouldShowEnablePrompt =
    isAuthenticated &&
    isWebPushSupported() &&
    permission === "default" &&
    typeof window !== "undefined" &&
    localStorage.getItem(WEB_PUSH_PROMPT_DISMISSED_KEY) !== "1";

  useEffect(() => {
    if (!isAuthenticated) return;
    void registerServiceWorker();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || permission !== "granted") return;
    void syncPushSubscription();
  }, [isAuthenticated, permission, syncPushSubscription]);

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

    if (permission !== "granted") {
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
  }, [isAuthenticated, pendingNotifications, permission, user?.email]);

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

  return {
    isSupported: isWebPushSupported(),
    permission,
    isEnabling,
    isSubscribed,
    shouldShowEnablePrompt,
    enableWebPush,
    dismissWebPushPrompt,
  };
}
