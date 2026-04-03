"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const OFFLINE_ROUTE = "/offline";

export default function NetworkOfflineRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const goOfflinePage = () => {
      if (pathname === OFFLINE_ROUTE) return;
      const from = encodeURIComponent(pathname || "/");
      router.replace(`${OFFLINE_ROUTE}?from=${from}`);
    };

    const maybeRestore = () => {
      if (pathname !== OFFLINE_ROUTE) return;
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      router.replace(from || "/");
    };

    const syncWithNetwork = () => {
      if (!navigator.onLine) {
        goOfflinePage();
        return;
      }
      maybeRestore();
    };

    syncWithNetwork();
    window.addEventListener("offline", syncWithNetwork);
    window.addEventListener("online", syncWithNetwork);

    return () => {
      window.removeEventListener("offline", syncWithNetwork);
      window.removeEventListener("online", syncWithNetwork);
    };
  }, [pathname, router]);

  return null;
}

