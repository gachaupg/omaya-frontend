import React from "react";

export default function XChangeLogo({ size = 100 }) {
  const textSize = size * 0.45; // text scales with X

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.1,
        backgroundColor: "#000", // black background (optional)
        padding: size * 0.1,
        borderRadius: 8,
      }}
    >
      {/* Stylized X */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left green stroke */}
        <path
          d="M15 0 L40 0 L60 45 L45 70 Z"
          fill="#07A65A"
        />
        {/* Right white stroke */}
        <path
          d="M85 100 L60 100 L40 55 L55 30 Z"
          fill="#ffffff"
        />
      </svg>

      {/* CHANGE text */}
      <span
        style={{
          color: "#ffffff",
          fontSize: textSize,
          fontWeight: "800",
          letterSpacing: "2px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        CHANGE
      </span>
    </div>
  );
}
