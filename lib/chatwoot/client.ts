import { resolveChatwootConfig, isChatwootConfigured } from "@/config/chatwoot";
import { CHATWOOT_SETTINGS } from "./config";
import { identifyChatwootUser } from "./identifyUser";
import "./types";

let loadPromise: Promise<void> | null = null;

function configureChatwootWidget(): void {
  identifyChatwootUser();
}

function waitForChatwootReady(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      if (window.$chatwoot) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error("Chatwoot failed to initialize"));
        return;
      }
      window.setTimeout(check, 50);
    };

    check();
  });
}

/** Load Chatwoot SDK once (custom launcher — default bubble hidden). */
export function loadChatwoot(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const config = resolveChatwootConfig();
  if (!isChatwootConfigured(config)) {
    return Promise.reject(new Error("Chatwoot is not configured"));
  }

  if (window.$chatwoot) {
    configureChatwootWidget();
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  const { baseUrl, websiteToken } = config;

  loadPromise = new Promise((resolve, reject) => {
    window.chatwootSettings = CHATWOOT_SETTINGS;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-chatwoot-sdk="true"]'
    );
    if (existing) {
      waitForChatwootReady()
        .then(() => {
          configureChatwootWidget();
          resolve();
        })
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.async = true;
    script.dataset.chatwootSdk = "true";
    script.onload = () => {
      window.chatwootSDK?.run({
        websiteToken,
        baseUrl,
      });
      waitForChatwootReady()
        .then(() => {
          configureChatwootWidget();
          resolve();
        })
        .catch(reject);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Chatwoot SDK"));
    };

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.body.appendChild(script);
    }
  });

  return loadPromise;
}

/** Open the Chatwoot widget. */
export async function openChatwoot(): Promise<void> {
  await loadChatwoot();
  configureChatwootWidget();
  window.$chatwoot?.toggle("open");
}
