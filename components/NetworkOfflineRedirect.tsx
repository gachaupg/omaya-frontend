"use client";

import { useEffect } from "react";

const OFFLINE_ROUTE = "/offline";

export default function NetworkOfflineRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const goOfflinePage = () => {
      if (navigator.onLine) return;
      if (window.location.pathname === OFFLINE_ROUTE) return;
      const currentPath = `${window.location.pathname}${window.location.search || ""}`;
      const from = encodeURIComponent(currentPath || "/");
      window.location.replace(`${OFFLINE_ROUTE}?from=${from}`);
    };

    const maybeRestore = () => {
      if (window.location.pathname !== OFFLINE_ROUTE) return;
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      window.location.replace(from || "/");
    };

    // Do not force redirects on mount/path changes. Only react to real
    // browser connectivity events to avoid blocking normal navbar navigation.
    window.addEventListener("offline", goOfflinePage);
    window.addEventListener("online", maybeRestore);

    return () => {
      window.removeEventListener("offline", goOfflinePage);
      window.removeEventListener("online", maybeRestore);
    };
  }, []);

  return null;
}

