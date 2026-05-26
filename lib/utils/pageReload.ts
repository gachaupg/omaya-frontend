/**
 * True when this document was first loaded via a full browser reload (F5 / refresh).
 * Stays true for the whole tab session (including client-side navigations) — use
 * `shouldForceSupportedTokensRefetch()` from supportedTokensCache for one-shot refetch logic.
 */
export function isBrowserFullPageReload(): boolean {
  if (typeof window === "undefined") return false;

  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (nav?.type === "reload") return true;

  const legacy = performance as Performance & {
    navigation?: { type?: number };
  };
  return legacy.navigation?.type === 1;
}
