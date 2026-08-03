import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { BlogPost } from "../types";
import { useLiveBlog } from "./useLiveBlog";
import { logger } from "@/lib/utils/logger";
import { fetchAllBlogsFromSanity } from "@/lib/sanityService";
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
 * Blog hook with live Sanity subscriptions and direct GROQ fetch (same as mobile).
 */
export const useBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [news, setNews] = useState<BlogPost[]>([]);
  const [allPostsFromSanity, setAllPostsFromSanity] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLiveUpdates, setUseLiveUpdates] = useState(true);
  const [initialSanityLoading, setInitialSanityLoading] = useState(true);
  const initialFetchedRef = useRef(false);

  const { blogs: liveBlogs, loading: liveLoading, error: liveError } =
    useLiveBlog();

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAllBlogsFromSanity();
      const { allPosts, blogPosts, newsPosts } = transformBlogPosts(
        data as BlogPost[]
      );

      setAllPostsFromSanity(allPosts);
      setBlogs(blogPosts);
      setNews(newsPosts);
      logger.debug("general", "Blogs loaded from Sanity:", data.length);
    } catch (err) {
      logger.error("general", "Direct Sanity blog fetch failed:", err);
      const fallback = withBlogListFallback([]);
      setBlogs(fallback);
      setNews(withNewsListFallback([]));
      setAllPostsFromSanity(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetchedRef.current) return;
    initialFetchedRef.current = true;

    fetchAllBlogsFromSanity()
      .then((data) => {
        const { allPosts, blogPosts, newsPosts } = transformBlogPosts(
          data as BlogPost[]
        );
        setAllPostsFromSanity(allPosts);
        setBlogs((prev) => (prev.length === 0 ? blogPosts : prev));
        setNews((prev) => (prev.length === 0 ? newsPosts : prev));
        logger.debug("general", "Initial Sanity blogs loaded:", data.length);
      })
      .catch((err) => {
        logger.debug(
          "general",
          "Initial Sanity blogs fetch failed (will use live or fallback):",
          err
        );
      })
      .finally(() => {
        setInitialSanityLoading(false);
      });
  }, []);

  useEffect(() => {
    if (useLiveUpdates) {
      const blogPosts = liveBlogs.filter((blog) => blog.category === "blog");
      const newsPosts = liveBlogs.filter((blog) => blog.category === "news");

      setBlogs(blogPosts);
      setNews(newsPosts);
      setError(liveError);
      setLoading(liveLoading && initialSanityLoading);

      if (liveError && liveBlogs.length === 0 && !liveLoading) {
        logger.warn(
          "general",
          "Live updates failed, falling back to direct Sanity fetch:",
          liveError
        );
        setUseLiveUpdates(false);
        fetchBlogs();
      }
    } else {
      fetchBlogs();
    }
  }, [
    liveBlogs,
    liveLoading,
    liveError,
    useLiveUpdates,
    initialSanityLoading,
    fetchBlogs,
  ]);

  const allPosts = useMemo(() => {
    if (useLiveUpdates && !liveLoading) {
      return liveBlogs;
    }
    if (allPostsFromSanity.length > 0) {
      return allPostsFromSanity;
    }
    return [...blogs, ...news];
  }, [liveBlogs, liveLoading, allPostsFromSanity, blogs, news, useLiveUpdates]);

  const refresh = () => {
    if (useLiveUpdates) {
      setUseLiveUpdates(false);
      fetchBlogs();
      setTimeout(() => setUseLiveUpdates(true), 1000);
    } else {
      fetchBlogs();
    }
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
