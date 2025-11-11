import React from "react";
import { SwapStep } from "./types";

interface StepIndicatorProps {
  currentStep: SwapStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="mb-4 sm:mb-6 px-3 sm:px-4">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto">
        <div
          className={`flex items-center flex-shrink-0 ${
            currentStep === "transaction-info"
              ? "text-[#1D8751]"
              : "text-[#8C8CA1]"
          }`}
        >
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
              currentStep === "transaction-info"
                ? "bg-[#1D8751] text-white"
                : "bg-[#35353E] text-[#8C8CA1]"
            }`}
          >
            1
          </div>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap">Transaction Info</span>
        </div>
        <div
          className={`w-4 sm:w-8 h-1 flex-shrink-0 ${
            currentStep === "copy-address" || currentStep === "status"
              ? "bg-[#1D8751]"
              : "bg-[#35353E]"
          }`}
        ></div>
        <div
          className={`flex items-center flex-shrink-0 ${
            currentStep === "copy-address" ? "text-[#1D8751]" : "text-[#8C8CA1]"
          }`}
        >
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
              currentStep === "copy-address"
                ? "bg-[#1D8751] text-white"
                : "bg-[#35353E] text-[#8C8CA1]"
            }`}
          >
            2
          </div>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap">Copy Address</span>
        </div>
        <div
          className={`w-4 sm:w-8 h-1 flex-shrink-0 ${
            currentStep === "status" ? "bg-[#1D8751]" : "bg-[#35353E]"
          }`}
        ></div>
        <div
          className={`flex items-center flex-shrink-0 ${
            currentStep === "status" ? "text-[#1D8751]" : "text-[#8C8CA1]"
          }`}
        >
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
              currentStep === "status"
                ? "bg-[#1D8751] text-white"
                : "dark:bg-[#35353E] bg-gray-300 dark:text-[#8C8CA1] text-gray-600"
            }`}
          >
            3
          </div>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap">Status</span>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
