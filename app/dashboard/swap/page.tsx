import SwapWidget from "@/features/swap/components/SwapWidget";
import { SwapDataProvider } from "@/features/swap/components/SwapDataProvider";

export default function SwapPage() {
  return (
    <SwapDataProvider>
      <div className="w-[calc(100%+4rem)] -ml-8 -mr-8 sm:w-[calc(100%+2rem)] sm:-ml-4 sm:-mr-4 md:ml-0 md:mr-0 md:w-full flex justify-center px-1 sm:px-2 md:px-4">
        <div className="w-full mr-0 lg:mr-20 mt-0 sm:mt-1 md:mt-2">
          <SwapWidget />
        </div>
      </div>
    </SwapDataProvider>
  );
}
