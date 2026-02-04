import { showToast } from "@/lib/utils/toast";

/**
 * Parse duration string (HH:MM:SS, MM:SS, or plain minutes) to total seconds.
 * Used for transaction time limit countdown.
 * - "00:05:00" = 5 min = 300 sec
 * - "00:00:05" = 5 min (when only seconds part, treat as minutes)
 * - "5" or "10" = plain minutes
 */
export const parseDurationToSeconds = (duration: string | undefined): number => {
  if (!duration || typeof duration !== "string") return 10 * 60; // default 10 min
  const trimmed = duration.trim();
  if (!trimmed) return 10 * 60;

  // Plain number = minutes
  const asNum = parseInt(trimmed, 10);
  if (!isNaN(asNum) && String(asNum) === trimmed) {
    return Math.max(1, asNum) * 60;
  }

  // HH:MM:SS or MM:SS format
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0] || "0", 10);
    const minutes = parseInt(parts[1] || "0", 10);
    const seconds = parseInt(parts[2] || "0", 10);
    // If HH:MM:SS with only seconds (00:00:05), treat last part as minutes
    if (hours === 0 && minutes === 0 && seconds > 0 && seconds < 60) {
      return seconds * 60;
    }
    return hours * 3600 + minutes * 60 + seconds || 10 * 60;
  }

  return 10 * 60;
};

/**
 * Format duration string for display (e.g. "00:05:00" -> "5 Minutes")
 */
export const formatDurationForDisplay = (duration: string | undefined): string => {
  if (!duration || typeof duration !== "string") return "10 Minutes";
  const trimmed = duration.trim();
  if (!trimmed) return "10 Minutes";

  const asNum = parseInt(trimmed, 10);
  if (!isNaN(asNum) && String(asNum) === trimmed) {
    return `${asNum} ${asNum === 1 ? "Minute" : "Minutes"}`;
  }

  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0] || "0", 10);
    const minutes = parseInt(parts[1] || "0", 10);
    const seconds = parseInt(parts[2] || "0", 10);
    if (hours > 0) {
      const total = hours * 60 + minutes;
      return `${total} ${total === 1 ? "Minute" : "Minutes"}`;
    }
    if (minutes > 0) return `${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`;
    if (seconds > 0 && seconds < 60) return `${seconds} ${seconds === 1 ? "Minute" : "Minutes"}`;
  }
  return "10 Minutes";
};

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
