import SwapWidget from "@/features/swap/components/SwapWidget";
import { SwapDataProvider } from "@/features/swap/components/SwapDataProvider";

export default function SwapPage() {
  return (
    <SwapDataProvider>
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
        <SwapWidget />
      </div>
    </SwapDataProvider>
  );
}
