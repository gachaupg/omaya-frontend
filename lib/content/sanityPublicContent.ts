import { getServerClient } from "@/sanity/lib/client";
import { requestManager } from "@/lib/requestManager";
import { getServerSanityMeta } from "@/lib/sanityQuery";
import { filterRealBlogPosts } from "@/features/blogs/utils/blogPosts";

export type PublicFaq = {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
};

export type PublicBlog = {
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
};

const PUBLIC_BLOG_FILTER =
  `_type == "blog" && coalesce(status, "published") == "published"`;

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

/** Public FAQs from Sanity — same GROQ as admin /api/faq/read. */
export async function fetchPublicFaqsFromSanity(
  category?: string
): Promise<PublicFaq[]> {
  const serverClient = await getServerClient();
  const categoryFilter =
    category && category.trim() ? `&& category == "${category.trim()}"` : "";

  const query = `*[_type == "faq" ${categoryFilter}] | order(createdAt desc) {
    _id,
    title,
    content,
    category,
    createdAt
  }`;

  const data = await serverClient.fetch<PublicFaq[]>(query);
  return data || [];
}

async function fetchAllPublicBlogsFromSanity(): Promise<PublicBlog[]> {
  const serverClient = await getServerClient();
  const query = `*[${PUBLIC_BLOG_FILTER}] | ${BLOG_ORDER} ${BLOG_FIELDS}`;
  const data = await serverClient.fetch<PublicBlog[]>(query);
  return filterRealBlogPosts(data || []) as PublicBlog[];
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

  const serverClient = await getServerClient();
  const [totalCount, posts] = await Promise.all([
    serverClient.fetch<number>(`count(*[${filter}])`, params),
    serverClient.fetch<PublicBlog[]>(
      `*[${filter}] | ${BLOG_ORDER} [${start}...${end}] ${BLOG_FIELDS}`,
      params
    ),
  ]);

  const realPosts = filterRealBlogPosts(posts || []) as PublicBlog[];

  return {
    posts: realPosts,
    totalCount: totalCount ?? realPosts.length,
  };
}

export async function getPublicSanityContentMeta() {
  return getServerSanityMeta();
}
