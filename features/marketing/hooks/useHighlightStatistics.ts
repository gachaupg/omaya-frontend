import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchHighlightStatistics } from "../slices/statisticsSlice";

/**
 * Custom hook to fetch and manage highlight statistics
 */
export const useHighlightStatistics = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { statistics, loading, error } = useSelector(
    (state: RootState) => state.statistics
  );

  useEffect(() => {
    // Fetch statistics if not already loaded
    if (!statistics && !loading) {
      dispatch(fetchHighlightStatistics());
    }
  }, [dispatch, statistics, loading]);

  return {
    statistics,
    loading,
    error,
    refetch: () => dispatch(fetchHighlightStatistics()),
  };
};


