import React from "react";
import Adds from "@/features/p2p/components/ui/p2pdashboard/sections/Adds";

export default function AddsPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const type = searchParams?.type === "sell" ? "sell" : "buy";
  return (
    <div className="lg:mr-[200px]">
      <Adds />
    </div>
  );
}
