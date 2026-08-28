"use server";

import { fetchPublicFaqsFromSanity } from "@/lib/content/sanityPublicContent";

/** Server Action — server-side Sanity fetch (same GROQ as admin /api/faq/read). */
export async function fetchPublicFaqsAction(category?: string) {
  return fetchPublicFaqsFromSanity(category);
}
