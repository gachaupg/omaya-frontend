/**
 * swapSlice.ts – auto‑generated placeholder
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { BlogState, BlogPost } from "../types";
import { blogApi } from "../api";

const initialState: BlogState = {
  blogs: [],
  news: [],
  loading: false,
  error: null,
};

export const fetchBlogs = createAsyncThunk(
  "blog/fetchBlogs",
  async (_, { rejectWithValue }) => {
    try {
      const blogs = await blogApi.fetchBlogs();
      // Filter for blog category
      return blogs.filter((blog: BlogPost) => blog.category === 'blog');
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch blogs"
      );
    }
  }
);

export const fetchNews = createAsyncThunk(
  "blog/fetchNews",
  async (_, { rejectWithValue }) => {
    try {
      const news = await blogApi.fetchNews();
      return news;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch news"
      );
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
        state.error = null;
      })
      .addCase(
        fetchBlogs.fulfilled,
        (state, action: PayloadAction<BlogPost[]>) => {
          state.loading = false;
          state.blogs = action.payload;
        }
      )
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch News
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchNews.fulfilled,
        (state, action: PayloadAction<BlogPost[]>) => {
          state.loading = false;
          state.news = action.payload;
        }
      )
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = blogSlice.actions;
export default blogSlice.reducer;
