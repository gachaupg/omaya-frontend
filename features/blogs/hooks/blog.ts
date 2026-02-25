import { useEffect, useState, useMemo, useRef } from "react";
import { BlogPost } from "../types";
import { imageBuilder } from "@/sanity/lib/client";
import { useLiveBlog } from "./useLiveBlog";
import { logger } from '@/lib/utils/logger';

/**
 * Main blog hook that uses live subscriptions for real-time updates
 * Falls back to API-based fetching if live subscriptions are unavailable.
 * Starts API fetch in parallel so the page can show data as soon as either source returns.
 */
export const useBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [news, setNews] = useState<BlogPost[]>([]);
  const [allPostsFromAPI, setAllPostsFromAPI] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLiveUpdates, setUseLiveUpdates] = useState(true);
  const [initialApiLoading, setInitialApiLoading] = useState(true);
  const initialApiFetchedRef = useRef(false);

  // Try to use live updates first (runs in parallel with initial API fetch below)
  const { blogs: liveBlogs, loading: liveLoading, error: liveError } = useLiveBlog();

  // Parallel initial API fetch: run once on mount so data appears as soon as API returns (often faster than Sanity client from browser)
  useEffect(() => {
    if (initialApiFetchedRef.current) return;
    initialApiFetchedRef.current = true;

    const url = `/api/blogs/read?_t=${Date.now()}`;
    fetch(url, { cache: 'default' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: BlogPost[]) => {
        const transformed = (data || []).map((blog: BlogPost, index: number) => ({
          ...blog,
          id: index + 1,
          created_at: blog.publishedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
          updated_at: blog.statusChangedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
          image: blog.image,
          author_name: blog.author_name || "Anonymous",
        }));
        const blogPosts = transformed.filter((b: BlogPost) => b.category === "blog");
        const newsPosts = transformed.filter((b: BlogPost) => b.category === "news");
        setAllPostsFromAPI(transformed);
        setBlogs((prev) => (prev.length === 0 ? blogPosts : prev));
        setNews((prev) => (prev.length === 0 ? newsPosts : prev));
        logger.debug('general', "Initial API blogs loaded:", transformed.length);
      })
      .catch((err) => {
        logger.debug('general', "Initial API blogs fetch failed (will use live or fallback):", err);
      })
      .finally(() => {
        setInitialApiLoading(false);
      });
  }, []);

  // Fallback API fetch function (used when live fails or for manual refresh)
  const fetchBlogs = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Only add refresh parameter when explicitly requested
      // Normal requests use cache for fast loading
      const url = forceRefresh 
        ? `/api/blogs/read?refresh=true&_t=${Date.now()}&_r=${Math.random()}` 
        : `/api/blogs/read?_t=${Date.now()}`;
      
      const response = await fetch(url, {
        cache: forceRefresh ? 'no-store' : 'default', // Only bypass browser cache when refreshing
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.debug('general', "Raw blog data:", data);

      // Transform Sanity data to match UI expectations
      const transformedBlogs = data.map((blog: BlogPost, index: number) => ({
        ...blog,
        id: index + 1, // Generate numeric ID for UI compatibility
        created_at: blog.publishedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
        updated_at: blog.statusChangedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
        image: blog.image, // Keep image as object for proper handling in components
        author_name: blog.author_name || "Anonymous",
      }));

      logger.debug('general', "Transformed blogs:", transformedBlogs);

      // Filter blogs and news (for backward compatibility)
      const blogPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "blog");
      const newsPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "news");

      logger.debug('general', "Filtered blogs:", blogPosts);
      logger.debug('general', "Filtered news:", newsPosts);
      logger.debug('general', "All posts (all categories):", transformedBlogs);

      setBlogs(blogPosts);
      setNews(newsPosts);
      setAllPostsFromAPI(transformedBlogs); // Store all posts from API (all categories)
    } catch (err) {
      // Provide fallback data instead of showing error to user
      const fallbackBlogs: BlogPost[] = [
        {
          _id: "fallback-blog-1",
          id: 1,
          title: "Blog Service Temporarily Unavailable",
          description: "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          content: "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          slug: "service-unavailable",
          image: "/images/alert-circle.svg",
          author_name: "System",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: "blog",
          tags: ["system", "notice"],
        },
      ];

      const fallbackNews: BlogPost[] = [
        {
          _id: "fallback-news-1",
          id: 1,
          title: "News Service Temporarily Unavailable",
          description: "Our news service is currently experiencing technical difficulties. Please check back later for the latest news updates.",
          content: "Our news service is currently experiencing technical difficulties. Please check back later for the latest news updates.",
          slug: "news-service-unavailable",
          image: "/images/alert-circle.svg",
          author_name: "System",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: "news",
          tags: ["system", "notice", "news"],
        },
      ];

      setBlogs(fallbackBlogs);
      setNews(fallbackNews);
      setError("Blog service is temporarily unavailable. Please check back later for the latest updates and articles.");
    } finally {
      setLoading(false);
    }
  };

  // Use live updates if available; loading is false as soon as either API or live has data
  useEffect(() => {
    if (useLiveUpdates) {
      // Process all live blogs - filter by category for backward compatibility
      const blogPosts = liveBlogs.filter((blog: BlogPost) => blog.category === "blog");
      const newsPosts = liveBlogs.filter((blog: BlogPost) => blog.category === "news");

      setBlogs(blogPosts);
      setNews(newsPosts);
      setError(liveError);
      // Show content as soon as either source is ready (API or live)
      setLoading(liveLoading && initialApiLoading);

      // If live updates fail after initial load, fall back to API
      if (liveError && liveBlogs.length === 0 && !liveLoading) {
        logger.warn('general', "Live updates failed, falling back to API:", liveError);
        setUseLiveUpdates(false);
        fetchBlogs();
      }
    } else {
      // Use API-based fetching
      fetchBlogs();
    }
  }, [liveBlogs, liveLoading, liveError, useLiveUpdates, initialApiLoading]);

  // Get all posts regardless of category (for homepage and blogs page)
  // When live has resolved use liveBlogs; while live is still loading use API data if available for faster first paint
  const allPosts = useMemo(() => {
    if (useLiveUpdates && !liveLoading) {
      return liveBlogs;
    }
    if (allPostsFromAPI.length > 0) {
      return allPostsFromAPI;
    }
    return [...blogs, ...news];
  }, [liveBlogs, liveLoading, allPostsFromAPI, blogs, news, useLiveUpdates]);

  // Expose refresh function to allow manual cache invalidation
  const refresh = () => {
    if (useLiveUpdates) {
      // Force a refetch by temporarily disabling live updates
      setUseLiveUpdates(false);
      fetchBlogs(true);
      // Re-enable live updates after a short delay
      setTimeout(() => setUseLiveUpdates(true), 1000);
    } else {
      fetchBlogs(true);
    }
  };

  return {
    blogs,
    news,
    allPosts, // All posts regardless of category
    loading,
    error,
    refresh,
  };
};

