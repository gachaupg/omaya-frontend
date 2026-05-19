import Loader from "@/features/p2p/components/Common/Loader";

type DashboardPageLoaderProps = {
  /** Shown under the spinner; omit for a minimal loader. */
  message?: string;
  className?: string;
};

/**
 * Shared full-area loader for dashboard route transitions and segment loading.tsx files.
 */
export default function DashboardPageLoader({
  message,
  className = "",
}: DashboardPageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`w-full flex items-center justify-center min-h-[calc(100vh-12rem)] ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader size="lg" color="#1D8751" />
        {message ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
