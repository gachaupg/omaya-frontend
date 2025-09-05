// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from "next-sanity";
import { client } from "./client";

// Temporarily disable live functionality due to type conflicts
export const sanityFetch = async (query: string, params?: any) => {
  if (!client) {
    throw new Error("Sanity client not configured");
  }
  return client.fetch(query, params);
};

export const SanityLive = () => null;

// export const { sanityFetch, SanityLive } = defineLive({
//   client
// });