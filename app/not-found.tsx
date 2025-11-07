"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          This page could not be found.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-block bg-[#1D8751] text-white px-6 py-3 rounded-lg hover:bg-[#167a47] transition-colors w-full sm:w-auto"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-block bg-gray-200 dark:bg-[#35353E] text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-[#404040] transition-colors w-full sm:w-auto"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


