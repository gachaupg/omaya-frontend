import { NextApiRequest, NextApiResponse } from "next";
import { getServerClient } from "@/sanity/lib/client";
import { requestManager } from "@/lib/requestManager";
import { getServerSanityMeta } from "@/lib/sanityQuery";
import { filterRealBlogPosts } from "@/features/blogs/utils/blogPosts";

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

/** Public site — published blogs only (admin can pass ?status= for drafts). */
const PUBLIC_BLOG_FILTER = `_type == "blog" && coalesce(status, "published") == "published"`;

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

const ORDER_CLAUSE = `order(createdAt desc)`;

const fetchBlogsFromSanity = async (): Promise<Blog[]> => {
  const serverClient = await getServerClient();
  const query = `*[${PUBLIC_BLOG_FILTER}] | ${ORDER_CLAUSE} ${BLOG_FIELDS}`;
  const data = await serverClient.fetch<Blog[]>(query);
  return filterRealBlogPosts(data || []);
};

const fetchBlogsPaginatedFromSanity = async (
  page: number,
  limit: number,
  search?: string
): Promise<{ posts: Blog[]; totalCount: number }> => {
  const start = (page - 1) * limit;
  const end = start + limit;

  const searchFilter = search?.trim()
    ? `&& (
          title match "*" + $search + "*" ||
          description match "*" + $search + "*" ||
          (author_name != null && author_name match "*" + $search + "*")
        )`
    : "";

  const filter = `${PUBLIC_BLOG_FILTER} ${searchFilter}`;
  const params = search?.trim() ? { search: search.trim() } : {};

  const serverClient = await getServerClient();
  const [totalCount, posts] = await Promise.all([
    serverClient.fetch<number>(`count(*[${filter}])`, params),
    serverClient.fetch<Blog[]>(
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

  try {
    const sanityMeta = await getServerSanityMeta();
    res.setHeader("X-Sanity-Project", sanityMeta.projectId);
    res.setHeader("X-Sanity-Dataset", sanityMeta.dataset);

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

      const { posts, totalCount } = await fetchBlogsPaginatedFromSanity(
        page,
        limit,
        search || undefined
      );
      return res.status(200).json({ posts, totalCount });
    }

    const blogs = await fetchBlogs(refresh);
    return res.status(200).json(blogs);
  } catch (err: unknown) {
    console.error("Failed to fetch blogs:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch blogs";
    const details =
      err && typeof err === "object" && "details" in err
        ? String((err as { details?: unknown }).details)
        : "No additional details available";

    return res.status(500).json({
      error: message,
      details,
    });
  }
}
