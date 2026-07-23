// sanity/lib/client.ts
import { createClient } from '@sanity/client';
import { getSanityConfig } from '@/lib/sanityConfig';

const config = getSanityConfig();

// Only create client if Sanity is properly configured
export const client = config.isConfigured ? createClient({
  projectId: config.projectId!,
  dataset: config.dataset,
  apiVersion: config.apiVersion,
  useCdn: false, // Must be false for live subscriptions to work
  token: config.token, // Optional: for private datasets
  // Add timeout configuration
  requestTagPrefix: 'omaya-blog',
  timeout: 10000, // 10 second timeout
  ignoreBrowserTokenWarning: true,
  // Enable real-time subscriptions
  withCredentials: false,
}) : null;

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
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

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