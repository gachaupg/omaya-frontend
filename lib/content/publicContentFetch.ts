import {
  getSanityConfigFromServer,
  resolveSanityConfig,
} from "@/config/sanity";
import { fetchSanityGroqWithConfig } from "@/lib/sanityQuery";
import {
  buildAllPublicBlogsGroqQuery,
  buildPublicBlogsPaginatedGroq,
  buildPublicFaqGroqQuery,
  type PublicBlog,
  type PublicFaq,
} from "@/lib/content/sanityPublicContent";
import { filterRealBlogPosts } from "@/features/blogs/utils/blogPosts";

async function resolveSanityConfigForQuery() {
  if (typeof window === "undefined") {
    return getSanityConfigFromServer();
  }
  return resolveSanityConfig();
}

/** Direct Sanity HTTP only — same as OmayaExchangeMobile. */
async function querySanityDirect<T>(
  groqQuery: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const config = await resolveSanityConfigForQuery();
  if (!config.projectId || !config.dataset) {
    throw new Error("Sanity project/dataset not configured");
  }
  return fetchSanityGroqWithConfig<T>(config, groqQuery, params);
}

export async function fetchPublicBlogsDirect(): Promise<PublicBlog[]> {
  const data = await querySanityDirect<PublicBlog[]>(
    buildAllPublicBlogsGroqQuery()
  );
  return filterRealBlogPosts(data || []);
}

export async function fetchPublicBlogsPaginatedDirect(
  page: number,
  limit: number,
  search?: string
): Promise<{ posts: PublicBlog[]; totalCount: number }> {
  const { countQuery, postsQuery, params } = buildPublicBlogsPaginatedGroq(
    page,
    limit,
    search
  );

  const [totalCount, posts] = await Promise.all([
    querySanityDirect<number>(countQuery, params),
    querySanityDirect<PublicBlog[]>(postsQuery, params),
  ]);

  const realPosts = filterRealBlogPosts(posts || []);
  return {
    posts: realPosts,
    totalCount: totalCount ?? realPosts.length,
  };
}

export async function fetchPublicFaqsDirect(
  category?: string
): Promise<PublicFaq[]> {
  const data = await querySanityDirect<PublicFaq[]>(
    buildPublicFaqGroqQuery(category)
  );
  return data || [];
}
