/**
 * api.ts – rates blog/news via Sanity (same source as admin / public site)
 */

import { get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { BlogResponse, BlogPost as RatesBlogPost, TransactionResponse } from "./types";
import { fetchAllBlogsFromApi } from "@/features/blogs/blogReadApi";
import type { BlogPost as SanityBlogPost } from "@/features/blogs/types";

function mapBlogPostToRatesPost(
  post: SanityBlogPost,
  index: number
): RatesBlogPost {
  const created =
    post.publishedAt ||
    post.createdAt ||
    post.created_at ||
    new Date().toISOString();

  let image = "";
  if (typeof post.image === "string") {
    image = post.image;
  } else if (post.image && typeof post.image === "object") {
    const asset = post.image.asset;
    image = asset?.url ?? "";
  }

  return {
    id: index + 1,
    category: post.category,
    title: post.title,
    description: post.description,
    image,
    created_at: created,
    updated_at: created,
    author_name: post.author_name || "Anonymous",
  };
}

function toBlogResponse(items: RatesBlogPost[]): BlogResponse {
  return {
    count: items.length,
    next: null,
    previous: null,
    results: items,
  };
}

export const blogApi = {
  async fetchBlogs(): Promise<BlogResponse> {
    const all = (await fetchAllBlogsFromApi()).map(mapBlogPostToRatesPost);
    const blogs = all.filter((post) => post.category === "blog");
    return toBlogResponse(blogs.length > 0 ? blogs : all);
  },

  async fetchNews(): Promise<BlogResponse> {
    const all = (await fetchAllBlogsFromApi()).map(mapBlogPostToRatesPost);
    const news = all.filter((post) => post.category === "news");
    return toBlogResponse(news);
  },
};

export const transactionApi = {
  async fetchTransactions(page: number = 1): Promise<TransactionResponse> {
    const response = await get<TransactionResponse>(
      `${API_CONFIG.RATES.TRANSACTIONS}?page=${page}`
    );
    return response.data;
  },
};
