"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function OfflinePage() {
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") || "/";

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-4">No Internet</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          You are offline. Check your connection and try again.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={from}
            className="inline-block bg-[#1D8751] text-white px-6 py-3 rounded-lg hover:bg-[#167a47] transition-colors w-full sm:w-auto"
          >
            Retry
          </Link>
          <Link
            href="/"
            className="inline-block bg-gray-200 dark:bg-[#35353E] text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-[#404040] transition-colors w-full sm:w-auto"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

