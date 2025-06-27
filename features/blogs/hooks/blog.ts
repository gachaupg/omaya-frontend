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
    dispatch(fetchBlogs());
    dispatch(fetchNews());
  }, [dispatch]);

  return {
    blogs,
    news,
    loading,
    error,
  };
};
