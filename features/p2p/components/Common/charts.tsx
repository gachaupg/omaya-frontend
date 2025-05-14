import React from "react";
import { tokens } from "@/styles/tokens";
import Button from "./Button";

type ChartProps = {
  title?: string;
  timeFrame?: string;
  data?: any[];
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const Charts: React.FC<ChartProps> = ({
  title = "P2P Overview (USD)",
  timeFrame = "Month",
  data,
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h3 className={`text-[${tokens.colors.dark.textTitle}] font-medium`}>
            {title}
          </h3>

          <div className="flex gap-2">
            <Button
             borderRadius={24}  
              height={36}
              variant="outline"
              size="sm"
              className={`border text-[#1D8751] border-[#1D8751] text-[${tokens.colors.dark.textBody}]`}
            >
              All
            </Button>
            <Button
              borderRadius={24}
              variant="primary"
              size="sm"
              className={`border text-[#1D8751] border-[#1D8751] text-[${tokens.colors.dark.textBody}]`}
            >
              Sells
            </Button>
            <Button
              borderRadius={24}
              height={36}
              variant="outline"
              size="sm"
              className={`border text-[#1D8751] border-[#1D8751] text-[${tokens.colors.dark.textBody}]`}
            >
              Buys
            </Button>
          </div>
        </div>

        <div>
          <button
            className={`flex items-center gap-1 px-4 py-1.5 text-[${tokens.colors.dark.textBody}] text-sm`}
          >
            {timeFrame}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-[${tokens.colors.dark.textBody}]`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`w-full rounded-2xl  bg-[${tokens.colors.dark.card}] border-2 border-[${tokens.colors.dark.border}]`}
      >
        {/* Chart Container */}
        <div className="relative h-[320px] p-6">
          {/* Y-axis labels */}
          <div
            className={`absolute left-6 top-6 bottom-8 flex flex-col justify-between text-sm text-[${tokens.colors.dark.textBody}]`}
          >
            <div>10,000</div>
            <div>5,000</div>
            <div>2,500</div>
            <div>1,000</div>
          </div>

          {/* Chart Area */}
          <div className="ml-20 h-full pb-8 relative">
            {/* Horizontal grid lines */}
            <div className="absolute w-full h-[calc(100%-32px)] flex flex-col justify-between">
              <div
                className={`border-b border-dashed border-[${tokens.colors.dark.border}]`}
              ></div>
              <div
                className={`border-b border-dashed border-[${tokens.colors.dark.border}]`}
              ></div>
              <div
                className={`border-b border-dashed border-[${tokens.colors.dark.border}]`}
              ></div>
              <div
                className={`border-b border-dashed border-[${tokens.colors.dark.border}]`}
              ></div>
            </div>

            {/* Chart SVG */}
            <div className="absolute w-full h-[calc(100%-32px)]">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 1200 300"
                preserveAspectRatio="none"
                className={`text-[${tokens.colors.brand.primary}]`}
              >
                {/* Gradient fill */}
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={tokens.colors.brand.primary}
                      stopOpacity="0.4"
                    />
                    <stop
                      offset="100%"
                      stopColor={tokens.colors.brand.primary}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                  d="M0,50 C100,120 200,180 300,100 C400,20 500,120 600,150 C700,180 800,70 900,200 C1000,150 1100,100 1200,20 L1200,300 L0,300 Z"
                  fill="url(#chartGradient)"
                />

                {/* Line */}
                <path
                  d="M0,50 C100,120 200,180 300,100 C400,20 500,120 600,150 C700,180 800,70 900,200 C1000,150 1100,100 1200,20"
                  fill="none"
                  stroke={tokens.colors.brand.primary}
                  strokeWidth="3"
                />
              </svg>
            </div>
          </div>

          {/* X-axis labels */}
          <div
            className={`absolute left-20 right-6 bottom-0 flex justify-between text-sm text-[${tokens.colors.dark.textBody}]`}
          >
            {months.map((month, index) => (
              <div key={index}>{month}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
