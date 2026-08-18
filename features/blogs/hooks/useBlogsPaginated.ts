import { useEffect, useState } from "react";
import { BlogPost } from "../types";
import { fetchBlogsPaginatedFromApi } from "../blogReadApi";
import {
  filterRealBlogPosts,
  withBlogListFallback,
} from "../utils/blogPosts";

export interface UseBlogsPaginatedOptions {
  page: number;
  limit: number;
  searchTerm?: string;
}

export interface UseBlogsPaginatedResult {
  posts: BlogPost[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Paginated blogs via /api/blogs/read (server-side Sanity — works in live/production).
 */
export const useBlogsPaginated = ({
  page,
  limit,
  searchTerm = "",
}: UseBlogsPaginatedOptions): UseBlogsPaginatedResult => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPaginated = async () => {
      setLoading(true);
      setError(null);

      try {
        const { posts: rawPosts, totalCount: count } =
          await fetchBlogsPaginatedFromApi(
            page,
            limit,
            searchTerm.trim() || undefined
          );

        if (cancelled) return;

        const realPosts = filterRealBlogPosts(rawPosts);
        if (realPosts.length > 0) {
          setPosts(realPosts);
          setTotalCount(count);
          return;
        }

        if (searchTerm.trim()) {
          setPosts([]);
          setTotalCount(0);
          return;
        }

        const fallback = withBlogListFallback([]);
        setPosts(fallback);
        setTotalCount(fallback.length);
      } catch (err) {
        if (!cancelled) {
          const fallback = withBlogListFallback([]);
          setPosts(fallback);
          setTotalCount(fallback.length);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPaginated();
    return () => {
      cancelled = true;
    };
  }, [page, limit, searchTerm]);

  return { posts, totalCount, loading, error };
};
