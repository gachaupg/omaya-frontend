import { useEffect, useState, useMemo } from "react";
import { BlogPost } from "../types";
import { imageBuilder } from "@/sanity/lib/client";
import { useLiveBlog } from "./useLiveBlog";
import { logger } from '@/lib/utils/logger';

/**
 * Main blog hook that uses live subscriptions for real-time updates
 * Falls back to API-based fetching if live subscriptions are unavailable
 */
export const useBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [news, setNews] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLiveUpdates, setUseLiveUpdates] = useState(true);

  // Try to use live updates first
  const { blogs: liveBlogs, loading: liveLoading, error: liveError } = useLiveBlog();

  // Fallback API fetch function
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
        created_at: blog.createdAt || blog.created_at || new Date().toISOString(),
        updated_at: blog.createdAt || blog.created_at || new Date().toISOString(),
        image: blog.image, // Keep image as object for proper handling in components
        author_name: blog.author_name || "Anonymous",
      }));

      logger.debug('general', "Transformed blogs:", transformedBlogs);

      // Filter blogs and news
      const blogPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "blog");
      const newsPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "news");

      logger.debug('general', "Filtered blogs:", blogPosts);
      logger.debug('general', "Filtered news:", newsPosts);

      setBlogs(blogPosts);
      setNews(newsPosts);
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

  // Use live updates if available, otherwise fall back to API
  useEffect(() => {
    if (useLiveUpdates) {
      // Always process live blogs, even if empty (they might be loading)
      const blogPosts = liveBlogs.filter((blog: BlogPost) => blog.category === "blog");
      const newsPosts = liveBlogs.filter((blog: BlogPost) => blog.category === "news");
      
      setBlogs(blogPosts);
      setNews(newsPosts);
      setLoading(liveLoading);
      setError(liveError);
      
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
  }, [liveBlogs, liveLoading, liveError, useLiveUpdates]);

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
    loading,
    error,
    refresh,
  };
};

