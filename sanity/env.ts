import type { ClientConfig } from "next-sanity";
import { secretsFromEnv } from "./lib/loadSanitySecrets";

// Sync config from process.env (local .env or ECS-injected secrets).
// Server routes that need AWS Secrets Manager should use getServerClient().
const envSecrets = secretsFromEnv();

export const projectId = envSecrets.projectId;
export const dataset = envSecrets.dataset;
export const apiVersion = envSecrets.apiVersion;

export const serverProjectId = envSecrets.projectId;
export const serverDataset = envSecrets.dataset;
export const serverApiVersion = envSecrets.apiVersion;
export const token = envSecrets.token;

export const isSanityConfigured = (): boolean =>
  Boolean(projectId && projectId.trim() !== "");

const clientConfig: ClientConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  // Do not attach an invalid token — causes Sanity "Session not found"
  token: token && token.startsWith("sk") ? token : undefined,
};

const serverConfig: ClientConfig = {
  projectId: serverProjectId,
  dataset: serverDataset,
  apiVersion: serverApiVersion,
  token: token && token.startsWith("sk") ? token : undefined,
  useCdn: false,
  perspective: "published",
};

export { clientConfig, serverConfig };
