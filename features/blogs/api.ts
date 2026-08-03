import { BlogPost } from "./types";
import { imageBuilder } from "@/sanity/lib/client";
import { logger } from "@/lib/utils/logger";
import { fetchAllBlogsFromSanity } from "@/lib/sanityService";
import { withBlogListFallback, withNewsListFallback } from "./utils/blogPosts";

export const blogApi = {
  async fetchAllPosts(): Promise<BlogPost[]> {
    try {
      const blogs = await fetchAllBlogsFromSanity();

      return withBlogListFallback(
        blogs.map((blog, index) => ({
          ...blog,
          id: index + 1,
          created_at:
            blog.createdAt || (blog as BlogPost).created_at || new Date().toISOString(),
          updated_at:
            blog.createdAt || (blog as BlogPost).created_at || new Date().toISOString(),
          image: imageBuilder(blog.image),
          author_name: blog.author_name || "Anonymous",
        })) as BlogPost[]
      );
    } catch (error) {
      logger.error("general", "Error fetching posts from Sanity:", error);
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
