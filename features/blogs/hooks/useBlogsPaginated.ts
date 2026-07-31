import { useEffect, useState } from "react";
import { BlogPost } from "../types";
import { withBlogListFallback } from "../utils/blogPosts";

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
 * Fetches paginated blogs from the API (server-side pagination and search).
 * Use this for the blogs list page. Use useBlog for homepage, marketing, and detail pages.
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

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      try {
        const res = await fetch(`/api/blogs/read/?${params.toString()}`, {
          cache: "default",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        if (data.posts != null && typeof data.totalCount === "number") {
          const transformed = (data.posts as BlogPost[]).map(
            (blog: BlogPost, index: number) => ({
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
            })
          );
          setPosts(transformed);
          setTotalCount(data.totalCount);
        } else {
          const fallback = withBlogListFallback([]);
          setPosts(fallback);
          setTotalCount(fallback.length);
        }
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
