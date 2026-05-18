import { showToast } from "@/lib/utils/toast";

const DEFAULT_DURATION_SECONDS = 10 * 60;

/** Map plain numeric API values to seconds (minutes, seconds, or milliseconds). */
const plainNumberToSeconds = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Typical payment limits (1–120 minutes)
  if (value <= 120) return Math.round(value * 60);
  // Seconds (e.g. 300 = 5 min)
  if (value <= 3600) return Math.round(value);
  // Milliseconds (e.g. avg completion ~669608 ms ≈ 11 min)
  if (value <= 86_400_000) return Math.round(value / 1000);
  return 0;
};

const clockPartsToSeconds = (
  hours: number,
  minutes: number,
  seconds: number
): number => {
  // P2P API: "00:00:05" => 5 minutes (last segment is minutes, not seconds)
  if (hours === 0 && minutes === 0 && seconds > 0 && seconds < 60) {
    return seconds * 60;
  }

  const fromClock = hours * 3600 + minutes * 60 + seconds;
  if (fromClock > 0 && fromClock <= 86_400) return fromClock;

  // Mis-encoded "669608:00:00" — large first segment is ms/seconds, not hours
  if (hours > 24 && minutes === 0 && seconds === 0) {
    const normalized = plainNumberToSeconds(hours);
    if (normalized > 0) return normalized;
  }

  return fromClock > 0 ? fromClock : 0;
};

export type DurationInput = string | number | null | undefined;

/** Coerce API duration (string or number) for parsing. */
export const normalizeDurationInput = (
  value: DurationInput
): string | undefined => {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  return undefined;
};

/** limit_duration first, then legacy `limit` field from create-ad payloads. */
export const getOrderLimitDuration = (order: {
  limit_duration?: DurationInput;
  limit?: DurationInput;
}): string | undefined =>
  normalizeDurationInput(order.limit_duration) ??
  normalizeDurationInput(order.limit);

/**
 * Parse duration string (HH:MM:SS, MM:SS, or plain minutes) to total seconds.
 * Used for transaction time limit countdown.
 * - "00:05:00" = 5 min = 300 sec
 * - "00:00:05" = 5 min (when only seconds part, treat as minutes)
 * - "5" or "10" = plain minutes
 * - "600" = plain seconds (10 min)
 * - "669608" = plain milliseconds (~11 min)
 */
const parseDurationToSecondsCore = (trimmed: string): number => {
  if (/^\d+$/.test(trimmed)) {
    return plainNumberToSeconds(Number(trimmed));
  }

  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0] || "0", 10);
    const minutes = parseInt(parts[1] || "0", 10);
    const seconds = parseInt((parts[2] || "0").split(".")[0] || "0", 10);
    return clockPartsToSeconds(hours, minutes, seconds);
  }

  return 0;
};

export const parseDurationToSeconds = (
  duration: DurationInput,
  options?: { useDefault?: boolean }
): number => {
  const useDefault = options?.useDefault !== false;
  const trimmed = normalizeDurationInput(duration);
  if (!trimmed) {
    return useDefault ? DEFAULT_DURATION_SECONDS : 0;
  }

  const parsed = parseDurationToSecondsCore(trimmed);
  if (parsed > 0) return parsed;
  return useDefault ? DEFAULT_DURATION_SECONDS : 0;
};

/**
 * Format duration for display (e.g. "00:05:00" -> "5 Minutes").
 * Returns empty string when value is missing (callers can use || "10 Minutes").
 */
export const formatDurationForDisplay = (duration: DurationInput): string => {
  const trimmed = normalizeDurationInput(duration);
  if (!trimmed) return "";

  const totalSeconds = parseDurationToSeconds(trimmed, { useDefault: false });
  if (totalSeconds <= 0) return "";

  const minutes = Math.round(totalSeconds / 60);
  if (minutes <= 0) return "";

  return `${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`;
};

/** Market table: payment time limit from order fields only — no 10 min default. */
export const formatMarketTimeLimit = (order: {
  limit_duration?: DurationInput;
  limit?: DurationInput;
}): string => formatDurationForDisplay(getOrderLimitDuration(order)) || "—";

/**
 * Copies text to clipboard and shows a success toast
 * @param value - The text to copy to clipboard
 */
export const handleCopy = (value: string | undefined) => {
  if (!value) return;

  navigator.clipboard.writeText(value);
  showToast.success("Copied to clipboard");
};

/**
 * Custom copy handler that shows "Copied" in button
 * @param value - The text to copy to clipboard
 * @param buttonId - The unique identifier for the button
 * @param setCopiedButton - State setter function to update which button shows "Copied"
 */
export const handleCopyToClipboard = (
  value: string | undefined,
  buttonId: string,
  setCopiedButton: (id: string | null) => void
) => {
  if (!value) return;
  navigator.clipboard.writeText(value);
  setCopiedButton(buttonId);
  setTimeout(() => setCopiedButton(null), 2000);
};
