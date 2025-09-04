// sanity/lib/client.ts
import { createClient } from '@sanity/client';
import { getSanityConfig } from '@/lib/sanityConfig';

const config = getSanityConfig();

// Only create client if Sanity is properly configured
export const client = config.isConfigured ? createClient({
  projectId: config.projectId!,
  dataset: config.dataset,
  apiVersion: config.apiVersion,
  useCdn: true, // Use CDN for better performance and reliability
  token: config.token, // Optional: for private datasets
  // Add timeout configuration
  requestTagPrefix: 'omaya-blog',
  timeout: 10000, // 10 second timeout
}) : null;

// Simple image URL builder
export const imageBuilder = (source: any) => {
  if (!source) return null;
  
  try {
    const url = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${source.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`;
    return url;
  } catch (error) {
    console.error('Image builder error:', error);
    return '/images/placeholder.jpg';
  }
};