import { NextApiRequest, NextApiResponse } from "next";
import { client, imageBuilder } from "@/sanity/lib/client";
import { validateSanityConfig } from "@/lib/sanityConfig";
import { requestManager } from "@/lib/requestManager";

export interface Blog {
  _id: string;
  title: string;
  description: string;
  category: string;
  image?: any;
  author_name?: string;
  createdAt?: string;
  status?: string;
  statusChangedAt?: string;
  requestedReviewAt?: string;
  publishedAt?: string;
}

const BLOG_QUERY = `*[_type == "blog" && (status == "published" || !defined(status))] | order(coalesce(publishedAt, createdAt) desc) {
  _id, 
  title, 
  description, 
  category,
  author_name, 
  createdAt,
  status,
  statusChangedAt,
  requestedReviewAt,
  publishedAt,
  image {
    asset->{
      _id,
      url,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  }
}`;

const fetchBlogsFromSanity = async (): Promise<Blog[]> => {
  try {
    // Check if Sanity is properly configured and client exists
    if (!validateSanityConfig() || !client) {
      return getFallbackBlogs();
    }

    const data = await client.fetch(BLOG_QUERY);
    
    console.log(`[API] Successfully fetched ${data?.length || 0} blogs from Sanity`);
    return data || [];
  } catch (err) {
    console.error(`[API] Failed to load blogs from Sanity:`, err);
    // Return fallback data instead of throwing error
    return getFallbackBlogs();
  }
};

export const fetchBlogs = async (bypassCache: boolean = false): Promise<Blog[]> => {
  // If bypassing cache, completely skip requestManager and fetch directly
  if (bypassCache) {
    requestManager.clear('blogs');
    return fetchBlogsFromSanity();
  }

  // Use requestManager with short cache TTL (15 seconds) for fast loading with quick updates
  return requestManager.executeRequest('blogs', fetchBlogsFromSanity, 15 * 1000);
};

const getFallbackBlogs = (): Blog[] => [
  {
    _id: "fallback-blog-1",
    title: "Blog Service Temporarily Unavailable",
    description:
      "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
    category: "system",
    author_name: "System",
    createdAt: new Date().toISOString(),
    image: "/images/alert-circle.svg",
  },
];

// Disable Next.js API route caching
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check for cache bypass query parameters
  const refresh = req.query.refresh === 'true' || req.query.nocache === 'true' || req.query.refresh === '1';
  
  // Set cache-control headers based on refresh parameter
  if (refresh) {
    // When refreshing, prevent all caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // For normal requests, allow short-term caching (15 seconds)
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');

  try {
    const blogs = await fetchBlogs(refresh);
    res.status(200).json(blogs);
  } catch (error) {
    console.error("API handler error:", error);
    // Return fallback data instead of 500 error
    const fallbackBlogs = getFallbackBlogs();
    res.status(200).json(fallbackBlogs);
  }
}
