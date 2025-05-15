// app/adds/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Adds from "@/features/p2p/components/ui/p2pdashboard/sections/Adds";

export default function AddsPage() {
  // default to "buy"
  const [filterType, setFilterType] = useState<"buy" | "sell">("buy");

  useEffect(() => {
    // parse the `?type=` on the client
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    setFilterType(t === "sell" ? "sell" : "buy");
  }, []);

  return (
    <div className="lg:mr-[200px]">
      <Adds filterType={filterType} />
    </div>
  );
}
