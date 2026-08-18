import { BlogPost } from "./types";
import { filterRealBlogPosts } from "./utils/blogPosts";
import { fetchContentReadApi } from "@/lib/utils/contentReadApiUrl";

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

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Blog API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

/** Fetch all blogs via the server API (ECS env + Sanity token stay server-side). */
export async function fetchAllBlogsFromApi(
  refresh = false
): Promise<BlogPost[]> {
  const query = refresh ? "?refresh=true" : "";
  const data = await parseJsonResponse<BlogPost[]>(
    await fetchContentReadApi(`/api/blogs/read${query}`, {
      cache: "no-store",
    })
  );
  const realPosts = filterRealBlogPosts(data || []);
  return realPosts.map(transformBlogPost);
}

/** Paginated blogs via the server API — same route the admin panel pattern uses. */
export async function fetchBlogsPaginatedFromApi(
  page: number,
  limit: number,
  search?: string,
  refresh = false
): Promise<{ posts: BlogPost[]; totalCount: number }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  if (refresh) {
    params.set("refresh", "true");
  }

  const data = await parseJsonResponse<{ posts: BlogPost[]; totalCount: number }>(
    await fetchContentReadApi(`/api/blogs/read?${params.toString()}`, {
      cache: "no-store",
    })
  );

  const realPosts = filterRealBlogPosts(data.posts || []);
  return {
    posts: realPosts.map(transformBlogPost),
    totalCount: data.totalCount ?? realPosts.length,
  };
}
