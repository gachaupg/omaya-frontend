import { NextApiRequest, NextApiResponse } from "next";
import { fetchPublicFaqsFromSanity, getPublicSanityContentMeta } from "@/lib/content/sanityPublicContent";

export interface FAQ {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const sanityMeta = await getPublicSanityContentMeta();
    res.setHeader("X-Sanity-Project", sanityMeta.projectId);
    res.setHeader("X-Sanity-Dataset", sanityMeta.dataset);
    res.setHeader("X-Content-Source", "sanity");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );

    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    const data = await fetchPublicFaqsFromSanity(category);
    return res.status(200).json(data || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch FAQs";
    const details =
      err && typeof err === "object" && "details" in err
        ? String((err as { details?: unknown }).details)
        : "No additional details available";

    return res.status(500).json({
      error: message,
      details,
    });
  }
}
