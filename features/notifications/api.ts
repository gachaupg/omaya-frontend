import { get, post, del } from "@/lib/apiClient";
import type { PushSubscriptionPayload } from "@/lib/notifications/webPushClient";

const PUSH_API = {
  subscribe: "/api/push/subscribe/",
  unsubscribe: "/api/push/unsubscribe/",
  vapidPublicKey: "/api/push/vapid-public-key/",
} as const;

export const pushNotificationsApi = {
  async getVapidPublicKey(): Promise<string | null> {
    try {
      const response = await get<{ public_key?: string; publicKey?: string }>(
        PUSH_API.vapidPublicKey
      );
      const key = response.data.public_key || response.data.publicKey;
      return key?.trim() || null;
    } catch {
      return null;
    }
  },

  async subscribe(
    subscription: PushSubscriptionPayload,
    meta?: { user_agent?: string }
  ): Promise<void> {
    await post(PUSH_API.subscribe, {
      ...subscription,
      user_agent: meta?.user_agent,
    });
  },

  async unsubscribe(endpoint: string): Promise<void> {
    await del(PUSH_API.unsubscribe, {
      data: { endpoint },
    });
  },
};
