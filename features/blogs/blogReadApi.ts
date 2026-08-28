import { BlogPost } from "./types";
import { filterRealBlogPosts } from "./utils/blogPosts";
import {
  fetchPublicBlogsPaginatedWithFallback,
  fetchPublicBlogsWithFallback,
} from "@/lib/content/publicContentFetch";

function transformBlogPost(blog: BlogPost, index: number): BlogPost {
  return {
    ...blog,
    id: index + 1,
    created_at:
      blog.publishedAt ||
      blog.createdAt ||
      blog.created_at ||
      new Date().toISOString(),
    updated_at:
      blog.statusChangedAt ||
      blog.createdAt ||
      blog.created_at ||
      new Date().toISOString(),
    image: blog.image,
    author_name: blog.author_name || "Anonymous",
  };
}

/**
 * Blogs: same-origin `/api/blogs/read/` first, then direct Sanity (mobile path).
 * Sanity creds: `.env` locally; AWS Secrets Manager → runtime config in production.
 */
export async function fetchAllBlogsFromApi(
  refresh = false
): Promise<BlogPost[]> {
  const data = await fetchPublicBlogsWithFallback(refresh);
  const realPosts = filterRealBlogPosts(data as BlogPost[]);
  return realPosts.map(transformBlogPost);
}

export async function fetchBlogsPaginatedFromApi(
  page: number,
  limit: number,
  search?: string,
  refresh = false
): Promise<{ posts: BlogPost[]; totalCount: number }> {
  const data = await fetchPublicBlogsPaginatedWithFallback(
    page,
    limit,
    search,
    refresh
  );

  const realPosts = filterRealBlogPosts((data.posts || []) as BlogPost[]);
  return {
    posts: realPosts.map(transformBlogPost),
    totalCount: data.totalCount ?? realPosts.length,
  };
}
