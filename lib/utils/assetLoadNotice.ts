import { showToast } from "@/lib/utils/toast";

/** Don't show the same asset-load toast again within this window. */
const DEDUPE_MS = 90_000;

const recentNoticeAt = new Map<string, number>();

function extractRawMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "";
  const anyErr = error as {
    message?: string;
    response?: { data?: { message?: string; error?: string; detail?: string } };
  };
  const respMsg =
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.response?.data?.detail;
  if (typeof respMsg === "string" && respMsg.trim()) return respMsg.trim();
  if (typeof anyErr?.message === "string" && anyErr.message.trim()) {
    return anyErr.message.trim();
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Redux thunk condition skips are expected during fast navigation — not user errors. */
export function shouldSkipAssetFetchError(error: unknown): boolean {
  const msg = extractRawMessage(error).toLowerCase();
  return (
    msg.includes("aborted due to condition") ||
    msg.includes("conditionerror") ||
    msg.includes("condition callback")
  );
}

/** User-friendly description for asset list load failures. */
export function formatAssetFetchErrorMessage(error: unknown): string {
  const raw = extractRawMessage(error).replace(/^Error:\s*/i, "").trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return "Unable to load assets right now. Please try again.";
  }
  if (lower.includes("request timeout") || /\btimeout\b/.test(lower)) {
    return "Loading assets is taking longer than usual. Check your connection and try again.";
  }
  if (lower.includes("network error") || lower.includes("network connection")) {
    return "We could not reach the server. Check your internet connection and try again.";
  }
  if (lower.includes("server error") || /\b5\d{2}\b/.test(lower)) {
    return "Our servers are having trouble loading assets. Please try again in a moment.";
  }
  if (lower.includes("cache")) {
    return "";
  }

  if (raw.length > 140) return `${raw.slice(0, 137)}...`;
  return raw;
}

/**
 * Show a single deduplicated toast for asset-load failures (no modal, no spam).
 */
export function reportAssetLoadIssue(
  scope: string,
  error: unknown,
  options?: { title?: string; force?: boolean }
): void {
  if (shouldSkipAssetFetchError(error)) return;

  const description = formatAssetFetchErrorMessage(error);
  if (!description) return;

  const now = Date.now();
  const last = recentNoticeAt.get(scope) ?? 0;
  if (!options?.force && now - last < DEDUPE_MS) return;

  recentNoticeAt.set(scope, now);
  showToast.error(options?.title ?? "Could not load assets", description);
}

export function clearAssetLoadNoticeDedupe(scope?: string): void {
  if (scope) recentNoticeAt.delete(scope);
  else recentNoticeAt.clear();
}
