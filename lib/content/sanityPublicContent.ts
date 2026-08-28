import { getServerClient } from "@/sanity/lib/client";
import { requestManager } from "@/lib/requestManager";
import { getServerSanityMeta } from "@/lib/sanityQuery";
import { filterRealBlogPosts } from "@/features/blogs/utils/blogPosts";
import type { BlogPost } from "@/features/blogs/types";

export type PublicFaq = {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
};

export type PublicBlog = Pick<
  BlogPost,
  | "_id"
  | "title"
  | "description"
  | "category"
  | "image"
  | "author_name"
  | "createdAt"
  | "status"
  | "statusChangedAt"
  | "requestedReviewAt"
  | "publishedAt"
>;

const PUBLIC_BLOG_FILTER =
  `_type == "blog" && coalesce(status, "published") == "published"`;

export const PUBLIC_BLOG_GROQ_FILTER = PUBLIC_BLOG_FILTER;

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

export const PUBLIC_BLOG_GROQ_FIELDS = BLOG_FIELDS;
export const PUBLIC_BLOG_GROQ_ORDER = BLOG_ORDER;

export function buildPublicFaqGroqQuery(category?: string): string {
  const categoryFilter =
    category && category.trim() ? `&& category == "${category.trim()}"` : "";
  return `*[_type == "faq" ${categoryFilter}] | order(createdAt desc) {
    _id,
    title,
    content,
    category,
    createdAt
  }`;
}

export function buildAllPublicBlogsGroqQuery(): string {
  return `*[${PUBLIC_BLOG_FILTER}] | ${BLOG_ORDER} ${BLOG_FIELDS}`;
}

export function buildPublicBlogsPaginatedGroq(
  page: number,
  limit: number,
  search?: string
): { countQuery: string; postsQuery: string; params: Record<string, unknown> } {
  const start = (page - 1) * limit;
  const end = start + limit;

  const searchFilter = search?.trim()
    ? `&& (
          title match "*" + $search + "*" ||
          description match "*" + $search + "*" ||
          (author_name != null && author_name match "*" + $search + "*")
        )`
    : "";

  const filter = `${PUBLIC_BLOG_FILTER} ${searchFilter}`;
  const params = search?.trim() ? { search: search.trim() } : {};

  return {
    countQuery: `count(*[${filter}])`,
    postsQuery: `*[${filter}] | ${BLOG_ORDER} [${start}...${end}] ${BLOG_FIELDS}`,
    params,
  };
}

/** Public FAQs from Sanity — same GROQ as admin /api/faq/read. */
export async function fetchPublicFaqsFromSanity(
  category?: string
): Promise<PublicFaq[]> {
  const serverClient = await getServerClient();
  const query = buildPublicFaqGroqQuery(category);

  const data = await serverClient.fetch<PublicFaq[]>(query);
  return data || [];
}

async function fetchAllPublicBlogsFromSanity(): Promise<PublicBlog[]> {
  const serverClient = await getServerClient();
  const query = buildAllPublicBlogsGroqQuery();
  const data = await serverClient.fetch<PublicBlog[]>(query);
  return filterRealBlogPosts(data || []);
}

export async function fetchPublicBlogsFromSanity(
  refresh = false
): Promise<PublicBlog[]> {
  if (refresh) {
    requestManager.clear("blogs");
    return fetchAllPublicBlogsFromSanity();
  }
  return requestManager.executeRequest(
    "blogs",
    fetchAllPublicBlogsFromSanity,
    15 * 1000
  );
}

export async function fetchPublicBlogsPaginatedFromSanity(
  page: number,
  limit: number,
  search?: string
): Promise<{ posts: PublicBlog[]; totalCount: number }> {
  const { countQuery, postsQuery, params } = buildPublicBlogsPaginatedGroq(
    page,
    limit,
    search
  );

  const serverClient = await getServerClient();
  const [totalCount, posts] = await Promise.all([
    serverClient.fetch<number>(countQuery, params),
    serverClient.fetch<PublicBlog[]>(postsQuery, params),
  ]);

  const realPosts = filterRealBlogPosts(posts || []);

  return {
    posts: realPosts,
    totalCount: totalCount ?? realPosts.length,
  };
}

export async function getPublicSanityContentMeta() {
  return getServerSanityMeta();
}
