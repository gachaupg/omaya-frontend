"use client";
import React, { useEffect, useState, ReactElement } from "react";
import { FaBitcoin, FaEthereum } from "react-icons/fa";
import { SiTether, SiSolana, SiXrp } from "react-icons/si";

interface CryptoData {
  name: string;
  icon: ReactElement;
  price: string;
  color: string;
  chart: string;
  chartBg: string;
  chartBgTrans: string;
  rate: string;
}

const cryptoData: CryptoData[] = [
  {
    name: "Bitcoin",
    icon: <FaBitcoin className="text-3xl text-orange-400" />,
    price: "$20,305",
    color: "red",
    chart: "#ff3b3b",
    chartBg: "#F01717",
    chartBgTrans: "#F0171710",
    rate: "1.2%",
  },
  {
    name: "Usdt",
    icon: <SiTether className="text-3xl text-[#1D8751]" />,
    price: "$1.05",
    color: "green",
    chart: "#22c55e",
    chartBg: "#22c55e",
    chartBgTrans: "#22c55e10",
    rate: "1.5%",
  },
  {
    name: "Ethereum",
    icon: <FaEthereum className="text-3xl text-gray-400" />,
    price: "$1,950",
    color: "#1D8751",
    chart: "#1D8751",
    chartBg: "#1D8751",
    chartBgTrans: "#1D875110",
    rate: "1.5%",
  },
  {
    name: "XRP",
    icon: <SiXrp className="text-3xl text-gray-400" />,
    price: "$0.50",
    color: "yellow",
    chart: "#facc15",
    chartBg: "#facc15",
    chartBgTrans: "#facc1510",
    rate: "1.5%",
  },
  {
    name: "Solona",
    icon: <SiSolana className="text-3xl text-purple-700" />,
    price: "$0.25",
    color: "yellow",
    chart: "#facc15",
    chartBg: "#facc15",
    chartBgTrans: "#facc1510",
    rate: "1.5%",
  },
];

const MiniChart = ({
  color,
  bg,
  bgTrans,
}: {
  color: string;
  bg: string;
  bgTrans: string;
}) => (
  <svg
    width="100%"
    height="40"
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0" y="0" width="120" height="40" rx="8" fill={bgTrans} />
    <path
      d="M0,35 Q20,10 40,25 T80,20 T120,35"
      stroke={color}
      strokeWidth="3"
      fill="none"
    />
    <polyline
      points="0,35 40,25 80,20 120,35"
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity="0.2"
    />
  </svg>
);

const CryptoCard = ({
  icon,
  name,
  price,
  chart,
  chartBg,
  chartBgTrans,
  rate,
}: any) => (
<div className="
  flex-1 min-w-[160px] max-w-[260px] sm:min-w-[180px] sm:max-w-[320px] h-[160px]
  text-[13px] rounded-2xl shadow-lg p-3 flex flex-col justify-between border border-gray-300 relative
">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="dark:text-white font-semibold text-sm sm:text-base">
          {name}
        </span>
      </div>
      <span className="bg-[#23262F] text-xs text-white px-1.5 py-0.5 rounded-lg">
        24h
      </span>
    </div>
    <div className="dark:text-white text-black flex flex-row gap-1.5 text-[13px] font-bold text-base sm:text-lg mb-1">
      <p>{price}</p>
      <div className="w-16 h-4 rounded-lg mb-1 flex flex-row gap-1.5 items-center justify-center bg-[#48CC544D]">
        <p className="text-xs text-[#48CC54]">{rate}</p>
      </div>
    </div>
    <div className="w-full h-8">
      <MiniChart color={chart} bg={chartBg} bgTrans={chartBgTrans} />
    </div>
  </div>
);

const PriceCards = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="dark:text-white text-[16px] mb-4">Market Overview</h2>
      <div className="flex flex-row gap-4 overflow-x-auto pb-4">
        {cryptoData.map((crypto) => (
          <CryptoCard key={crypto.name} {...crypto} />
        ))}
      </div>
    </div>
  );
};

export default PriceCards;
