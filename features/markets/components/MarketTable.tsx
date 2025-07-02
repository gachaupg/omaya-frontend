/**
 * MarketTable.tsx – auto‑generated placeholder
 */
import React from "react";
import { tokens } from "../../../styles/tokens";

// Inline SVGs for coins
const BTCIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <text
      x="16"
      y="21"
      textAnchor="middle"
      fontSize="16"
      fill="#fff"
      fontWeight="bold"
    >
      ₿
    </text>
  </svg>
);
const ETHIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <polygon points="16,7 24,16 16,29 8,16" fill="#fff" />
  </svg>
);
const TRXIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#EC0928" />
    <polygon points="10,10 24,10 16,24" fill="#fff" />
  </svg>
);

// Inline SVGs for actions
const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M3 17V9M9 17V5M15 17V13M21 19H1"
      stroke="#1D8751"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const StarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M11 3l2.09 6.26H19l-5.18 3.76L15.91 19 11 14.77 6.09 19l1.09-5.98L2 9.26h5.91z"
      stroke="#788099"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

const tableHeaders = [
  "Name",
  "Price",
  "24h Change",
  "24 Volume",
  "Market Cap",
  "More",
];

const sampleRows = [
  {
    icon: <BTCIcon />,
    name: "BTC",
    fullName: "Bitcoin",
    price: "$29,799.28",
    change: "+2.11%",
    volume: "$12.94B",
    cap: "$570.43B",
  },
  {
    icon: <ETHIcon />,
    name: "ETH",
    fullName: "Ethereum",
    price: "$29,799.28",
    change: "+2.11%",
    volume: "$12.94B",
    cap: "$570.43B",
  },
  {
    icon: <TRXIcon />,
    name: "TRX",
    fullName: "Tron",
    price: "$29,799.28",
    change: "+2.11%",
    volume: "$12.94B",
    cap: "$570.43B",
  },
  // Add more sample rows as needed
];

const favouriteAssets = [
  {
    icon: <BTCIcon />,
    name: "BTC",
    fullName: "Bitcoin",
    price: "32,349.00 USD",
    change: "+4.66%",
  },
  {
    icon: <ETHIcon />,
    name: "ETH",
    fullName: "Ethereum",
    price: "32,349.00 USD",
    change: "+4.66%",
  },
  {
    icon: <TRXIcon />,
    name: "TRX",
    fullName: "Tron",
    price: "32,349.00 USD",
    change: "+4.66%",
  },
];

const filterTags = ["Hot", "Gainers", "Losers", "New", "Market Cap"];

const MarketTable = () => {
  return (
    <div className="bg-[#18181D] min-h-screen py-8 text-[#788099] font-sans">
      {/* Top Section */}
      <div className="max-w-[1000px] mx-auto mb-6 px-6">
        <h1 className="text-[#fff] text-2xl font-bold mb-2">Market Review</h1>
        <div className="flex gap-2 mb-4">
          {filterTags.map((tag) => (
            <span
              key={tag}
              className="bg-[#1D1D23] text-[#788099] rounded-2xl px-4 py-1 text-sm font-medium border border-[#35353E] cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="text-sm text-[#788099] mb-2">
          Gain a comprehensive overview of all cryptocurrencies through OMAYA
          Express. This webpage presents the most recent prices, 24-hour trade
          volumes, price fluctuations, and market capitalizations for every
          cryptocurrency available on global marker.
        </div>
        <div className="text-sm text-[#788099] mb-6">
          Users can readily obtain crucial details about these digital assets
          and directly navigate to the trading platform from this point.
        </div>
        {/* Favourite Assets Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-semibold text-[#fff] text-lg">
            Favourite Assets
            <button className="bg-none border-none text-[#788099] text-xl cursor-pointer p-0 ml-2">
              &lt;
            </button>
            <button className="bg-none border-none text-[#788099] text-xl cursor-pointer p-0 ml-1">
              &gt;
            </button>
          </div>
          <div className="flex items-center text-[#fff] font-medium text-base cursor-pointer gap-1">
            Add Asset{" "}
            <span className="text-lg font-bold ml-1 flex items-center">+</span>
          </div>
        </div>
        {/* Favourite Assets Cards Row */}
        <div className="flex gap-4 mb-8">
          {favouriteAssets.map((asset) => (
            <div
              key={asset.name}
              className="bg-[#1D1D23] rounded-xl px-4 py-2 min-w-[160px] min-h-[56px] flex flex-col items-start shadow-sm border border-[#35353E] gap-0.5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 flex items-center">{asset.icon}</span>
                <span className="font-semibold text-[#fff] text-base">
                  {asset.name}
                </span>
              </div>
              <div className="text-xs text-[#788099] mb-0.5">
                {asset.fullName}
              </div>
              <div className="font-semibold text-[#fff] text-sm">
                {asset.price}
              </div>
              <div className="text-[#13B562] text-xs font-medium">
                {asset.change}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Table Section */}
      <div className="bg-[#18181D] rounded-2xl p-6 text-[#788099] font-sans shadow-lg max-w-[1000px] mx-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  className="text-[#fff] bg-[#1D1D23] px-2 py-4 text-left font-semibold border-b-2 border-[#35353E] text-base"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, idx) => (
              <tr
                key={row.name}
                className={
                  idx % 2 === 0
                    ? "bg-[#1D1D23] border-b border-[#35353E]"
                    : "bg-[#18181D] border-b border-[#35353E]"
                }
              >
                <td className="flex items-center gap-3 px-2 py-3 text-[#fff]">
                  <span className="w-7 h-7 flex items-center">{row.icon}</span>
                  <div>
                    <div className="font-semibold">{row.name}</div>
                    <div className="text-xs text-[#788099]">{row.fullName}</div>
                  </div>
                </td>
                <td className="text-[#1D8751] font-medium px-2 py-3">
                  {row.price}
                </td>
                <td className="text-[#13B562] font-medium px-2 py-3">
                  {row.change}
                </td>
                <td className="px-2 py-3">{row.volume}</td>
                <td className="px-2 py-3">{row.cap}</td>
                <td className="px-2 py-3 flex items-center gap-3">
                  <span className="cursor-pointer">
                    <ChartIcon />
                  </span>
                  <span className="cursor-pointer">
                    <StarIcon />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketTable;
