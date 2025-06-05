import React from "react";

type OverviewTotalProps = {
  total: number;
  deposits: number;
  withdrawals: number;
  inProgress: number;
  exchange: number;
};

const colors = [
  "#13B562", // Deposits - Green
  "#E23D3A", // Withdrawals - Red
  "#FFD600", // In Progress - Yellow
  "#4A9EFF", 
];

const OverviewTotal: React.FC<OverviewTotalProps> = ({ 
  total, 
  deposits, 
  withdrawals, 
  inProgress, 
  exchange 
}) => {
  const data = [deposits, withdrawals, inProgress, exchange];
  const sum = data.reduce((a, b) => a + b, 0);
  const radius = 45;
  const strokeWidth = 10;
  const gapAngle = 16; 
  
  // Filter out zero values and calculate segments
  const segments = data.map((value, idx) => ({ value, idx })).filter(item => item.value > 0);
  const totalGaps = segments.length > 1 ? segments.length : 0;
  const totalGapSpace = totalGaps * gapAngle;
  const availableAngle = 360 - totalGapSpace;
  
  // Pre-calculate all segment positions
  let cumulativeAngle = 0;
  const segmentData = segments.map((segment, segmentIdx) => {
    const percentage = segment.value / sum;
    const segmentAngle = (percentage * availableAngle);
    const startAngle = cumulativeAngle;
    const endAngle = startAngle + segmentAngle;
    
    const result = {
      ...segment,
      startAngle,
      endAngle,
      segmentAngle
    };
    
    cumulativeAngle = endAngle + gapAngle;
    return result;
  });

  return (
    <div>
      <h3 className="text-white font-semibold text-lg mb-6">Overview Total</h3>
      
      <div className="rounded-2xl bg-[#1D1D23] border border-[#35353E] p-6">
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 120 120" className="transform -rotate-90">
            {segmentData.map((segment) => {
              const startAngleRad = (segment.startAngle * Math.PI) / 180;
              const endAngleRad = (segment.endAngle * Math.PI) / 180;
              
              const x1 = 60 + radius * Math.cos(startAngleRad);
              const y1 = 60 + radius * Math.sin(startAngleRad);
              const x2 = 60 + radius * Math.cos(endAngleRad);
              const y2 = 60 + radius * Math.sin(endAngleRad);
              
              const largeArcFlag = segment.segmentAngle > 180 ? 1 : 0;
              
              return (
                <path
                  key={segment.idx}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={colors[segment.idx]}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-bold text-white">{total.toLocaleString()} USD</div>
            <div className="text-sm text-gray-400">Transactions</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#13B562]"></div>
            <span className="text-gray-400 text-sm">Deposits</span>
          </div>
          <span className="text-white">{deposits.toLocaleString()} USD</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#E23D3A]"></div>
            <span className="text-gray-400 text-sm">Withdrawals</span>
          </div>
          <span className="text-white">{withdrawals.toLocaleString()} USD</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#FFD600]"></div>
            <span className="text-gray-400 text-sm">In Progress</span>
          </div>
          <span className="text-white">{inProgress.toLocaleString()} USD</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#4A9EFF]"></div>
            <span className="text-gray-400 text-sm">Exchange</span>
          </div>
          <span className="text-white text-sm">{exchange.toLocaleString()} USD</span>
        </div>
      </div>

      </div>
    </div>
  );
};

export default OverviewTotal;