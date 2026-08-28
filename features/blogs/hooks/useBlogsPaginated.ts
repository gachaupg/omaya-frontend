import { useEffect, useState } from "react";
import { BlogPost } from "../types";
import { fetchBlogsPaginatedFromApi } from "../blogReadApi";
import { filterRealBlogPosts } from "../utils/blogPosts";

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

/** Paginated blogs via direct Sanity API. */
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
        setPosts(realPosts);
        setTotalCount(realPosts.length > 0 ? count : 0);
      } catch (err) {
        if (!cancelled) {
          setPosts([]);
          setTotalCount(0);
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
