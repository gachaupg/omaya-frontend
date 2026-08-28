export type SanitySecrets = {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token: string;
  /** Alternate valid tokens to try if the primary is rejected by Sanity. */
  tokenCandidates: string[];
};

const DEFAULT_API_VERSION = "2025-07-04";
/** Omaya Sanity project `jhuegccg` — production dataset (development does not exist on this project). */
const DEFAULT_DATASET = "production";

/**
 * Runtime env read — use bracket access so Next/webpack cannot inline
 * build-time empty values over ECS / Secrets Manager injections.
 */
function env(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[name];
  if (value == null) return undefined;
  let trimmed = String(value).trim();
  // ECS / SM sometimes wraps values in quotes
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return undefined;
  return trimmed;
}

function pick(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value && value.trim() !== "") return value.trim();
  }
  return "";
}

/** Sanity API tokens start with `sk`. Reject baked/invalid placeholders. */
export function isValidSanityToken(token: string | undefined): boolean {
  if (!token) return false;
  const t = token.trim();
  return t.startsWith("sk") && t.length > 20;
}

function uniqueTokens(...values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!isValidSanityToken(value)) continue;
    const t = value!.trim();
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Resolve from process.env (local .env or ECS-injected Secrets Manager values).
 * Prefer SANITY_* (runtime ECS) over NEXT_PUBLIC_* (often baked at image build).
 */
export function secretsFromEnv(): SanitySecrets {
  const tokenCandidates = uniqueTokens(
    env("SANITY_TOKEN"),
    env("SANITY_READ_TOKEN"),
    env("NEXT_PUBLIC_SANITY_READ_TOKEN")
  );

  return {
    projectId: pick(
      env("SANITY_PROJECT_ID"),
      env("NEXT_PUBLIC_SANITY_PROJECT_ID")
    ),
    dataset:
      pick(env("SANITY_DATASET"), env("NEXT_PUBLIC_SANITY_DATASET")) ||
      DEFAULT_DATASET,
    apiVersion:
      pick(env("SANITY_API_VERSION"), env("NEXT_PUBLIC_SANITY_API_VERSION")) ||
      DEFAULT_API_VERSION,
    token: tokenCandidates[0] || "",
    tokenCandidates,
  };
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

function parseSecretPayload(raw: string): Partial<SanitySecrets> {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const tokenCandidates = uniqueTokens(
    asString(data.SANITY_TOKEN),
    asString(data.SANITY_READ_TOKEN),
    asString(data.NEXT_PUBLIC_SANITY_READ_TOKEN),
    asString(data.token)
  );

  return {
    projectId: pick(
      asString(data.SANITY_PROJECT_ID),
      asString(data.NEXT_PUBLIC_SANITY_PROJECT_ID),
      asString(data.projectId)
    ),
    dataset: pick(
      asString(data.SANITY_DATASET),
      asString(data.NEXT_PUBLIC_SANITY_DATASET),
      asString(data.dataset)
    ),
    apiVersion: pick(
      asString(data.SANITY_API_VERSION),
      asString(data.NEXT_PUBLIC_SANITY_API_VERSION),
      asString(data.apiVersion)
    ),
    token: tokenCandidates[0] || "",
    tokenCandidates,
  };
}

function mergeSecrets(
  base: SanitySecrets,
  override: Partial<SanitySecrets>
): SanitySecrets {
  const tokenCandidates = uniqueTokens(
    ...(override.tokenCandidates || []),
    override.token,
    ...base.tokenCandidates,
    base.token
  );

  // Explicit ECS / .env values win over JSON blob or AWS SM overrides.
  return {
    projectId: env("SANITY_PROJECT_ID") || env("NEXT_PUBLIC_SANITY_PROJECT_ID")
      ? base.projectId
      : override.projectId || base.projectId,
    dataset: env("SANITY_DATASET") || env("NEXT_PUBLIC_SANITY_DATASET")
      ? base.dataset
      : override.dataset || base.dataset,
    apiVersion:
      env("SANITY_API_VERSION") || env("NEXT_PUBLIC_SANITY_API_VERSION")
        ? base.apiVersion
        : override.apiVersion || base.apiVersion,
    token: tokenCandidates[0] || base.token || "",
    tokenCandidates,
  };
}

function isComplete(secrets: SanitySecrets): boolean {
  return Boolean(secrets.projectId && isValidSanityToken(secrets.token));
}

function secretIdFromEnv(): string | undefined {
  return (
    env("SANITY_SECRET_NAME") ||
    env("AWS_SANITY_SECRET_NAME") ||
    env("SANITY_SECRET_ARN") ||
    env("AWS_SECRET_NAME") ||
    env("SECRET_NAME")
  );
}

/** Whole-JSON injection (ECS can map one secret ARN → one env var). */
function jsonBlobFromEnv(): string | undefined {
  const candidates = [
    env("SANITY_SECRETS_JSON"),
    env("SECRETS_JSON"),
    env("APP_SECRETS"),
    env("OMAYA_SECRETS"),
  ];
  for (const blob of candidates) {
    if (blob && blob.trim().startsWith("{")) return blob;
  }
  return undefined;
}

async function fetchFromSecretsManager(
  secretId: string
): Promise<Partial<SanitySecrets> | null> {
  const { SecretsManagerClient, GetSecretValueCommand } = await import(
    "@aws-sdk/client-secrets-manager"
  );
  const region =
    env("AWS_REGION") || env("AWS_DEFAULT_REGION") || "eu-central-1";
  const sm = new SecretsManagerClient({ region });
  const response = await sm.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );
  if (!response.SecretString) return null;
  return parseSecretPayload(response.SecretString);
}

let cached: SanitySecrets | null = null;
let loading: Promise<SanitySecrets> | null = null;

/**
 * Server-only: env first (local / ECS), then JSON env blob, then AWS Secrets Manager.
 * Uses runtime env access so production SM values are not overwritten by build-time inlining.
 */
export async function loadSanitySecrets(): Promise<SanitySecrets> {
  if (cached) return cached;
  if (loading) return loading;

  loading = (async () => {
    let secrets = secretsFromEnv();

    const jsonBlob = jsonBlobFromEnv();
    if (jsonBlob) {
      try {
        secrets = mergeSecrets(secrets, parseSecretPayload(jsonBlob));
      } catch (err) {
        console.error("[Sanity] Failed to parse secrets JSON env", err);
      }
    }

    const secretId = secretIdFromEnv();

    const shouldFetchAws =
      typeof window === "undefined" &&
      Boolean(secretId) &&
      (!isComplete(secrets) || process.env.NODE_ENV === "production");

    if (shouldFetchAws && secretId) {
      try {
        const fromAws = await fetchFromSecretsManager(secretId);
        if (fromAws) {
          secrets = mergeSecrets(secrets, fromAws);
          console.info("[Sanity] Loaded config from AWS Secrets Manager", {
            secretId,
            projectId: secrets.projectId,
            dataset: secrets.dataset,
            hasToken: isValidSanityToken(secrets.token),
            tokenCandidates: secrets.tokenCandidates.length,
          });
        }
      } catch (err) {
        console.error(
          "[Sanity] Failed to load secrets from AWS Secrets Manager",
          err
        );
      }
    }

    if (!isComplete(secrets)) {
      console.error("[Sanity] Incomplete config after env/SM resolution", {
        hasProjectId: Boolean(secrets.projectId),
        hasValidToken: isValidSanityToken(secrets.token),
        dataset: secrets.dataset,
        secretIdConfigured: Boolean(secretId),
        envPresent: {
          SANITY_PROJECT_ID: Boolean(env("SANITY_PROJECT_ID")),
          SANITY_DATASET: Boolean(env("SANITY_DATASET")),
          SANITY_TOKEN: Boolean(env("SANITY_TOKEN")),
          NEXT_PUBLIC_SANITY_READ_TOKEN: Boolean(
            env("NEXT_PUBLIC_SANITY_READ_TOKEN")
          ),
        },
      });
    }

    cached = secrets;
    return secrets;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

/** Snapshot of which env keys are present (no secret values). */
export function sanityEnvPresence(): Record<string, boolean> {
  return {
    SANITY_PROJECT_ID: Boolean(env("SANITY_PROJECT_ID")),
    SANITY_DATASET: Boolean(env("SANITY_DATASET")),
    SANITY_API_VERSION: Boolean(env("SANITY_API_VERSION")),
    SANITY_TOKEN: Boolean(env("SANITY_TOKEN")),
    NEXT_PUBLIC_SANITY_PROJECT_ID: Boolean(env("NEXT_PUBLIC_SANITY_PROJECT_ID")),
    NEXT_PUBLIC_SANITY_DATASET: Boolean(env("NEXT_PUBLIC_SANITY_DATASET")),
    NEXT_PUBLIC_SANITY_READ_TOKEN: Boolean(env("NEXT_PUBLIC_SANITY_READ_TOKEN")),
    SANITY_SECRET_NAME: Boolean(secretIdFromEnv()),
  };
}

/** Test helper / debug — clears in-memory cache (e.g. after secret rotation). */
export function clearSanitySecretsCache(): void {
  cached = null;
  loading = null;
}
