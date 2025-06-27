/**
 * api.ts – auto‑generated placeholder
 */

import { config } from "../../app.config";
import { BlogResponse } from "./types";
import { get } from "@/lib/apiClient";

export const blogApi = {
  async fetchBlogs(): Promise<BlogResponse> {
    const response = await get<BlogResponse>(config.API.BLOG.BLOGS);
    return response.data;
  },

  async fetchNews(): Promise<BlogResponse> {
    const response = await get<BlogResponse>(config.API.BLOG.NEWS);
    return response.data;
  },
};
