import { NextApiRequest, NextApiResponse } from "next";
import { getServerClient } from "@/sanity/lib/client";

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
    const serverClient = await getServerClient();
    const { category } = req.query;

    const categoryFilter =
      typeof category === "string" && category.trim()
        ? `&& category == "${category.trim()}"`
        : "";

    const query = `*[_type == "faq" ${categoryFilter}] | order(createdAt desc) {
      _id,
      title,
      content,
      category,
      createdAt
    }`;

    const data = await serverClient.fetch<FAQ[]>(query);

    if (!data || data.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(data);
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
