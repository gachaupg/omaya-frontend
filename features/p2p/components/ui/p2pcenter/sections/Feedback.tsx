import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeedback } from "@/features/p2p/slices/feedbackSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { tokens } from "@/styles/tokens";
import Card from "@/features/p2p/components/Common/Card";
import FeedbackTable from "@/features/p2p/components/Common/FeedbackTable";

const BANK_ICON_URL =
  "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg";

const Feedback = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.feedback
  );
  const feedbackData = data ?? [];

  useEffect(() => {
    dispatch(fetchFeedback());
  }, [dispatch]);

  return (
    <Card
      borderColor={`border-[${tokens.colors.dark.border}]`}
      width="w-full"
      bgColor={`bg-[${tokens.colors.dark.card}]`}
      borderRadius="rounded-[16px]"
      className=" min-h-[600px]"
    >
    
      {error && (
        <div className="text-red-500 mb-2">
          {error.message || "Failed to load feedback."}
        </div>
      )}
      <FeedbackTable
        data={feedbackData}
        loading={loading}
      />
    </Card>
  );
};

export default Feedback;
