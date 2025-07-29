/**
 * useSwapRates.ts – auto‑generated placeholder
 */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/rootReducer";
import { fetchBlogs, fetchNews } from "../slices/blog";

export const useBlog = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { blogs, news, loading, error } = useSelector(
    (state: RootState) => state.blog
  );

  useEffect(() => {
    console.log('useBlog hook: Dispatching fetch actions...');
    dispatch(fetchBlogs()).catch(err => {
      console.error('Error dispatching fetchBlogs:', err);
    });
    dispatch(fetchNews()).catch(err => {
      console.error('Error dispatching fetchNews:', err);
    });
  }, [dispatch]);

  console.log('useBlog hook state:', { blogs: blogs.length, news: news.length, loading, error });

  return {
    blogs,
    news,
    loading,
    error,
  };
};
