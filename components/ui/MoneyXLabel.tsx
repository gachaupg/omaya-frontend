"use client";

import React from "react";

/** Grey “X” for light backgrounds (replaces text X that can render as “*”). */
export const MONEYX_X_LIGHT_SRC = "/images/moneyx-x-light.png";
/** White “X” on dark or colored (green) backgrounds. */
export const MONEYX_X_WHITE_SRC = "/images/xwhite.png";
/** Brand “X” for dark mode active states. */
export const MONEYX_X_DARK_ACTIVE_SRC = "/assets/Group_7_ichuyz.png";

export type MoneyXLabelProps = {
  moneyText?: string;
  className?: string;
  moneyClassName?: string;
  xClassName?: string;
  active?: boolean;
  /** Green/primary button background — use white X in light mode */
  onColoredBackground?: boolean;
};

/**
 * Renders “Money” + X image (never a text “X”) for MoneyX branding.
 */
export function MoneyXLabel({
  moneyText = "Money",
  className = "",
  moneyClassName = "",
  xClassName = "h-[10px] sm:h-[11px] md:h-[13px] lg:h-[15px] w-auto inline-block align-middle -mt-0.5 sm:-mt-1",
  active = false,
  onColoredBackground = false,
}: MoneyXLabelProps) {
  const lightXSrc = onColoredBackground ? MONEYX_X_WHITE_SRC : MONEYX_X_LIGHT_SRC;
  const darkXSrc = active ? MONEYX_X_DARK_ACTIVE_SRC : MONEYX_X_WHITE_SRC;
  const darkXOpacity = active ? "opacity-100" : "opacity-60";

  return (
    <span
      className={`inline-flex flex-row items-center justify-center gap-0 leading-none ${className}`}
    >
      <span className={moneyClassName}>{moneyText}</span>
      <img
        src={lightXSrc}
        alt=""
        aria-hidden
        className={`${xClassName} dark:hidden`}
      />
      <img
        src={darkXSrc}
        alt=""
        aria-hidden
        className={`${xClassName} hidden dark:inline-block ${darkXOpacity}`}
      />
    </span>
  );
}

export default MoneyXLabel;
