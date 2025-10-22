/**
 * swapSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { BlogState, BlogPost } from "../types";
import { blogApi } from "../api";

import { logger } from '@/lib/utils/logger';

const initialState: BlogState = {
  blogs: [],
  news: [],
  loading: false,
  error: null,
  // Add flags to track if data has been fetched
  blogsFetched: false,
  newsFetched: false,
  // Add flags to prevent multiple simultaneous requests
  blogsLoading: false,
  newsLoading: false,
};

export const fetchBlogs = createAsyncThunk(
  "blog/fetchBlogs",
  async (_, { rejectWithValue, getState }) => {
    const state = getState() as { blog: BlogState };
    
    // Prevent multiple simultaneous requests
    if (state.blog.blogsLoading || state.blog.blogsFetched) {
      logger.debug('general', "Blogs already loading or fetched, skipping");
      return state.blog.blogs;
    }

    try {
      const blogs = await blogApi.fetchBlogs();
      logger.debug('general', "blogs slice", blogs);
      // Filter for blog category
      return blogs.filter((blog: BlogPost) => blog.category === 'blog');
    } catch (error) {
      console.error("fetchBlogs error:", error);
      // Return fallback data instead of rejecting
      return [
        {
          _id: "fallback-blog-1",
          id: 1,
          title: "Blog Service Temporarily Unavailable",
          description: "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          content: "Our blog service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          slug: "service-unavailable",
          image: "/images/placeholder.jpg",
          author_name: "System",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: "blog",
          tags: ["system", "notice"],
        },
      ];
    }
  }
);

export const fetchNews = createAsyncThunk(
  "blog/fetchNews",
  async (_, { rejectWithValue, getState }) => {
    const state = getState() as { blog: BlogState };
    
    // Prevent multiple simultaneous requests
    if (state.blog.newsLoading || state.blog.newsFetched) {
      logger.debug('general', "News already loading or fetched, skipping");
      return state.blog.news;
    }

    try {
      const news = await blogApi.fetchNews();
      return news;
    } catch (error) {
      console.error("fetchNews error:", error);
      // Return fallback data instead of rejecting
      return [
        {
          _id: "fallback-news-1",
          id: 1,
          title: "News Service Temporarily Unavailable",
          description: "Our news service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          content: "Our news service is currently experiencing technical difficulties. Please check back later for the latest updates and articles.",
          slug: "news-service-unavailable",
          image: "/images/placeholder.jpg",
          author_name: "System",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: "news",
          tags: ["system", "notice"],
        },
      ];
    }
  }
);

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Blogs
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.blogsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBlogs.fulfilled,
        (state, action: PayloadAction<BlogPost[]>) => {
          state.loading = false;
          state.blogsLoading = false;
          state.blogsFetched = true;
          state.blogs = action.payload;
        }
      )
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.blogsLoading = false;
        state.blogsFetched = true;
        state.error = action.payload as string;
      });

    // Fetch News
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.newsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchNews.fulfilled,
        (state, action: PayloadAction<BlogPost[]>) => {
          state.loading = false;
          state.newsLoading = false;
          state.newsFetched = true;
          state.news = action.payload;
        }
      )
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.newsLoading = false;
        state.newsFetched = true;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = blogSlice.actions;
export default blogSlice.reducer;
