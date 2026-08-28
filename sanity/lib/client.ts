import { createClient, type ClientPerspective, type SanityClient } from "next-sanity";
import { createClient as createLegacyClient, type SanityClient as LegacySanityClient } from "@sanity/client";
import { clientConfig, serverConfig, isSanityConfigured } from "../env";
import { resolveSanityConfig } from "@/config/sanity";
import { getSanityConfig } from "@/lib/sanityConfig";
import {
  clearSanitySecretsCache,
  isValidSanityToken,
  loadSanitySecrets,
} from "./loadSanitySecrets";

const missingConfigError = () =>
  new Error(
    "Sanity CMS is not configured. Set SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_PROJECT_ID, or SANITY_SECRET_NAME for AWS Secrets Manager."
  );

function isSessionNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /session not found/i.test(msg) || /SIO-401-ANF/i.test(msg);
}

/** Stub so importing this module never throws when env vars are missing at build/runtime. */
const createStubClient = (): SanityClient => {
  const reject = () => Promise.reject(missingConfigError());
  return {
    fetch: reject,
    create: reject,
    delete: reject,
    patch: () => ({
      set: () => ({
        commit: reject,
      }),
    }),
    config: () => ({
      projectId: "",
      dataset: clientConfig.dataset,
      apiVersion: clientConfig.apiVersion,
    }),
  } as unknown as SanityClient;
};

export const client: SanityClient = isSanityConfigured()
  ? createClient({
      ...clientConfig,
    })
  : createStubClient();

/**
 * @deprecated Prefer getServerClient() so production can load AWS Secrets Manager values.
 */
export const serverClient: SanityClient = isSanityConfigured()
  ? createClient({
      ...serverConfig,
      perspective: "published" as ClientPerspective,
      useCdn: false,
    })
  : createStubClient();

let serverClientPromise: Promise<SanityClient> | null = null;

function buildClient(
  projectId: string,
  dataset: string,
  apiVersion: string,
  token: string | undefined
): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "published" as ClientPerspective,
  });
}

/**
 * Server-only Sanity client. Resolves config from env first, then AWS Secrets Manager.
 * If the primary token is rejected (Session not found), tries alternate tokens from SM/env.
 */
export async function getServerClient(): Promise<SanityClient> {
  if (typeof window !== "undefined") {
    throw new Error("getServerClient() is server-only");
  }

  if (!serverClientPromise) {
    serverClientPromise = (async () => {
      const secrets = await loadSanitySecrets();
      if (!secrets.projectId) {
        throw missingConfigError();
      }

      const candidates = (
        secrets.tokenCandidates.length
          ? secrets.tokenCandidates
          : [secrets.token]
      ).filter(isValidSanityToken);

      if (candidates.length === 0) {
        console.warn(
          "[Sanity] No valid API token (expected sk...). Check SANITY_TOKEN / NEXT_PUBLIC_SANITY_READ_TOKEN are injected by ECS from Secrets Manager."
        );
        return buildClient(
          secrets.projectId,
          secrets.dataset,
          secrets.apiVersion,
          undefined
        );
      }

      let lastError: unknown;
      for (let i = 0; i < candidates.length; i++) {
        const token = candidates[i];
        const c = buildClient(
          secrets.projectId,
          secrets.dataset,
          secrets.apiVersion,
          token
        );
        try {
          await c.fetch('*[_type == "blog"][0]._id');
          if (i > 0) {
            console.warn(
              "[Sanity] Primary token rejected; using alternate token candidate",
              { candidateIndex: i }
            );
          }
          return c;
        } catch (err) {
          lastError = err;
          if (isSessionNotFoundError(err) && i < candidates.length - 1) {
            console.warn(
              "[Sanity] Token candidate rejected (Session not found), trying next"
            );
            continue;
          }
          if (isSessionNotFoundError(err)) {
            clearSanitySecretsCache();
          }
          throw err;
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error("Unauthorized - Session not found");
    })().catch((err) => {
      serverClientPromise = null;
      throw err;
    });
  }

  return serverClientPromise;
}

function buildLegacySanityClient(): LegacySanityClient | null {
  const config = getSanityConfig();
  if (!config.isConfigured) return null;

  return createLegacyClient({
    projectId: config.projectId!,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: false,
    token: config.token,
    requestTagPrefix: "omaya-blog",
    timeout: 10000,
    ignoreBrowserTokenWarning: true,
    withCredentials: false,
  });
}

let cachedLegacyClient: LegacySanityClient | null | undefined;

/** Lazy browser client — reads runtime config injected before first use. */
export function getSanityClient(): LegacySanityClient | null {
  if (cachedLegacyClient !== undefined) return cachedLegacyClient;
  cachedLegacyClient = buildLegacySanityClient();
  return cachedLegacyClient;
}

export const legacyClient = {
  fetch: (...args: Parameters<LegacySanityClient["fetch"]>) => {
    const active = getSanityClient();
    if (!active) {
      return Promise.reject(new Error("Sanity client not configured"));
    }
    return active.fetch(...args);
  },
  listen: (...args: Parameters<LegacySanityClient["listen"]>) => {
    const active = getSanityClient();
    if (!active) {
      throw new Error("Sanity client not configured");
    }
    return active.listen(...args);
  },
} as Pick<LegacySanityClient, "fetch" | "listen">;

export const imageBuilder = (source: any) => {
  if (!source) return "/images/alert-circle.svg";

  try {
    if (typeof source === "string") {
      return source;
    }

    if (source.asset?.url) {
      return source.asset.url;
    }

    if (source.asset?._ref) {
      const { projectId, dataset } = resolveSanityConfig();

      if (!projectId) {
        return "/images/alert-circle.svg";
      }

      const imageId = source.asset._ref
        .replace("image-", "")
        .replace("-jpg", ".jpg")
        .replace("-png", ".png")
        .replace("-webp", ".webp")
        .replace("-gif", ".gif")
        .replace("-svg", ".svg");

      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
    }

    return "/images/alert-circle.svg";
  } catch {
    return "/images/alert-circle.svg";
  }
};

export { isSanityConfigured };
