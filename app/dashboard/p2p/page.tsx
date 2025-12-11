import { Suspense } from "react";
import P2PLayout from "@/features/p2p/components/P2PLayout";

export default function P2PPage() {
  return (
    <div className="w-[calc(100%+4rem)] -ml-8 -mr-8 sm:w-[calc(100%+2rem)] sm:-ml-4 sm:-mr-4 md:ml-0 md:mr-0 md:w-full">
      <Suspense fallback={<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D8751]" />
      </div>}>
        <P2PLayout />
      </Suspense>
    </div>
  );
}
