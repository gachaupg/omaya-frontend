import { NextApiRequest, NextApiResponse } from "next";
import { getSanityConfigFromEnv } from "@/config/sanity";
import { fetchSanityGroq } from "@/lib/sanityQuery";

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

  try {
    const { category } = req.query;
    const faqs = await fetchFAQs(category as string);
    res.status(200).json(faqs);
  } catch {
    res.status(200).json([
      {
        _id: "fallback-faq-1",
        title: "Service Temporarily Unavailable",
        content:
          "Our FAQ service is currently experiencing technical difficulties. Please try again later or contact support for assistance.",
        category: (req.query.category as string) || "general",
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}
