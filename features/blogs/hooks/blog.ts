import { useEffect, useState } from "react";
import { BlogPost } from "../types";

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
        console.log("Raw blog data:", data);

        // Transform Sanity data to match UI expectations
        const transformedBlogs = data.map((blog: BlogPost, index: number) => ({
          ...blog,
          id: index + 1, // Generate numeric ID for UI compatibility
          created_at: blog.createdAt || blog.created_at || new Date().toISOString(),
          updated_at: blog.createdAt || blog.created_at || new Date().toISOString(),
          image: getImageUrl(blog.image),
          author_name: blog.author_name || "Anonymous",
        }));

        console.log("Transformed blogs:", transformedBlogs);

        // Filter blogs and news
        const blogPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "blog");
        const newsPosts = transformedBlogs.filter((blog: BlogPost) => blog.category === "news");

        console.log("Filtered blogs:", blogPosts);
        console.log("Filtered news:", newsPosts);

        setBlogs(blogPosts);
        setNews(newsPosts);
      } catch (err) {
        console.error("Error fetching blogs:", err);

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
        setError("Blog service is temporarily unavailable. Please try again later.");
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

// Helper function to get image URL from Sanity data
const getImageUrl = (image: any): string => {
  if (!image) return "/images/placeholder.jpg";

  if (typeof image === "string") {
    return image;
  }

  // Handle Sanity image with asset.url (from the updated query)
  if (image.asset && 'url' in image.asset) {
    return (image.asset as any).url || "/images/placeholder.jpg";
  }

  // Handle Sanity image with asset._ref (legacy format)
  if (image.asset?._ref) {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "your-project-id";
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
    const imageId = image.asset._ref
      .replace("image-", "")
      .replace("-jpg", ".jpg")
      .replace("-png", ".png")
      .replace("-webp", ".webp");
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
  }

  return "/images/placeholder.jpg";
};
