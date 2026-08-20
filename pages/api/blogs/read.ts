import { NextApiRequest, NextApiResponse } from "next";
import { getSanityConfigFromEnv, SANITY_BLOG_TYPE_FILTER } from "@/config/sanity";
import { requestManager } from "@/lib/requestManager";
import { fetchSanityGroq } from "@/lib/sanityQuery";
import { filterRealBlogPosts } from "@/features/blogs/utils/blogPosts";
import {
  fetchBlogsFromBackend,
  paginateBackendBlogPosts,
} from "@/lib/utils/contentBackendFallback";

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

const BASE_FILTER = SANITY_BLOG_TYPE_FILTER;
/** Match mobile: order(createdAt desc) */
const ORDER_CLAUSE = `order(createdAt desc)`;

const fetchBlogsFromSanity = async (): Promise<Blog[]> => {
  const query = `*[${BASE_FILTER}] | ${ORDER_CLAUSE} ${BLOG_FIELDS}`;
  const data = await fetchSanityGroq<Blog[]>(query);
  return filterRealBlogPosts(data || []);
};

const fetchBlogsPaginatedFromSanity = async (
  page: number,
  limit: number,
  search?: string
): Promise<{ posts: Blog[]; totalCount: number }> => {
  const start = (page - 1) * limit;
  const end = start + limit;

  const searchFilter = search && search.trim()
    ? `&& (
          title match "*" + $search + "*" ||
          description match "*" + $search + "*" ||
          (author_name != null && author_name match "*" + $search + "*")
        )`
    : "";

  const filter = `${BASE_FILTER} ${searchFilter}`;
  const params = search && search.trim() ? { search: search.trim() } : {};

  const [totalCount, posts] = await Promise.all([
    fetchSanityGroq<number>(`count(*[${filter}])`, params),
    fetchSanityGroq<Blog[]>(
      `*[${filter}] | ${ORDER_CLAUSE} [${start}...${end}] ${BLOG_FIELDS}`,
      params
    ),
  ]);

  const realPosts = filterRealBlogPosts(posts || []);
  return {
    posts: realPosts,
    totalCount: totalCount ?? realPosts.length,
  };
};

export const fetchBlogs = async (bypassCache: boolean = false): Promise<Blog[]> => {
  if (bypassCache) {
    requestManager.clear("blogs");
    return fetchBlogsFromSanity();
  }

  return requestManager.executeRequest("blogs", fetchBlogsFromSanity, 15 * 1000);
};

async function loadAllBlogs(refresh: boolean): Promise<Blog[]> {
  try {
    const blogs = await fetchBlogs(refresh);
    if (blogs.length > 0) {
      return blogs;
    }
  } catch {
    // Sanity failed — try backend fallback below.
  }

  try {
    const { posts } = await fetchBlogsFromBackend();
    return filterRealBlogPosts(posts as Blog[]);
  } catch {
    return [];
  }
}

async function loadPaginatedBlogs(
  page: number,
  limit: number,
  search?: string,
  refresh = false
): Promise<{ posts: Blog[]; totalCount: number }> {
  try {
    if (refresh) {
      requestManager.clear("blogs");
    }
    const result = await fetchBlogsPaginatedFromSanity(page, limit, search);
    if (result.posts.length > 0) {
      return result;
    }
    if (search?.trim()) {
      return { posts: [], totalCount: 0 };
    }
  } catch {
    // Sanity failed — try backend fallback below.
  }

  try {
    const { posts } = await fetchBlogsFromBackend();
    const paginated = paginateBackendBlogPosts(posts, page, limit, search);
    return {
      posts: filterRealBlogPosts(paginated.posts as Blog[]),
      totalCount: paginated.totalCount,
    };
  } catch {
    return { posts: [], totalCount: 0 };
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: "1mb",
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

  const refresh =
    req.query.refresh === "true" ||
    req.query.nocache === "true" ||
    req.query.refresh === "1";
  if (refresh) {
    requestManager.clear("blogs");
  }

  const sanityConfig = getSanityConfigFromEnv();
  res.setHeader("X-Sanity-Project", sanityConfig.projectId);
  res.setHeader("X-Sanity-Dataset", sanityConfig.dataset);

  if (refresh) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=15, stale-while-revalidate=30"
    );
  }
  res.setHeader("X-Content-Type-Options", "nosniff");

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
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(limitParam), 10) || 12)
      );
      const search =
        typeof searchParam === "string"
          ? searchParam.trim()
          : Array.isArray(searchParam)
            ? searchParam[0]?.trim() ?? ""
            : "";

      const { posts, totalCount } = await loadPaginatedBlogs(
        page,
        limit,
        search || undefined,
        refresh
      );
      return res.status(200).json({ posts, totalCount });
    }

    const blogs = await loadAllBlogs(refresh);
    return res.status(200).json(blogs);
  } catch {
    return res.status(200).json([]);
  }
}
