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

// Enhanced image URL builder
export const imageBuilder = (source: any) => {
  if (!source) return '/images/placeholder.jpg';
  
  try {
    // If we have the direct URL from the expanded asset
    if (source.asset?.url) {
      return source.asset.url;
    }
    
    // Fallback to building URL from asset reference
    if (source.asset?._ref) {
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
      
      if (!projectId) {
        console.warn('Sanity project ID not configured');
        return '/images/placeholder.jpg';
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
    
    return '/images/placeholder.jpg';
  } catch (error) {
    console.error('Image builder error:', error);
    return '/images/placeholder.jpg';
  }
};