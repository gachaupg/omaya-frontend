/**
 * api.ts – auto‑generated placeholder
 */

import { BlogPost } from "./types";

export const blogApi = {
  async fetchAllPosts(): Promise<BlogPost[]> {
    try {
      const response = await fetch("/api/blogs/read");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blogs = await response.json();

      // Transform Sanity data to match UI expectations
      return blogs.map((blog: BlogPost, index: number) => ({
        ...blog,
        id: index + 1, // Generate numeric ID for UI compatibility
        created_at:
          blog.createdAt || blog.created_at || new Date().toISOString(),
        updated_at:
          blog.createdAt || blog.created_at || new Date().toISOString(),
        image: this.getImageUrl(blog.image),
        author_name: blog.author_name || "Anonymous",
      }));
    } catch (error) {
      console.error("Error fetching posts:", error);

      // Return fallback data instead of throwing error
      return [
        {
          _id: "fallback-blog-1",
          id: 1,
          title: "Blog Service Temporarily Unavailable",
          description:
            "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          content:
            "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          slug: "service-unavailable",
          image: "/images/placeholder.jpg",
          author_name: "System",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: "system",
          tags: ["system", "notice"],
        },
      ];
    }
  },

  getImageUrl(image: any): string {
    if (!image) return "/images/placeholder.jpg";

    if (typeof image === "string") {
      return image;
    }

    if (image.asset?._ref) {
      // Convert Sanity image reference to URL
      const projectId =
        process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "your-project-id";
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
      const imageId = image.asset._ref
        .replace("image-", "")
        .replace("-jpg", ".jpg")
        .replace("-png", ".png")
        .replace("-webp", ".webp");
      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
    }

    return "/images/placeholder.jpg";
  },

  async fetchBlogs(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      console.log("allPosts", allPosts);
      // Filter for blog category
      return allPosts.filter((blog: BlogPost) => blog.category === "blog");
    } catch (error) {
      console.error("Error fetching blogs:", error);
      // Return fallback data for blogs
      return [
        {
          _id: "fallback-blog-1",
          id: 1,
          title: "Blog Service Temporarily Unavailable",
          description:
            "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          content:
            "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          slug: "service-unavailable",
          image: "/images/placeholder.jpg",
          author_name: "System",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: "blog",
          tags: ["system", "notice"],
        },
      ];
    }
  },

  async fetchNews(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      // Filter for news category
      return allPosts.filter((blog: BlogPost) => blog.category === "news");
    } catch (error) {
      console.error("Error fetching news:", error);
      // Return fallback data for news
      return [
        {
          _id: "fallback-news-1",
          id: 1,
          title: "News Service Temporarily Unavailable",
          description:
            "Our news service is currently experiencing technical difficulties. Please check back later for the latest news updates.",
          content:
            "Our news service is currently experiencing technical difficulties. Please check back later for the latest news updates.",
          slug: "news-service-unavailable",
          image: "/images/placeholder.jpg",
          author_name: "System",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: "news",
          tags: ["system", "notice", "news"],
        },
      ];
    }
  },
};
