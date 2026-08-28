"use server";

import {
  fetchPublicBlogsFromSanity,
  fetchPublicBlogsPaginatedFromSanity,
} from "@/lib/content/sanityPublicContent";

/** Server Action — server-side Sanity fetch (same GROQ as admin /api/blogs/read). */
export async function fetchPublicBlogsAction(refresh = false) {
  return fetchPublicBlogsFromSanity(refresh);
}

export async function fetchPublicBlogsPaginatedAction(
  page: number,
  limit: number,
  search?: string,
  refresh = false
) {
  if (refresh) {
    return fetchPublicBlogsPaginatedFromSanity(page, limit, search);
  }
  return fetchPublicBlogsPaginatedFromSanity(page, limit, search);
}
