import { useEffect, useState, useRef } from "react";
import { getSanityClient } from "@/sanity/lib/client";
import { BlogPost } from "../types";
import { logger } from '@/lib/utils/logger';
import { SANITY_BLOG_TYPE_FILTER } from "@/config/sanity";
import { withBlogListFallback } from "../utils/blogPosts";

const BLOG_QUERY = `*[${SANITY_BLOG_TYPE_FILTER}] | order(coalesce(publishedAt, createdAt) desc) {
  _id, 
  title, 
  description, 
  category,
  author_name, 
  createdAt,
  status,
  statusChangedAt,
  requestedReviewAt,
  publishedAt,
  image {
    asset->{
      _id,
      url,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  }
}`;

/**
 * Custom hook for live blog subscriptions using Sanity's listen API
 * This hook automatically updates when blogs are created, updated, or deleted
 */
export const useLiveBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    const sanityClient = getSanityClient();
    if (!sanityClient) {
      logger.warn('general', 'Sanity client not configured, live updates disabled');
      setError("Sanity client not configured");
      setLoading(false);
      return;
    }

    const fetchInitialBlogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await sanityClient.fetch(BLOG_QUERY);

        const transformedBlogs = data.map((blog: BlogPost, index: number) => ({
          ...blog,
          id: index + 1,
          created_at: blog.publishedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
          updated_at: blog.statusChangedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
          image: blog.image,
          author_name: blog.author_name || "Anonymous",
        }));

        setBlogs(withBlogListFallback(transformedBlogs));
        logger.debug('general', "Initial blogs fetched:", transformedBlogs.length);
      } catch (err) {
        logger.error('general', "Error fetching initial blogs:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialBlogs();

    logger.info('general', "Setting up live blog subscription...");
    const subscription = sanityClient
      .listen(BLOG_QUERY, {}, { visibility: 'query' })
      .subscribe({
        next: async (update) => {
          logger.info('general', "Live update received:", {
            type: update.type,
            ...(update.type === 'mutation' && { mutations: (update as any).mutations }),
            ...(update.type === 'reconnect' && { reason: (update as any).reason }),
          });

          try {
            await new Promise(resolve => setTimeout(resolve, 200));

            const data = await sanityClient.fetch(BLOG_QUERY);

            const transformedBlogs = data.map((blog: BlogPost, index: number) => ({
              ...blog,
              id: index + 1,
              created_at: blog.publishedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
              updated_at: blog.statusChangedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
              image: blog.image,
              author_name: blog.author_name || "Anonymous",
            }));

            setBlogs(withBlogListFallback(transformedBlogs));
            logger.info('general', "Blogs updated via live subscription:", transformedBlogs.length);
          } catch (err) {
            logger.error('general', "Error updating blogs from live subscription:", err);
          }
        },
        error: (err) => {
          logger.error('general', "Live subscription error:", err);
          if (err instanceof Error && err.message.includes('connection')) {
            setError("Live updates connection lost. Please refresh the page.");
          }
        },
      });

    subscriptionRef.current = subscription;
    logger.info('general', "Live blog subscription established successfully");

    return () => {
      if (subscriptionRef.current) {
        logger.info('general', "Cleaning up live blog subscription");
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return { blogs, loading, error };
};
