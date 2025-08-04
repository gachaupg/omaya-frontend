import { NextApiRequest, NextApiResponse } from "next";
import { client } from "@/sanity/lib/client";

export interface FAQ {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
}

export const fetchFAQs = async (category?: string): Promise<FAQ[]> => {
  try {
    const query = `*[_type == "faq" ${category ? `&& category == "${category}"` : ""}] | order(createdAt desc) {
      _id,
      title,
      content,
      category,
      createdAt
    }`;

    const data = await client.fetch(query);
    return data || [];
  } catch (err) {
    throw new Error("Failed to load FAQs from Sanity");
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { category } = req.query;
    const faqs = await fetchFAQs(category as string);


    res.status(200).json(faqs);
  } catch (error) {
    // Return fallback data instead of 500 error
    const fallbackFaqs = [
      {
        _id: "fallback-faq-1",
        title: "Service Temporarily Unavailable",
        content:
          "Our FAQ service is currently experiencing technical difficulties. Please try again later or contact support for assistance.",
        category: (req.query.category as string) || "general",
        createdAt: new Date().toISOString(),
      },
    ];
    res.status(200).json(fallbackFaqs);
  }
}
