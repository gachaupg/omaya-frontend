"use client";

import { useCallback, useEffect, useState } from "react";
import {
  computeSwapAssetDropdownPosition,
  SwapAssetDropdownPosition,
} from "@/features/swap/utils/swapAssetDropdownPosition";

const INITIAL: SwapAssetDropdownPosition = {
  top: 0,
  left: 0,
  width: 0,
  maxHeight: "80vh",
  isMobile: false,
};

export function useSwapAssetDropdownPosition(
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement | null>
) {
  const [position, setPosition] = useState<SwapAssetDropdownPosition>(INITIAL);

  const updatePosition = useCallback(() => {
    setPosition(computeSwapAssetDropdownPosition(triggerRef.current));
  }, [triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const runUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    const timeoutId = window.setTimeout(runUpdate, 10);
    window.addEventListener("resize", runUpdate);
    window.addEventListener("orientationchange", runUpdate);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", runUpdate);
      window.removeEventListener("orientationchange", runUpdate);
    };
  }, [isOpen, updatePosition]);

  return position;
}
