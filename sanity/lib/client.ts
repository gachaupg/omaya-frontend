// sanity/lib/client.ts
import { createClient } from '@sanity/client';

// Basic client configuration for data fetching only
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false, // Set to false for real-time data
  token: process.env.NEXT_PUBLIC_SANITY_READ_TOKEN, // Optional: for private datasets
});

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