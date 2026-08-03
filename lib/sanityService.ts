import {
  resolveSanityConfig,
  SANITY_BLOG_TYPE_FILTER,
  type SanityRuntimeConfig,
} from "@/config/sanity";
import { fetchSanityGroqWithConfig } from "@/lib/sanityQuery";

export interface SanityBlog {
  _id: string;
  title: string;
  description: string;
  category: string;
  image?: unknown;
  author_name?: string;
  createdAt?: string;
  status?: string;
  statusChangedAt?: string;
  requestedReviewAt?: string;
  publishedAt?: string;
}

const BLOG_FIELDS = `{
  _id,
  title,
  description,
  category,
  author_name,
  createdAt,
  status,
  statusChangedAt,
  requestedReviewAt,
  publishedAt,
  image {
    asset->{
      _id,
      url,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  }
}`;

const BLOG_ORDER = "order(createdAt desc)";

async function querySanity<T>(
  groqQuery: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const config = resolveSanityConfig();
  return fetchSanityGroqWithConfig<T>(config, groqQuery, params);
}

/** All blog documents — matches mobile list query. */
export async function fetchAllBlogsFromSanity(): Promise<SanityBlog[]> {
  const query = `*[${SANITY_BLOG_TYPE_FILTER}] | ${BLOG_ORDER} ${BLOG_FIELDS}`;
  const data = await querySanity<SanityBlog[]>(query);
  return data || [];
}

export async function fetchBlogsPaginatedFromSanity(
  page: number,
  limit: number,
  search?: string
): Promise<{ posts: SanityBlog[]; totalCount: number }> {
  const start = (page - 1) * limit;
  const end = start + limit;

  const searchFilter =
    search && search.trim()
      ? `&& (
          title match "*" + $search + "*" ||
          description match "*" + $search + "*" ||
          (author_name != null && author_name match "*" + $search + "*")
        )`
      : "";

  const filter = `${SANITY_BLOG_TYPE_FILTER} ${searchFilter}`;
  const params = search?.trim() ? { search: search.trim() } : {};

  const [totalCount, posts] = await Promise.all([
    querySanity<number>(`count(*[${filter}])`, params),
    querySanity<SanityBlog[]>(
      `*[${filter}] | ${BLOG_ORDER} [${start}...${end}] ${BLOG_FIELDS}`,
      params
    ),
  ]);

  return {
    posts: posts || [],
    totalCount: totalCount ?? (posts?.length ?? 0),
  };
}

export function getSanityQueryUrl(config: SanityRuntimeConfig, groqQuery: string) {
  const encodedQuery = encodeURIComponent(groqQuery);
  return `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${encodedQuery}`;
}
