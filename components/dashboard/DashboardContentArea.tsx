"use client";

import DashboardPageLoader from "@/components/dashboard/DashboardPageLoader";
import { useDashboardNavigation } from "@/context/DashboardNavigationContext";

export default function DashboardContentArea({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isNavigating } = useDashboardNavigation();

  return (
    <div className="dashboard-page-wrapper mt-[70px] sm:mt-[82px] md:mt-20 w-full max-w-full overflow-x-hidden box-border relative min-h-[calc(100vh-10rem)]">
      {isNavigating ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 dark:bg-black/35 backdrop-blur-[1px]">
          <DashboardPageLoader className="min-h-0" />
        </div>
      ) : null}
      <div className={isNavigating ? "pointer-events-none" : undefined}>
        {children}
      </div>
    </div>
  );
}
