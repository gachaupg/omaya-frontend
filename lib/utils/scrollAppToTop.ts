function scheduleScroll(run: () => void) {
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  window.setTimeout(run, 0);
  window.setTimeout(run, 120);
}

/** Scroll the main app view to a vertical fraction (0 = top, 0.5 = halfway). */
export function scrollAppToFraction(
  fraction: number,
  behavior: ScrollBehavior = "smooth"
) {
  if (typeof window === "undefined") return;

  const clamped = Math.min(1, Math.max(0, fraction));

  const run = () => {
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const viewport =
      window.innerHeight || document.documentElement.clientHeight || 0;
    const maxTop = Math.max(0, scrollHeight - viewport);
    const top = Math.round(maxTop * clamped);

    window.scrollTo({ top, left: 0, behavior });
    document.documentElement?.scrollTo?.({ top, left: 0, behavior });
    document.body?.scrollTo?.({ top, left: 0, behavior });
    if (clamped === 0) {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  scheduleScroll(run);
}

/** Scroll the main app view to top (window + document roots). */
export function scrollAppToTop(behavior: ScrollBehavior = "smooth") {
  scrollAppToFraction(0, behavior);
}

/** P2P deposit/withdrawal status — a bit above center (not full top). */
export const P2P_STATUS_SCROLL_FRACTION = 0.38;

export function scrollAppToHalfway(behavior: ScrollBehavior = "smooth") {
  scrollAppToFraction(P2P_STATUS_SCROLL_FRACTION, behavior);
}

const P2P_MARKET_SCROLL_ON_LOAD_KEY = "p2p_scroll_market_on_load";

export function markP2PMarketScrollOnLoad() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(P2P_MARKET_SCROLL_ON_LOAD_KEY, "1");
  } catch {
    // Ignore storage errors
  }
}

export function consumeP2PMarketScrollOnLoad(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(P2P_MARKET_SCROLL_ON_LOAD_KEY) !== "1") return false;
    sessionStorage.removeItem(P2P_MARKET_SCROLL_ON_LOAD_KEY);
    return true;
  } catch {
    return false;
  }
}
