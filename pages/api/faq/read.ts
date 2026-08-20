import { NextApiRequest, NextApiResponse } from "next";
import { getSanityConfigFromEnv } from "@/config/sanity";
import { fetchSanityGroq } from "@/lib/sanityQuery";
import { fetchFaqsFromBackend } from "@/lib/utils/contentBackendFallback";

export interface FAQ {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
}

export const fetchFAQs = async (category?: string): Promise<FAQ[]> => {
  const categoryFilter = category ? `&& category == "${category}"` : "";
  const query = `*[_type == "faq" ${categoryFilter}] | order(createdAt desc) {
    _id,
    title,
    content,
    category,
    createdAt
  }`;

  const data = await fetchSanityGroq<FAQ[]>(query);
  return data || [];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const sanityConfig = getSanityConfigFromEnv();
  res.setHeader("X-Sanity-Project", sanityConfig.projectId);
  res.setHeader("X-Sanity-Dataset", sanityConfig.dataset);
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=120"
  );

  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;

  try {
    const faqs = await fetchFAQs(category);
    if (faqs.length > 0) {
      return res.status(200).json(faqs);
    }
  } catch {
    // Sanity failed or returned nothing — try backend fallback below.
  }

  try {
    const fallbackFaqs = await fetchFaqsFromBackend(category);
    const filtered = category
      ? fallbackFaqs.filter((faq) => faq.category === category)
      : fallbackFaqs;
    return res.status(200).json(filtered.length > 0 ? filtered : fallbackFaqs);
  } catch {
    return res.status(200).json([]);
  }
}
