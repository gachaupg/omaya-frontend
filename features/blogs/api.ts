import { BlogPost } from "./types";
import { logger } from "@/lib/utils/logger";
import { fetchAllBlogsFromApi } from "./blogReadApi";
import { filterRealBlogPosts } from "./utils/blogPosts";

export const blogApi = {
  async fetchAllPosts(): Promise<BlogPost[]> {
    try {
      const blogs = await fetchAllBlogsFromApi();
      return filterRealBlogPosts(blogs);
    } catch (error) {
      logger.error("general", "Error fetching posts from blog API:", error);
      return [];
    }
  },

  async fetchBlogs(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      const blogPosts = allPosts.filter((blog) => blog.category === "blog");
      return blogPosts.length > 0 ? blogPosts : allPosts;
    } catch {
      return [];
    }
  },

  async fetchNews(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      return allPosts.filter((blog) => blog.category === "news");
    } catch {
      return [];
    }
  },
};
