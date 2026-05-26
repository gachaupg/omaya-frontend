import { idbDel } from "@/features/express/utils/indexedDbKv";
import { sliceCache } from "@/lib/utils/sliceCache";
import { isBrowserFullPageReload } from "@/lib/utils/pageReload";

const REAL_ASSETS_CACHE_KEY = "omaya_real_assets_cache_v1";

const LOCAL_STORAGE_PREFIXES = [
  "omaya_changenow_public_supported_tokens_",
  "omaya_changenow_assets_",
];

const HTTP_CACHE_MARKERS = [
  "supported-tokens",
  "changenow",
  "fronted-all-asset",
];

/** Captured once per document — navigation type does not change on client-side routing. */
const documentInitiallyLoadedViaReload =
  typeof window !== "undefined" && isBrowserFullPageReload();

let reloadBootstrapComplete = false;
let reloadRefetchConsumed = false;

/**
 * True only during the one-time reload bootstrap (before caches are cleared).
 * False for all client-side navigations after that, even if the document was opened via F5.
 */
export function shouldBypassSupportedTokensCache(): boolean {
  return documentInitiallyLoadedViaReload && !reloadBootstrapComplete;
}

/**
 * True once per document when opened via full reload, until the first successful assets refetch.
 */
export function shouldForceSupportedTokensRefetch(): boolean {
  return documentInitiallyLoadedViaReload && !reloadRefetchConsumed;
}

export function consumeSupportedTokensReloadRefetch(): void {
  reloadRefetchConsumed = true;
}

async function deleteBrowserCacheEntriesMatching(markers: string[]): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("OMAYA_CACHE_DB", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve) => {
      const transaction = db.transaction(["cache_store"], "readwrite");
      const store = transaction.objectStore("cache_store");
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          resolve();
          return;
        }

        const entry = cursor.value as { key?: string; data?: unknown };
        const key = String(entry?.key || "");
        const blob = JSON.stringify(entry?.data ?? "");
        const matches =
          markers.some((m) => key.includes(m)) ||
          markers.some((m) => blob.includes(m));

        if (matches) {
          cursor.delete();
        }
        cursor.continue();
      };

      cursorRequest.onerror = () => resolve();
    });

    db.close();
  } catch {
    // IndexedDB unavailable — network layer still bypasses via cachedGet
  }
}

/** Clear all client caches for public + authenticated supported-token lists (once per reload). */
export async function clearSupportedTokensCachesOnReload(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!documentInitiallyLoadedViaReload || reloadBootstrapComplete) return;
  reloadBootstrapComplete = true;

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
        key === REAL_ASSETS_CACHE_KEY
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  await idbDel(REAL_ASSETS_CACHE_KEY);
  await sliceCache.delete("exchange", "fetchAssets");
  await sliceCache.delete("swap", "fetchSupportedAssets_swap", { feature: "swap" });
  await sliceCache.delete("swap", "fetchSupportedAssets_exchange", {
    feature: "exchange",
  });
  await deleteBrowserCacheEntriesMatching(HTTP_CACHE_MARKERS);
}
