import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeedback } from "@/features/p2p/slices/feedbackSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import FeedbackTable from "@/features/p2p/components/Common/FeedbackTable";

const P2P_CENTER_PANEL_CLASS =
  "w-full min-h-[600px] bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 text-gray-900 dark:text-white border border-gray-200 dark:border-[#35353E]";

const Feedback = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.feedback
  );
  const feedbackData = Array.isArray(data)
    ? data
    : ((data as { feedbacks?: any[] } | null | undefined)?.feedbacks ?? []);

  useEffect(() => {
    dispatch(fetchFeedback());
  }, [dispatch]);

  return (
    <div className={P2P_CENTER_PANEL_CLASS}>
      {error && (
        <div className="text-red-500 mb-2">
          {error.message || "Failed to load feedback."}
        </div>
      )}
      <FeedbackTable data={feedbackData} loading={loading} />
    </div>
  );
};

export default Feedback;
