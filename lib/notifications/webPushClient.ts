const SW_PATH = "/sw.js";
const PUSH_SUBSCRIPTION_STORAGE_KEY = "omaya_push_subscription_endpoint";

export type LocalNotificationPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
};

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (!isWebPushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isWebPushSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function getVapidPublicKey(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (fromEnv) return fromEnv;

  try {
    const { pushNotificationsApi } = await import(
      "@/features/notifications/api"
    );
    return await pushNotificationsApi.getVapidPublicKey();
  } catch {
    return null;
  }
}

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function serializePushSubscription(
  subscription: PushSubscription
): PushSubscriptionPayload {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(p256dh),
      auth: arrayBufferToBase64(auth),
    },
  };
}

export async function subscribeToWebPush(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return null;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });
}

export async function unsubscribeFromWebPush(): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
  }
}

export function rememberPushSubscriptionEndpoint(endpoint: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUSH_SUBSCRIPTION_STORAGE_KEY, endpoint);
}

export function getRememberedPushSubscriptionEndpoint(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
}

export async function showLocalWebNotification(
  payload: LocalNotificationPayload
): Promise<void> {
  if (!isWebPushSupported() || Notification.permission !== "granted") return;

  const registration = await getServiceWorkerRegistration();
  if (!registration) return;

  await registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon || "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.tag || "omaya-trade",
    data: { url: payload.url || "/dashboard/notifications" },
  });
}
