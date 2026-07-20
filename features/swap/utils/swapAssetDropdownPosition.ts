export type SwapAssetDropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: string;
  isMobile: boolean;
};

const MOBILE_BREAKPOINT = 640;
const MIN_MARGIN = 16;

function findSwapDropdownCard(triggerEl: HTMLElement | null): HTMLElement | null {
  if (!triggerEl) return null;
  return (
    triggerEl.closest("[data-select-card='true']") ||
    triggerEl.closest("[data-asset-card='true']") ||
    triggerEl.closest("[data-swap-card='true']")
  ) as HTMLElement | null;
}

/** Fixed-position dropdown rect — mirrors home `HomeCommonSelect` / deposit payment method sizing. */
export function computeSwapAssetDropdownPosition(
  triggerEl: HTMLElement | null
): SwapAssetDropdownPosition {
  const fallback: SwapAssetDropdownPosition = {
    top: 200,
    left: MIN_MARGIN,
    width: 280,
    maxHeight: "80vh",
    isMobile: false,
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  const viewportWidth = window.innerWidth || 0;
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const cardEl = findSwapDropdownCard(triggerEl);

  if (!triggerEl || !cardEl) {
    return {
      ...fallback,
      width: Math.min(280, Math.max(0, viewportWidth - MIN_MARGIN * 2)),
      isMobile,
    };
  }

  const cardRect = cardEl.getBoundingClientRect();
  const triggerRect = triggerEl.getBoundingClientRect();

  if (isMobile) {
    let width = Math.min(cardRect.width, viewportWidth - MIN_MARGIN * 2);
    let left = cardRect.left;

    if (left < MIN_MARGIN) {
      left = MIN_MARGIN;
    }
    if (left + width > viewportWidth - MIN_MARGIN) {
      width = Math.max(0, viewportWidth - MIN_MARGIN * 2);
      left = MIN_MARGIN;
    }

    return {
      top: cardRect.top,
      left,
      width,
      maxHeight: "85vh",
      isMobile: true,
    };
  }

  const minWidth = 280;
  const maxWidth = 400;
  let desiredWidth = Math.min(
    maxWidth,
    Math.max(minWidth, triggerRect.width)
  );
  desiredWidth = Math.min(desiredWidth, viewportWidth - MIN_MARGIN * 2);

  let top = cardRect.top;
  let left = triggerRect.left;

  if (left + desiredWidth > viewportWidth - MIN_MARGIN) {
    left = viewportWidth - desiredWidth - MIN_MARGIN;
  }
  if (left < MIN_MARGIN) {
    left = MIN_MARGIN;
  }

  return {
    top,
    left,
    width: desiredWidth,
    maxHeight: "60vh",
    isMobile: false,
  };
}
