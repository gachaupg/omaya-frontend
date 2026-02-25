import { useEffect, useState, useRef } from "react";
import { client } from "@/sanity/lib/client";
import { BlogPost } from "../types";
import { logger } from '@/lib/utils/logger';

const BLOG_QUERY = `*[_type == "blog" && (status == "published" || !defined(status))] | order(coalesce(publishedAt, createdAt) desc) {
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
    if (!client) {
      logger.warn('general', 'Sanity client not configured, live updates disabled');
      setError("Sanity client not configured");
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchInitialBlogs = async () => {
      if (!client) {
        setError("Sanity client not configured");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await client.fetch(BLOG_QUERY);
        
        // Transform Sanity data to match UI expectations
        const transformedBlogs = data.map((blog: BlogPost, index: number) => ({
          ...blog,
          id: index + 1,
          created_at: blog.publishedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
          updated_at: blog.statusChangedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
          image: blog.image,
          author_name: blog.author_name || "Anonymous",
        }));

        setBlogs(transformedBlogs);
        logger.debug('general', "Initial blogs fetched:", transformedBlogs.length);
      } catch (err) {
        logger.error('general', "Error fetching initial blogs:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialBlogs();

    // Set up live subscription
    // The listen API will trigger on any changes to documents matching the query
    if (!client) {
      return;
    }

    // Set up live subscription with proper configuration
    // visibility: 'query' listens to changes that affect the query results
    logger.info('general', "Setting up live blog subscription...");
    const subscription = client
      .listen(BLOG_QUERY, {}, { visibility: 'query' })
      .subscribe({
        next: async (update) => {
          logger.info('general', "Live update received:", {
            type: update.type,
            ...(update.type === 'mutation' && { mutations: (update as any).mutations }),
            ...(update.type === 'reconnect' && { reason: (update as any).reason }),
          });
          
          // When any change occurs (create, update, delete), refetch the data
          // This ensures we always have the latest data with proper transformations
          if (!client) return;
          
          try {
            // Small delay to ensure Sanity has processed the change
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const data = await client.fetch(BLOG_QUERY);
            
            // Transform Sanity data to match UI expectations
            const transformedBlogs = data.map((blog: BlogPost, index: number) => ({
              ...blog,
              id: index + 1,
              created_at: blog.publishedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
              updated_at: blog.statusChangedAt || blog.createdAt || blog.created_at || new Date().toISOString(),
              image: blog.image,
              author_name: blog.author_name || "Anonymous",
            }));

            setBlogs(transformedBlogs);
            logger.info('general', "Blogs updated via live subscription:", transformedBlogs.length);
          } catch (err) {
            logger.error('general', "Error updating blogs from live subscription:", err);
            // Don't set error state here to avoid disrupting the UI
            // The subscription will continue to work
          }
        },
        error: (err) => {
          logger.error('general', "Live subscription error:", err);
          // Don't set error state immediately - the subscription might recover
          // Only set error if it's a critical issue
          if (err instanceof Error && err.message.includes('connection')) {
            setError("Live updates connection lost. Please refresh the page.");
          }
        },
      });

    subscriptionRef.current = subscription;
    logger.info('general', "Live blog subscription established successfully");

    // Cleanup on unmount
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

