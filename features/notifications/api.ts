import { post, del } from "@/lib/apiClient";
import type { PushSubscriptionPayload } from "@/lib/notifications/webPushClient";

const PUSH_API = {
  subscribe: "/api/push/subscribe/",
  unsubscribe: "/api/push/unsubscribe/",
} as const;

export const pushNotificationsApi = {
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
