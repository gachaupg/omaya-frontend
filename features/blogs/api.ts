import { BlogPost } from "./types";
import { logger } from "@/lib/utils/logger";
import { fetchAllBlogsFromApi } from "./blogReadApi";
import { withBlogListFallback, withNewsListFallback } from "./utils/blogPosts";

export const blogApi = {
  async fetchAllPosts(): Promise<BlogPost[]> {
    try {
      const blogs = await fetchAllBlogsFromApi();
      return withBlogListFallback(blogs);
    } catch (error) {
      logger.error("general", "Error fetching posts from blog API:", error);
      return withBlogListFallback([]);
    }
  },

  async fetchBlogs(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      const blogPosts = allPosts.filter((blog) => blog.category === "blog");
      return blogPosts.length > 0 ? blogPosts : allPosts;
    } catch {
      return withBlogListFallback([]);
    }
  },

  async fetchNews(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      const newsPosts = allPosts.filter((blog) => blog.category === "news");
      return withNewsListFallback(newsPosts);
    } catch {
      return withNewsListFallback([]);
    }
  },
};
