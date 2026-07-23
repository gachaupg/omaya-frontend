/** Inline script: expose server runtime env to the browser before app bundles load. */
export function buildServerRuntimeConfigScript(): string {
  const viteBaseUrl = String(
    process.env.VITE_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

  const payload = JSON.stringify({
    VITE_BASE_URL: viteBaseUrl,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "",
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",
    NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:
      process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || "",
  });

  return `(function(){try{window.__RUNTIME_CONFIG__=Object.assign(window.__RUNTIME_CONFIG__||{},${payload});}catch(e){}})();`;
}
