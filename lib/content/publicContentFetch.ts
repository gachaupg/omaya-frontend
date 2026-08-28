import {
  getSanityConfigFromServer,
  resolveSanityConfig,
} from "@/config/sanity";
import { logger } from "@/lib/utils/logger";
import { fetchSanityGroqWithConfig } from "@/lib/sanityQuery";
import {
  buildAllPublicBlogsGroqQuery,
  buildPublicBlogsPaginatedGroq,
  buildPublicFaqGroqQuery,
  type PublicBlog,
  type PublicFaq,
} from "@/lib/content/sanityPublicContent";
import { filterRealBlogPosts } from "@/features/blogs/utils/blogPosts";

const PRODUCTION_APEX_ORIGIN = "https://omaya.io";

function normalizeApiPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function readApexContentOrigin(): string {
  const fromEnv = String(
    process.env.NEXT_PUBLIC_CONTENT_READ_ORIGIN ?? ""
  ).trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return PRODUCTION_APEX_ORIGIN;
}

/**
 * Content read API URL — apex omaya.io only (no www fallback).
 */
function resolveContentApiUrl(relativePath: string): string {
  const path = normalizeApiPath(relativePath);
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    return path;
  }
  return `${readApexContentOrigin()}${path}`;
}

async function tryContentApiJson<T>(relativePath: string): Promise<T | null> {
  const url = resolveContentApiUrl(relativePath);

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      logger.warn(
        "general",
        `Content API ${url} failed (${response.status}), trying direct Sanity`
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (err) {
    logger.warn("general", `Content API ${url} failed, trying direct Sanity`, err);
    return null;
  }
}

async function resolveSanityForDirectQuery() {
  if (typeof window === "undefined") {
    return getSanityConfigFromServer();
  }
  return resolveSanityConfig();
}

/** Direct Sanity HTTP — same path as OmayaExchangeMobile. */
async function fetchFromSanityDirect<T>(
  groqQuery: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const config = await resolveSanityForDirectQuery();
  if (!config.projectId || !config.dataset) {
    throw new Error("Sanity project/dataset not configured");
  }
  if (!config.token?.startsWith("sk")) {
    throw new Error(
      "Sanity read token missing — set SANITY_TOKEN locally or in AWS Secrets Manager"
    );
  }
  return fetchSanityGroqWithConfig<T>(config, groqQuery, params);
}

function appendQuery(
  path: string,
  params: Record<string, string | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") search.set(key, value);
  }
  const qs = search.toString();
  if (!qs) return path;
  return path.includes("?") ? `${path}&${qs}` : `${path}?${qs}`;
}

/** All published blogs: omaya.io API → direct Sanity. */
export async function fetchPublicBlogsWithFallback(
  refresh = false
): Promise<PublicBlog[]> {
  const apiPath = appendQuery("/api/blogs/read/", {
    refresh: refresh ? "true" : undefined,
    nocache: refresh ? "true" : undefined,
  });

  const fromApi = await tryContentApiJson<PublicBlog[]>(apiPath);
  if (Array.isArray(fromApi)) {
    return filterRealBlogPosts(fromApi) as PublicBlog[];
  }

  const data = await fetchFromSanityDirect<PublicBlog[]>(
    buildAllPublicBlogsGroqQuery()
  );
  return filterRealBlogPosts(data || []) as PublicBlog[];
}

/** Paginated blogs: omaya.io API → direct Sanity. */
export async function fetchPublicBlogsPaginatedWithFallback(
  page: number,
  limit: number,
  search?: string,
  refresh = false
): Promise<{ posts: PublicBlog[]; totalCount: number }> {
  const apiPath = appendQuery("/api/blogs/read/", {
    page: String(page),
    limit: String(limit),
    search: search?.trim() || undefined,
    refresh: refresh ? "true" : undefined,
  });

  const fromApi = await tryContentApiJson<{
    posts?: PublicBlog[];
    totalCount?: number;
  }>(apiPath);

  if (fromApi && Array.isArray(fromApi.posts)) {
    const posts = filterRealBlogPosts(fromApi.posts) as PublicBlog[];
    return {
      posts,
      totalCount: fromApi.totalCount ?? posts.length,
    };
  }

  const { countQuery, postsQuery, params } = buildPublicBlogsPaginatedGroq(
    page,
    limit,
    search
  );

  const [totalCount, posts] = await Promise.all([
    fetchFromSanityDirect<number>(countQuery, params),
    fetchFromSanityDirect<PublicBlog[]>(postsQuery, params),
  ]);

  const realPosts = filterRealBlogPosts(posts || []) as PublicBlog[];
  return {
    posts: realPosts,
    totalCount: totalCount ?? realPosts.length,
  };
}

/** FAQs: omaya.io API → direct Sanity. */
export async function fetchPublicFaqsWithFallback(
  category?: string
): Promise<PublicFaq[]> {
  const apiPath = appendQuery("/api/faq/read/", {
    category: category?.trim() || undefined,
  });

  const fromApi = await tryContentApiJson<PublicFaq[]>(apiPath);
  if (Array.isArray(fromApi)) {
    return fromApi;
  }

  const data = await fetchFromSanityDirect<PublicFaq[]>(
    buildPublicFaqGroqQuery(category)
  );
  return data || [];
}
