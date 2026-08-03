import { useEffect, useState } from "react";
import { BlogPost } from "../types";
import { fetchBlogsPaginatedFromSanity } from "@/lib/sanityService";
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

function transformBlogPost(blog: BlogPost, index: number): BlogPost {
  return {
    ...blog,
    id: index + 1,
    created_at:
      blog.publishedAt ||
      blog.createdAt ||
      blog.created_at ||
      new Date().toISOString(),
    updated_at:
      blog.statusChangedAt ||
      blog.createdAt ||
      blog.created_at ||
      new Date().toISOString(),
    image: blog.image,
    author_name: blog.author_name || "Anonymous",
  };
}

/**
 * Paginated blogs via direct Sanity GROQ (same as mobile).
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
          await fetchBlogsPaginatedFromSanity(
            page,
            limit,
            searchTerm.trim() || undefined
          );

        if (cancelled) return;

        const realPosts = filterRealBlogPosts(rawPosts as BlogPost[]);
        if (realPosts.length > 0) {
          setPosts(realPosts.map(transformBlogPost));
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
      } catch {
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
