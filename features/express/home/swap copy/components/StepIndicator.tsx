import React from "react";
import { SwapStep } from "./types";

interface StepIndicatorProps {
  currentStep: SwapStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-center space-x-4">
        <div
          className={`flex items-center ${
            currentStep === "transaction-info"
              ? "text-[#1D8751]"
              : "text-[#8C8CA1]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === "transaction-info"
                ? "bg-[#1D8751] text-white"
                : "bg-[#35353E] text-[#8C8CA1]"
            }`}
          >
            1
          </div>
          <span className="ml-2 text-sm">Transaction Info</span>
        </div>
        <div
          className={`w-8 h-1 ${
            currentStep === "copy-address" || currentStep === "status"
              ? "bg-[#1D8751]"
              : "bg-[#35353E]"
          }`}
        ></div>
        <div
          className={`flex items-center ${
            currentStep === "copy-address" ? "text-[#1D8751]" : "text-[#8C8CA1]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === "copy-address"
                ? "bg-[#1D8751] text-white"
                : "bg-[#35353E] text-[#8C8CA1]"
            }`}
          >
            2
          </div>
          <span className="ml-2 text-sm">Copy Address</span>
        </div>
        <div
          className={`w-8 h-1 ${
            currentStep === "status" ? "bg-[#1D8751]" : "bg-[#35353E]"
          }`}
        ></div>
        <div
          className={`flex items-center ${
            currentStep === "status" ? "text-[#1D8751]" : "text-[#8C8CA1]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === "status"
                ? "bg-[#1D8751] text-white"
                : "dark:bg-[#35353E] bg-gray-300 dark:text-[#8C8CA1] text-gray-600"
            }`}
          >
            3
          </div>
          <span className="ml-2 text-sm">Status</span>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
