/** Fixed height for amount fields. */
export const SWAP_FIELD_H = "h-[48px]";

/** Flexible height for selected asset triggers (fits two-line label). */
export const SWAP_ASSET_FIELD_H = "min-h-[48px] h-auto";

/** Equal height for home card amount + select fields (exchange, MoneyX, swap). */
export const HOME_CARD_FIELD_H =
  "!h-[52px] !min-h-[52px] !max-h-[52px]";

export const SWAP_FIELD_TEXT = "text-base leading-tight";

export const SWAP_FIELD_SUBTEXT = "text-xs leading-tight";

/** Home swap amount value — light: bold, dark: normal */
export const SWAP_AMOUNT_TEXT_BASE = "text-xl leading-tight";

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

/** Home card amount input — equal height with selects. */
export function homeCardAmountFieldClass(
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
    "w-full rounded-2xl px-4 py-0 pr-16 focus:outline-none border appearance-none bg-transparent",
    HOME_CARD_FIELD_H,
    isDark
      ? "text-xl leading-none text-white font-normal"
      : "text-xl leading-none text-[#111827] font-bold",
    border,
    options?.extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Home card select trigger — equal height with amount inputs. */
export function homeCardSelectTriggerClass(isDark: boolean, extra?: string): string {
  return [
    "w-full !px-3 !py-0 rounded-2xl border bg-transparent overflow-hidden flex items-center",
    HOME_CARD_FIELD_H,
    "!text-base font-medium",
    isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function expressAssetTriggerClass(isDark: boolean, extra?: string): string {
  return [
    "w-full rounded-2xl px-3 py-1.5 focus:outline-none border flex items-center justify-between gap-2 cursor-pointer bg-transparent overflow-hidden min-w-0",
    SWAP_ASSET_FIELD_H,
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
