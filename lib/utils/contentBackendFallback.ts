const DEFAULT_BACKEND_ORIGIN = "https://backend.omaya.io";

export type BackendFaqItem = {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
};

export type BackendBlogItem = {
  _id: string;
  title: string;
  description: string;
  category: string;
  author_name?: string;
  createdAt?: string;
  status?: string;
  publishedAt?: string;
  image?: unknown;
};

export function resolveContentBackendOrigin(): string {
  const raw = String(
    process.env.NEXT_PUBLIC_API_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      DEFAULT_BACKEND_ORIGIN
  )
    .trim()
    .replace(/\/+$/, "");
  return raw || DEFAULT_BACKEND_ORIGIN;
}

/** Backend FAQ fallback — JSON array (not `{ posts, totalCount }`). */
export async function fetchFaqsFromBackend(
  category?: string
): Promise<BackendFaqItem[]> {
  const origin = resolveContentBackendOrigin();
  const params = new URLSearchParams();
  if (category?.trim()) {
    params.set("category", category.trim());
  }
  const query = params.toString();
  const url = `${origin}/api/v1/faqs/${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`FAQ fallback failed (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("FAQ fallback response is not a JSON array");
  }

  return data as BackendFaqItem[];
}

/** Backend blogs fallback — `{ posts, totalCount }` shape the UI already expects. */
export async function fetchBlogsFromBackend(): Promise<{
  posts: BackendBlogItem[];
  totalCount: number;
}> {
  const origin = resolveContentBackendOrigin();
  const url = `${origin}/api/v1/blogs/`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Blog fallback failed (${response.status})`);
  }

  const data = (await response.json()) as {
    posts?: BackendBlogItem[];
    totalCount?: number;
  };

  if (!data || !Array.isArray(data.posts)) {
    throw new Error("Blog fallback response missing posts array");
  }

  return {
    posts: data.posts,
    totalCount: data.totalCount ?? data.posts.length,
  };
}

export function paginateBackendBlogPosts(
  posts: BackendBlogItem[],
  page: number,
  limit: number,
  search?: string
): { posts: BackendBlogItem[]; totalCount: number } {
  let filtered = posts;

  const term = search?.trim().toLowerCase();
  if (term) {
    filtered = posts.filter((post) => {
      const title = String(post.title ?? "").toLowerCase();
      const description = String(post.description ?? "").toLowerCase();
      const author = String(post.author_name ?? "").toLowerCase();
      return (
        title.includes(term) ||
        description.includes(term) ||
        author.includes(term)
      );
    });
  }

  const totalCount = filtered.length;
  const start = Math.max(0, (page - 1) * limit);
  const end = start + limit;

  return {
    posts: filtered.slice(start, end),
    totalCount,
  };
}
