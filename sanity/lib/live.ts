// Live content updates are handled directly using Sanity's listen API
// in the useLiveBlog hook. This file is kept for potential future use
// with server-side live previews if needed.

import { client } from "./client";

// Simple fetch wrapper (not using defineLive as it requires Server Components)
export const sanityFetch = async (query: string, params?: any) => {
  if (!client) {
    throw new Error("Sanity client not configured");
  }
  return client.fetch(query, params);
};

// SanityLive component is not needed for client-side live updates
// We use the listen API directly in useLiveBlog hook instead
export const SanityLive = () => null;