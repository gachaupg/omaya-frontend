/** Equal height for amount + asset fields (compact text fits two-line asset label). */
export const SWAP_FIELD_H = "h-[44px]";

export const SWAP_FIELD_TEXT = "text-sm leading-tight";

export const SWAP_FIELD_SUBTEXT = "text-xs leading-tight";

/** Home swap amount value — light: bold, dark: normal */
export const SWAP_AMOUNT_TEXT_BASE = "text-lg leading-tight";

export function swapAmountValueClass(isDark: boolean): string {
  return isDark
    ? `${SWAP_AMOUNT_TEXT_BASE} text-white font-normal`
    : `${SWAP_AMOUNT_TEXT_BASE} text-[#111827] font-bold`;
}

/** @deprecated Use swapAmountValueClass(isDark) */
export const SWAP_AMOUNT_TEXT = `${SWAP_AMOUNT_TEXT_BASE} text-[#111827] font-bold`;

export function swapAmountTickerClass(isDark: boolean): string {
  return swapAmountValueClass(isDark);
}

export function expressAssetTriggerClass(isDark: boolean, extra?: string): string {
  return [
    "w-full rounded-2xl px-3 py-1.5 focus:outline-none border flex items-center justify-between gap-2 cursor-pointer bg-transparent overflow-hidden",
    SWAP_FIELD_H,
    SWAP_FIELD_TEXT,
    isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function swapAmountFieldClass(
  isDark: boolean,
  options?: { active?: boolean; extra?: string }
): string {
  const active = options?.active;
  const border = active
    ? "border-[#1D8751]"
    : isDark
      ? "border-white/10 text-white"
      : "border-gray-200 text-[#111827]";

  return [
    "w-full rounded-2xl px-4 py-2 pr-16 focus:outline-none border appearance-none bg-transparent",
    SWAP_FIELD_H,
    swapAmountValueClass(isDark),
    border,
    options?.extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function swapAssetTriggerClass(
  isDark: boolean,
  options?: { extra?: string }
): string {
  return expressAssetTriggerClass(isDark, options?.extra);
}
