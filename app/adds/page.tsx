// app/adds/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Adds from "@/features/p2p/components/ui/p2pdashboard/sections/Adds";
import Sidebar from "@/components/layout/Sidebar";

export default function AddsPage() {
  // default to "buy"
  const [filterType, setFilterType] = useState<"buy" | "sell">("buy");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    setFilterType(t === "sell" ? "sell" : "buy");
  }, []);

  return (
    <div className="min-h-screen mt-28 flex flex-col md:flex-row gap-1 px-4 md:px-0 bg-app">
      {/* Sidebar */}
      {/* <div className="w-full md:fixed md:top-28"> */}
        <Sidebar />
      {/* </div> */}

      {/* Main Adds section */}
      <div className="flex-1 w-full md:mr-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[200px]">
              Loading...
            </div>
          }
        >
          <Adds filterType={filterType} />
        </Suspense>
      </div>
    </div>
  );
}
