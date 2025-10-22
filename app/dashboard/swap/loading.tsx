import { Spinner } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading Swap
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Preparing crypto swap interface...
          </p>
        </div>
      </div>
    </div>
  );
}
