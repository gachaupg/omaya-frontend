import { useEffect, useState } from "react";
import { BlogPost } from "../types";
import { imageBuilder } from "@/sanity/lib/client";

export const useBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [news, setNews] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/blogs/read");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform Sanity data to match UI expectations
        const transformedBlogs = data.map((blog: BlogPost, index: number) => ({
          ...blog,
          id: index + 1, // Generate numeric ID for UI compatibility
          created_at: blog.createdAt || blog.created_at || new Date().toISOString(),
          updated_at: blog.createdAt || blog.created_at || new Date().toISOString(),
          image: imageBuilder(blog.image),
          author_name: blog.author_name || "Anonymous",
        }));


        // Filter blogs and news
        const blogPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "blog");
        const newsPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "news");

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
            image: "/images/placeholder.jpg",
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
            image: "/images/placeholder.jpg",
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

    fetchBlogs();
  }, []);

  return {
    blogs,
    news,
    loading,
    error,
  };
};

