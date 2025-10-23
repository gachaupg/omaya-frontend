/**
 * Dashboard Loading State
 *
 * Next.js App Router automatically shows this component during page transitions
 * within the /dashboard route. This prevents the "frozen" look during navigation.
 *
 * Pattern: app/dashboard/loading.tsx is shown while any dashboard/* page loads
 */

import { Spinner } from "@/components/ui/Skeletons";

export default function DashboardLoading() {
  return (
    <div className="w-full h-[calc(100vh-12rem)] flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Loading...
        </span>
      </div>
    </div>
  );
}
