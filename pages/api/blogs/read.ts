import { NextApiRequest, NextApiResponse } from "next";
import { requestManager } from "@/lib/requestManager";
import {
  fetchPublicBlogsFromSanity,
  fetchPublicBlogsPaginatedFromSanity,
  getPublicSanityContentMeta,
} from "@/lib/content/sanityPublicContent";

export type { PublicBlog as Blog } from "@/lib/content/sanityPublicContent";

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
    const sanityMeta = await getPublicSanityContentMeta();
    res.setHeader("X-Sanity-Project", sanityMeta.projectId);
    res.setHeader("X-Sanity-Dataset", sanityMeta.dataset);
    res.setHeader("X-Content-Source", "sanity");

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

      const { posts, totalCount } = await fetchPublicBlogsPaginatedFromSanity(
        page,
        limit,
        search || undefined
      );
      return res.status(200).json({ posts, totalCount });
    }

    const blogs = await fetchPublicBlogsFromSanity(refresh);
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
