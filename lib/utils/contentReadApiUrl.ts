const PRODUCTION_APEX_ORIGIN = "https://omaya.io";

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** True when FAQ/blog reads should target apex omaya.io (not www). Production only. */
function shouldUseApexContentOrigin(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (typeof window !== "undefined") {
    return window.location.hostname === "www.omaya.io";
  }

  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL ?? "").toLowerCase();
  return appUrl.includes("www.omaya.io");
}

/**
 * FAQ (`/api/faq/read`) and blogs (`/api/blogs/read`) only:
 * in production, when the app is served from www.omaya.io, call apex omaya.io instead.
 * All other API routes keep using the normal base URL / relative paths.
 */
export function resolveContentReadApiUrl(path: string): string {
  const normalized = normalizePath(path);

  if (!shouldUseApexContentOrigin()) {
    return normalized;
  }

  const override = String(process.env.NEXT_PUBLIC_CONTENT_READ_ORIGIN ?? "")
    .trim()
    .replace(/\/+$/, "");
  const origin = override || PRODUCTION_APEX_ORIGIN;
  return `${origin}${normalized}`;
}
