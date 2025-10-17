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
}

export const fetchBlogs = async (): Promise<Blog[]> => {
  return requestManager.executeRequest('blogs', async () => {
    try {
      // Check if Sanity is properly configured and client exists
      if (!validateSanityConfig() || !client) {
        console.warn(`[API] Sanity not configured, returning fallback data (container: ${process.env.HOSTNAME || 'unknown'})`);
        return getFallbackBlogs();
      }

      console.log(`[API] Fetching blogs from Sanity... (container: ${process.env.HOSTNAME || 'unknown'})`);
      const data = await client.fetch(
        `*[_type == "blog"] | order(createdAt desc) {
            _id, 
            title, 
            description, 
            category,
            author_name, 
            createdAt,
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
          }`
      );
      
      console.log(`[API] Successfully fetched ${data?.length || 0} blogs from Sanity`);
      return data || [];
    } catch (err) {
      console.error(`[API] Failed to load blogs from Sanity:`, err);
      // Return fallback data instead of throwing error
      return getFallbackBlogs();
    }
  }, 5 * 60 * 1000); // Cache for 5 minutes
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const blogs = await fetchBlogs();
    res.status(200).json(blogs);
  } catch (error) {
    console.error("API handler error:", error);
    // Return fallback data instead of 500 error
    const fallbackBlogs = getFallbackBlogs();
    res.status(200).json(fallbackBlogs);
  }
}
