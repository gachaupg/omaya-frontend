import SwapWidget from "@/features/swap/components/SwapWidget";
import { SwapDataProvider } from "@/features/swap/components/SwapDataProvider";

export default function SwapPage() {
  return (
    <SwapDataProvider>
      <div className="w-full flex justify-center px-4">
        <div className="w-full mr-20">
          <SwapWidget />
        </div>
      </div>
    </SwapDataProvider>
  );
}
