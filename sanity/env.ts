import type { ClientConfig } from 'next-sanity';
import { resolveSanityConfig } from '@/config/sanity';

const runtimeSanityConfig = resolveSanityConfig();

// Client-side config
export const projectId = runtimeSanityConfig.projectId;
export const dataset = runtimeSanityConfig.dataset || 'production';
export const apiVersion = runtimeSanityConfig.apiVersion;

// Server-side config
export const serverProjectId = runtimeSanityConfig.projectId;
export const serverDataset = runtimeSanityConfig.dataset || 'production';
export const serverApiVersion = runtimeSanityConfig.apiVersion;
export const token = runtimeSanityConfig.token;

const clientConfig: ClientConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  token
};

const serverConfig: ClientConfig = {
  projectId: serverProjectId,
  dataset: serverDataset,
  apiVersion: serverApiVersion,
  token,
  useCdn: false,
  perspective: 'published',
};

export { clientConfig, serverConfig };
