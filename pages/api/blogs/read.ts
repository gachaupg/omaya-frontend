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

const BLOG_FIELDS = `{
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

const BASE_FILTER = `_type == "blog" && (status == "published" || !defined(status))`;
const ORDER_CLAUSE = `order(coalesce(publishedAt, createdAt) desc)`;

/** Fetch all blogs (no pagination) - for backward compatibility */
const fetchBlogsFromSanity = async (): Promise<Blog[]> => {
  try {
    if (!validateSanityConfig() || !client) {
      return getFallbackBlogs();
    }
    const query = `*[${BASE_FILTER}] | ${ORDER_CLAUSE} ${BLOG_FIELDS}`;
    const data = await client.fetch(query);
        return data || [];
  } catch (err) {
        return getFallbackBlogs();
  }
};

/** Fetch paginated blogs with optional search - server-side pagination */
const fetchBlogsPaginatedFromSanity = async (
  page: number,
  limit: number,
  search?: string
): Promise<{ posts: Blog[]; totalCount: number }> => {
  try {
    if (!validateSanityConfig() || !client) {
      const fallback = getFallbackBlogs();
      return { posts: fallback, totalCount: fallback.length };
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    // Build search filter - use match for partial text search
    const searchFilter = search && search.trim()
      ? `&& (
          title match "*" + $search + "*" ||
          description match "*" + $search + "*" ||
          (author_name != null && author_name match "*" + $search + "*")
        )`
      : "";

    const filter = `${BASE_FILTER} ${searchFilter}`;

    // Fetch total count and paginated data in parallel
    const [totalCount, posts] = await Promise.all([
      client.fetch<number>(
        `count(*[${filter}])`,
        search && search.trim() ? { search: search.trim() } : {}
      ),
      client.fetch<Blog[]>(
        `*[${filter}] | ${ORDER_CLAUSE} [${start}...${end}] ${BLOG_FIELDS}`,
        search && search.trim() ? { search: search.trim() } : {}
      ),
    ]);

    return { posts: posts || [], totalCount: totalCount ?? 0 };
  } catch (err) {
        const fallback = getFallbackBlogs();
    return { posts: fallback, totalCount: fallback.length };
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
    const pageParam = req.query.page;
    const limitParam = req.query.limit;
    const searchParam = req.query.search;

    const usePagination =
      pageParam != null &&
      limitParam != null &&
      !Array.isArray(pageParam) &&
      !Array.isArray(limitParam);

    if (usePagination) {
      const page = Math.max(1, parseInt(String(pageParam), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(limitParam), 10) || 12));
      const search =
        typeof searchParam === "string"
          ? searchParam.trim()
          : Array.isArray(searchParam)
            ? searchParam[0]?.trim() ?? ""
            : "";

      try {
        const { posts, totalCount } = await fetchBlogsPaginatedFromSanity(
          page,
          limit,
          search || undefined
        );
        return res.status(200).json({ posts, totalCount });
      } catch (paginatedError) {
        const fallback = getFallbackBlogs();
        return res.status(200).json({ posts: fallback, totalCount: fallback.length });
      }
    }

    const blogs = await fetchBlogs(refresh);
    res.status(200).json(blogs);
  } catch (error) {
        // Return fallback data instead of 500 error
    const fallbackBlogs = getFallbackBlogs();
    res.status(200).json(fallbackBlogs);
  }
}
