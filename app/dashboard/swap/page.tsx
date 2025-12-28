import SwapWidget from "@/features/swap/components/SwapWidget";
import { SwapDataProvider } from "@/features/swap/components/SwapDataProvider";

export default function SwapPage() {
  return (
    <SwapDataProvider>
      <div className="w-full px-0 overflow-x-hidden">
        <SwapWidget />
      </div>
    </SwapDataProvider>
  );
}
