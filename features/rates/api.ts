/**
 * api.ts – auto‑generated placeholder
 */

import { BlogResponse, TransactionResponse } from "./types";
import { get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";

export const blogApi = {
  async fetchBlogs(): Promise<BlogResponse> {
    const response = await get<BlogResponse>(API_CONFIG.BLOG.BLOGS);
    return response.data;
  },

  async fetchNews(): Promise<BlogResponse> {
    const response = await get<BlogResponse>(API_CONFIG.BLOG.NEWS);
    return response.data;
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
