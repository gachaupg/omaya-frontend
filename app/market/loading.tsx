import { Spinner } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="w-full min-h-[40vh] flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Loading Market…
        </span>
      </div>
    </div>
  );
}
