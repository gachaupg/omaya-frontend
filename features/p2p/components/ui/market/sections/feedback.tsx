import React, { useState } from "react";
import { tokens } from "@/styles/tokens";
import Button from "@/features/p2p/components/Common/Button";

const Feedback = () => {
  const [rating, setRating] = useState<"positive" | "negative" | null>(
    "positive"
  );
  const [comment, setComment] = useState("");

  return (
    <div className="bg-white dark:bg-[var(--card-color)] rounded-[24px] p-8 w-full max-w-md mx-auto shadow-lg border border-gray-200 dark:border-[#35353E]">
      <div className="text-gray-600 dark:text-[#A3A3C2] text-lg text-center mb-6">
        Rate your experience with the Merchant
      </div>
      <div className="flex justify-center gap-3 mb-7">
        <button
          type="button"
          onClick={() => setRating("positive")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-base transition-all ${
            rating === "positive"
              ? "bg-[#1D8751] text-white shadow-lg outline-2 outline-[#1D8751]"
              : "bg-[#35353E] text-gray-600 dark:text-[#A3A3C2]"
          }`}
        >
          Positive
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 10v8a2 2 0 0 0 2 2h7.5a2 2 0 0 0 2-2v-5.5a2 2 0 0 0-2-2H14V7.5A2.5 2.5 0 0 0 11.5 5c-.6 0-1.1.2-1.5.5L7 10Z"
              stroke={rating === "positive" ? "#fff" : "#1D8751"}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M7 10H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2"
              stroke={rating === "positive" ? "#fff" : "#1D8751"}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setRating("negative")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-base transition-all ${
            rating === "negative"
              ? "bg-[#35353E] text-[#E23D3A] shadow-lg outline-2 outline-[#E23D3A] opacity-100"
              : "bg-[#35353E] text-gray-600 dark:text-[#A3A3C2] opacity-70"
          }`}
        >
          Negative
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              d="M17 14V6a2 2 0 0 0-2-2H7.5a2 2 0 0 0-2 2v5.5a2 2 0 0 0 2 2H10v5.5A2.5 2.5 0 0 0 12.5 21c.6 0 1.1-.2 1.5-.5L17 14Z"
              stroke="#E23D3A"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M17 14h2a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-2"
              stroke="#E23D3A"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="text-gray-600 dark:text-[#A3A3C2] text-base mb-2">
        Leave the comment (optional)
      </div>
      <textarea
        placeholder="Placeholder for the comments"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full min-h-[120px] bg-transparent border-2 border-gray-200 dark:border-[#35353E] rounded-2xl text-gray-900 dark:text-white text-base p-4 mb-8 resize-none outline-none focus:ring-2 focus:ring-[#1D8751]"
      />
      <div className="flex gap-4.5 mt-2">
        <Button
          variant="outline"
          className="flex-1 min-h-12 border-[#1D8751] text-[#1D8751]"
        >
          Close
        </Button>
        <Button
          variant="primary"
          className="flex-1 min-h-12 bg-[#1D8751]"
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
