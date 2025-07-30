import { NextApiRequest, NextApiResponse } from "next";
import { client, imageBuilder } from "@/sanity/lib/client";

export interface Blog {
  _id: string;
  title: string;
  description: string;
  category: string;
  image?: any;
  author_name?: string;
  createdAt?: string;
}

export const fetchBlogs = async (): Promise<Blog[]> => {
  try {
    console.log("Fetching blogs from Sanity...");
    const data = await client.fetch(
      `*[_type == "blog"] | order(createdAt desc) {
          _id, 
          title, 
          description, 
          category,
          author_name, 
          createdAt,
          image
        }`
    );
    console.log("Fetched blogs:", data);
    return data || [];
  } catch (err) {
    console.error("Sanity fetch error:", err);
    throw new Error("Failed to load blogs from Sanity");
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
    const blogs = await fetchBlogs();
    res.status(200).json(blogs);
  } catch (error) {
    console.error("API Error:", error);

    // Return fallback data instead of 500 error
    const fallbackBlogs = [
      {
        _id: "fallback-blog-1",
        title: "Blog Service Temporarily Unavailable",
        description:
          "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
        category: "system",
        author_name: "System",
        createdAt: new Date().toISOString(),
        image: null,
      },
    ];

    console.log("Returning fallback blog data due to error");
    res.status(200).json(fallbackBlogs);
  }
}
