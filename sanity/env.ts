import type { ClientConfig } from 'next-sanity';

// Client-side config
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'development';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-07-04';

// Server-side config
export const serverProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const serverDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'development';
export const serverApiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-07-04';
export const token = process.env.NEXT_PUBLIC_SANITY_READ_TOKEN || '';

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
