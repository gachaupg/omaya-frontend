import type { BlogPost } from "../types";

/** Placeholder posts injected when Sanity fails or returns no posts. */
export function isSystemFallbackBlogPost(
  post: Pick<BlogPost, "_id" | "title" | "category"> | null | undefined
): boolean {
  if (!post) return false;
  const id = String(post._id ?? "");
  if (id.startsWith("fallback-")) return true;
  if (post.category === "system") return true;
  return String(post.title ?? "").includes("Temporarily Unavailable");
}

export function filterRealBlogPosts<T extends BlogPost>(posts: T[]): T[] {
  return posts.filter((post) => !isSystemFallbackBlogPost(post));
}

export function createServiceUnavailableBlogPost(
  category: "blog" | "news" | "system" = "system"
): BlogPost {
  const isNews = category === "news";
  return {
    _id: isNews ? "fallback-news-1" : "fallback-blog-1",
    id: 1,
    title: isNews
      ? "News Service Temporarily Unavailable"
      : "Blog Service Temporarily Unavailable",
    description: isNews
      ? "Our news service is currently experiencing technical difficulties. Please check back later for the latest news updates."
      : "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
    content: isNews
      ? "Our news service is currently experiencing technical difficulties. Please check back later for the latest news updates."
      : "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
    slug: isNews ? "news-service-unavailable" : "service-unavailable",
    image: "/images/alert-circle.svg",
    author_name: "System",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    category,
    tags: isNews ? ["system", "notice", "news"] : ["system", "notice"],
  };
}

/** Shown on the blogs list when Sanity returns no posts. */
export function getBlogListFallbackPosts(): BlogPost[] {
  return [createServiceUnavailableBlogPost("system")];
}

export function withBlogListFallback<T extends BlogPost>(posts: T[]): T[] {
  const real = filterRealBlogPosts(posts);
  if (real.length > 0) return real;
  return getBlogListFallbackPosts() as T[];
}

export function withNewsListFallback<T extends BlogPost>(posts: T[]): T[] {
  const real = filterRealBlogPosts(posts);
  if (real.length > 0) return real;
  return [createServiceUnavailableBlogPost("news")] as T[];
}
