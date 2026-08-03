import { useEffect, useState, useMemo, useCallback } from "react";
import { BlogPost } from "../types";
import { useLiveBlog } from "./useLiveBlog";
import { logger } from "@/lib/utils/logger";
import { blogApi } from "../api";
import { withBlogListFallback, withNewsListFallback } from "../utils/blogPosts";

function transformBlogPosts(data: BlogPost[]): {
  allPosts: BlogPost[];
  blogPosts: BlogPost[];
  newsPosts: BlogPost[];
} {
  const transformed = (data || []).map((blog, index) => ({
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
  }));

  const allPosts = withBlogListFallback(transformed);
  const blogPosts =
    transformed.filter((b) => b.category === "blog").length > 0
      ? transformed.filter((b) => b.category === "blog")
      : allPosts;
  const newsPosts = withNewsListFallback(
    transformed.filter((b) => b.category === "news")
  );

  return { allPosts, blogPosts, newsPosts };
}

/**
 * Blog hook — reads via /api/blogs/read (server-side Sanity), with periodic refresh.
 */
export const useBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [news, setNews] = useState<BlogPost[]>([]);
  const [allPostsFromApi, setAllPostsFromApi] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { blogs: liveBlogs, loading: liveLoading, error: liveError } =
    useLiveBlog();

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await blogApi.fetchAllPosts();
      const { allPosts, blogPosts, newsPosts } = transformBlogPosts(data);

      setAllPostsFromApi(allPosts);
      setBlogs(blogPosts);
      setNews(newsPosts);
      logger.debug("general", "Blogs loaded from API:", data.length);
    } catch (err) {
      logger.error("general", "Blog API fetch failed:", err);
      const fallback = withBlogListFallback([]);
      setBlogs(fallback);
      setNews(withNewsListFallback([]));
      setAllPostsFromApi(fallback);
      setError(err instanceof Error ? err.message : "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const blogPosts = liveBlogs.filter((blog) => blog.category === "blog");
    const newsPosts = liveBlogs.filter((blog) => blog.category === "news");

    if (liveBlogs.length > 0) {
      setBlogs(blogPosts.length > 0 ? blogPosts : liveBlogs);
      setNews(newsPosts);
      setAllPostsFromApi(liveBlogs);
    }

    setError(liveError);
    setLoading(liveLoading);
  }, [liveBlogs, liveLoading, liveError]);

  const allPosts = useMemo(() => {
    if (allPostsFromApi.length > 0) {
      return allPostsFromApi;
    }
    return [...blogs, ...news];
  }, [allPostsFromApi, blogs, news]);

  const refresh = () => {
    fetchBlogs();
  };

  return {
    blogs,
    news,
    allPosts,
    loading,
    error,
    refresh,
  };
};
