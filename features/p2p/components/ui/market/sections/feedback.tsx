import React, { useState } from "react";
import { tokens } from "@/styles/tokens";
import Button from "@/features/p2p/components/Common/Button";

const Feedback = () => {
  const [rating, setRating] = useState<"positive" | "negative" | null>(
    "positive"
  );
  const [comment, setComment] = useState("");

  return (
    <div
      style={{
        background: tokens.colors.dark.card,
        borderRadius: 24,
        padding: 32,
        width: 400,
        margin: "0 auto",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          color: tokens.colors.dark.textBody,
          fontSize: 18,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Rate your experience with the Merchant
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <button
          type="button"
          onClick={() => setRating("positive")}
          style={{
            background:
              rating === "positive" ? tokens.colors.brand.primary : "#35353E",
            color: rating === "positive" ? "#fff" : tokens.colors.dark.textBody,
            border: "none",
            borderRadius: 14,
            padding: "8px 24px",
            fontWeight: 600,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            outline:
              rating === "positive"
                ? `2px solid ${tokens.colors.brand.primary}`
                : "none",
            boxShadow: rating === "positive" ? "0 2px 8px #1d875133" : "none",
            transition: "all 0.2s",
          }}
        >
          Positive
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 10v8a2 2 0 0 0 2 2h7.5a2 2 0 0 0 2-2v-5.5a2 2 0 0 0-2-2H14V7.5A2.5 2.5 0 0 0 11.5 5c-.6 0-1.1.2-1.5.5L7 10Z"
              stroke={
                rating === "positive" ? "#fff" : tokens.colors.brand.primary
              }
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M7 10H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2"
              stroke={
                rating === "positive" ? "#fff" : tokens.colors.brand.primary
              }
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setRating("negative")}
          style={{
            background: rating === "negative" ? "#35353E" : "#35353E",
            color:
              rating === "negative"
                ? tokens.colors.brand.secondary
                : tokens.colors.dark.textBody,
            border: "none",
            borderRadius: 14,
            padding: "8px 24px",
            fontWeight: 600,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            outline:
              rating === "negative"
                ? `2px solid ${tokens.colors.brand.secondary}`
                : "none",
            boxShadow: rating === "negative" ? "0 2px 8px #e23d3a33" : "none",
            opacity: rating === "negative" ? 1 : 0.7,
            transition: "all 0.2s",
          }}
        >
          Negative
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              d="M17 14V6a2 2 0 0 0-2-2H7.5a2 2 0 0 0-2 2v5.5a2 2 0 0 0 2 2H10v5.5A2.5 2.5 0 0 0 12.5 21c.6 0 1.1-.2 1.5-.5L17 14Z"
              stroke={
                rating === "negative"
                  ? tokens.colors.brand.secondary
                  : tokens.colors.brand.secondary
              }
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M17 14h2a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-2"
              stroke={
                rating === "negative"
                  ? tokens.colors.brand.secondary
                  : tokens.colors.brand.secondary
              }
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div
        style={{
          color: tokens.colors.dark.textBody,
          fontSize: 16,
          marginBottom: 8,
        }}
      >
        Leave the comment (optional)
      </div>
      <textarea
        placeholder="Placeholder for the comments"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{
          width: "100%",
          minHeight: 120,
          background: "transparent",
          border: `1.5px solid ${tokens.colors.dark.border}`,
          borderRadius: 16,
          color: tokens.colors.dark.textTitle,
          fontSize: 16,
          padding: 16,
          marginBottom: 32,
          resize: "none",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
        <Button
          variant="outline"
          style={{
            flex: 1,
            borderColor: tokens.colors.brand.primary,
            color: tokens.colors.brand.primary,
            minHeight: 48,
          }}
        >
          Close
        </Button>
        <Button
          variant="primary"
          style={{
            flex: 1,
            background: tokens.colors.brand.primary,
            minHeight: 48,
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
