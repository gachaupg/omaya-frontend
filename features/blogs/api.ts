/**
 * api.ts – auto‑generated placeholder
 */

import { BlogPost } from "./types";
import { imageBuilder } from "@/sanity/lib/client";

import { logger } from '@/lib/utils/logger';
import { withBlogListFallback, withNewsListFallback } from "./utils/blogPosts";

export const blogApi = {
  async fetchAllPosts(forceRefresh: boolean = false): Promise<BlogPost[]> {
    try {
      // Only add refresh parameter when explicitly requested
      // Normal requests use cache for fast loading
      const url = forceRefresh 
        ? `/api/blogs/read/?refresh=true&_t=${Date.now()}&_r=${Math.random()}` 
        : `/api/blogs/read/?_t=${Date.now()}`;
      
      const response = await fetch(url, {
        cache: forceRefresh ? 'no-store' : 'default', // Only bypass browser cache when refreshing
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blogs = await response.json();

      // Transform Sanity data to match UI expectations
      return withBlogListFallback(
        blogs.map((blog: BlogPost, index: number) => ({
          ...blog,
          id: index + 1,
          created_at:
            blog.createdAt || blog.created_at || new Date().toISOString(),
          updated_at:
            blog.createdAt || blog.created_at || new Date().toISOString(),
          image: imageBuilder(blog.image),
          author_name: blog.author_name || "Anonymous",
        }))
      );
    } catch (error) {
      logger.error('general', "Error fetching posts:", error);
      return withBlogListFallback([]);
    }
  },


  async fetchBlogs(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      logger.debug('general', "allPosts", allPosts);
      const blogPosts = allPosts.filter((blog: BlogPost) => blog.category === "blog");
      return blogPosts.length > 0 ? blogPosts : allPosts;
    } catch (error) {
      return withBlogListFallback([]);
    }
  },

  async fetchNews(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      const newsPosts = allPosts.filter((blog: BlogPost) => blog.category === "news");
      return withNewsListFallback(newsPosts);
    } catch (error) {
      return withNewsListFallback([]);
    }
  },
};
