// sanity/lib/client.ts
import { createClient, type SanityClient } from '@sanity/client';
import { getSanityConfig } from '@/lib/sanityConfig';
import { resolveSanityConfig } from '@/config/sanity';

function buildSanityClient(): SanityClient | null {
  const config = getSanityConfig();
  if (!config.isConfigured) return null;

  return createClient({
    projectId: config.projectId!,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: false,
    token: config.token,
    requestTagPrefix: 'omaya-blog',
    timeout: 10000,
    ignoreBrowserTokenWarning: true,
    withCredentials: false,
  });
}

let cachedClient: SanityClient | null | undefined;

/** Lazy Sanity client so browser can read runtime config injected before first use. */
export function getSanityClient(): SanityClient | null {
  if (cachedClient !== undefined) return cachedClient;
  cachedClient = buildSanityClient();
  return cachedClient;
}

export const client = {
  fetch: (...args: Parameters<SanityClient["fetch"]>) => {
    const active = getSanityClient();
    if (!active) {
      return Promise.reject(new Error("Sanity client not configured"));
    }
    return active.fetch(...args);
  },
  listen: (...args: Parameters<SanityClient["listen"]>) => {
    const active = getSanityClient();
    if (!active) {
      throw new Error("Sanity client not configured");
    }
    return active.listen(...args);
  },
} as Pick<SanityClient, "fetch" | "listen">;

// Enhanced image URL builder
export const imageBuilder = (source: any) => {
  if (!source) return '/images/alert-circle.svg'; // Use existing SVG as fallback

  try {
    // If source is already a string URL, return it
    if (typeof source === 'string') {
      return source;
    }

    // If we have the direct URL from the expanded asset
    if (source.asset?.url) {
      return source.asset.url;
    }

    // Fallback to building URL from asset reference
    if (source.asset?._ref) {
      const { projectId, dataset } = resolveSanityConfig();

      if (!projectId) {
                return '/images/alert-circle.svg';
      }

      const imageId = source.asset._ref
        .replace('image-', '')
        .replace('-jpg', '.jpg')
        .replace('-png', '.png')
        .replace('-webp', '.webp')
        .replace('-gif', '.gif')
        .replace('-svg', '.svg');

      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
    }

    return '/images/alert-circle.svg';
  } catch (error) {
        return '/images/alert-circle.svg';
  }
};