import React from "react";

export default function MatchedOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mt-10 mx-auto px-2 py-2">
      <div className="max-w-6xl mx-auto">
        <div className=" ">{children}</div>
      </div>
    </div>
  );
}
