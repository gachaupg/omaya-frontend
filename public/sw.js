/* OMAYA trade push notifications — handles server push when the tab is closed. */

self.addEventListener("push", (event) => {
  let payload = {
    title: "OMAYA Exchange",
    body: "You have a new trade notification",
    url: "/dashboard/notifications",
    tag: "omaya-trade",
    icon: "/favicon.svg",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/favicon.svg",
      badge: "/favicon.svg",
      tag: payload.tag || "omaya-trade",
      data: { url: payload.url || "/dashboard/notifications" },
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard/notifications";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(absoluteUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteUrl);
        }
      })
  );
});
