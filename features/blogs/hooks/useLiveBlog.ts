import { useEffect, useState, useRef } from "react";
import { BlogPost } from "../types";
import { logger } from "@/lib/utils/logger";
import { fetchAllBlogsFromApi } from "../blogReadApi";
import { withBlogListFallback } from "../utils/blogPosts";

const REFRESH_INTERVAL_MS = 60_000;

/**
 * Loads blogs from /api/blogs/read and refreshes periodically.
 * Avoids direct browser → Sanity calls so live/production ECS secrets work.
 */
export const useLiveBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadBlogs = async (refresh = false) => {
      try {
        if (!refresh) {
          setLoading(true);
        }
        setError(null);

        const data = await fetchAllBlogsFromApi(refresh);
        if (cancelled) return;

        setBlogs(withBlogListFallback(data));
        logger.debug("general", "Blogs loaded from API:", data.length);
      } catch (err) {
        if (cancelled) return;
        logger.error("general", "Error fetching blogs from API:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch blogs");
        setBlogs(withBlogListFallback([]));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBlogs();

    intervalRef.current = setInterval(() => {
      loadBlogs(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return { blogs, loading, error };
};
