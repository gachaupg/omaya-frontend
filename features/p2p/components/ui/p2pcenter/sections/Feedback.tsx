import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeedback } from "@/features/p2p/slices/feedbackSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import Card from "@/features/p2p/components/Common/Card";
import FeedbackTable from "@/features/p2p/components/Common/FeedbackTable";

const Feedback = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.feedback
  );
  const feedbackData = Array.isArray(data) ? data : (data?.feedbacks ?? []);

  useEffect(() => {
    dispatch(fetchFeedback());
  }, [dispatch]);

  return (
    <Card
      borderColor="border-gray-200 dark:border-[#35353E]"
      width="w-full"
      bgColor="bg-white dark:bg-[var(--card-color)]"
      borderRadius="rounded-[16px]"
      className="min-h-[600px] text-gray-900 dark:text-white"
    >
      {error && (
        <div className="text-red-500 mb-2">
          {error.message || "Failed to load feedback."}
        </div>
      )}
      <FeedbackTable data={feedbackData} loading={loading} />
    </Card>
  );
};

export default Feedback;
