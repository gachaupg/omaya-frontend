/**
 * VolumeChart.tsx – auto‑generated placeholder
 */

import { volumeData } from "@/utils/data";
import Card from "../ui/Card";
import React from "react";


const VolumeChart = () => {
  return (
    <div className="w-full">
      <h2 className="text-white text-[16px] mb-4">My Volume</h2>
      <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-4">
        {volumeData.map((item, idx) => (
          <Card
            key={idx}
            className="flex flex-col items-center justify-center w-full sm:w-[225px] h-[175px] border-2 border-[#35353E] bg-[#1D1D23] rounded-[24px]"
          >
            <span className="text-[#ffff] text-[16px] sm:text-[19px] mb-2 text-center">
              {item.title}
            </span>
            <span className="text-[#F79330] text-[20px] sm:text-[26px] font-semibold text-center">
              {item.value}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VolumeChart;
