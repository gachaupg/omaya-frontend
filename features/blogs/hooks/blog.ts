/**
 * useSwapRates.ts – auto‑generated placeholder
 */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/rootReducer";
import { fetchBlogs, fetchNews } from "../slices/blog";

export const useBlog = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    blogs, 
    news, 
    loading, 
    error, 
    blogsFetched, 
    newsFetched, 
    blogsLoading, 
    newsLoading 
  } = useSelector((state: RootState) => state.blog);

  useEffect(() => {
    // Only fetch if we haven't fetched data yet and we're not currently loading
    const shouldFetchBlogs = !blogsFetched && !blogsLoading;
    const shouldFetchNews = !newsFetched && !newsLoading;

    if (shouldFetchBlogs || shouldFetchNews) {
      console.log("useBlog: Fetching data", { shouldFetchBlogs, shouldFetchNews });
      
      if (shouldFetchBlogs) {
        dispatch(fetchBlogs()).catch(err => {
          console.error("Failed to fetch blogs:", err);
        });
      }
      
      if (shouldFetchNews) {
        dispatch(fetchNews()).catch(err => {
          console.error("Failed to fetch news:", err);
        });
      }
    }
  }, [dispatch, blogsFetched, newsFetched, blogsLoading, newsLoading]);

  return {
    blogs,
    news,
    loading: loading || blogsLoading || newsLoading,
    error,
  };
};
