"use client";
import React, { useEffect, useState, ReactElement } from "react";
import { FaBitcoin, FaEthereum } from "react-icons/fa";
import { SiTether, SiSolana, SiXrp } from "react-icons/si";
import { fetchTopAssets } from "@/features/markets/api";
import { TopAsset } from "@/features/markets/types";

interface CryptoData {
  name: string;
  symbol: string;
  icon: ReactElement;
  image?: string;
  price: string;
  volume?: number;
  transactionCount?: number;
  color: string;
  chart: string;
  chartBg: string;
  chartBgTrans: string;
  rate: string;
}

// Helper function to get icon based on symbol
const getCryptoIcon = (symbol: string): ReactElement => {
  const upperSymbol = symbol.toUpperCase();
  switch (upperSymbol) {
    case "BTC":
    case "BITCOIN":
      return <FaBitcoin className="text-3xl text-orange-400" />;
    case "ETH":
    case "ETHEREUM":
      return <FaEthereum className="text-3xl text-gray-400" />;
    case "USDT":
    case "USDTERC20":
      return <SiTether className="text-3xl text-[#1D8751]" />;
    case "SOL":
    case "SOLANA":
      return <SiSolana className="text-3xl text-purple-700" />;
    case "XRP":
      return <SiXrp className="text-3xl text-gray-400" />;
    default:
      return <FaBitcoin className="text-3xl text-orange-400" />;
  }
};

// Helper function to get color scheme based on symbol
const getColorScheme = (symbol: string) => {
  const upperSymbol = symbol.toUpperCase();
  switch (upperSymbol) {
    case "BTC":
    case "BITCOIN":
      return {
        color: "red",
        chart: "#ff3b3b",
        chartBg: "#F01717",
        chartBgTrans: "#F0171710",
      };
    case "USDT":
    case "USDTERC20":
      return {
        color: "green",
        chart: "#22c55e",
        chartBg: "#22c55e",
        chartBgTrans: "#22c55e10",
      };
    case "ETH":
    case "ETHEREUM":
      return {
        color: "#1D8751",
        chart: "#1D8751",
        chartBg: "#1D8751",
        chartBgTrans: "#1D875110",
      };
    case "SOL":
    case "SOLANA":
      return {
        color: "purple",
        chart: "#9333ea",
        chartBg: "#9333ea",
        chartBgTrans: "#9333ea10",
      };
    case "XRP":
      return {
        color: "yellow",
        chart: "#facc15",
        chartBg: "#facc15",
        chartBgTrans: "#facc1510",
      };
    default:
      return {
        color: "blue",
        chart: "#3b82f6",
        chartBg: "#3b82f6",
        chartBgTrans: "#3b82f610",
      };
  }
};

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
  symbol,
  image,
  price,
  volume,
  transactionCount,
  chart,
  chartBg,
  chartBgTrans,
  rate,
}: CryptoData) => (
  <div
    className="
  flex-1 min-w-[160px] max-w-[260px] sm:min-w-[180px] sm:max-w-[320px] h-[160px]
  text-[13px] rounded-2xl shadow-lg p-3 flex flex-col justify-between border border-gray-300 relative
"
  >
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        {image ? <img src={image} alt={name} className="w-8 h-8" /> : icon}
        <div className="flex flex-col">
          <span className="dark:text-white font-semibold text-sm sm:text-base">
            {symbol}
          </span>
          {volume !== undefined && (
            <span className="text-xs text-gray-500">
              Vol: {volume.toFixed(3)}
            </span>
          )}
        </div>
      </div>
      <span className="bg-[#23262F] text-xs text-white px-1.5 py-0.5 rounded-lg">
        24h
      </span>
    </div>
    <div className="dark:text-white text-black flex flex-row justify-between items-end gap-1.5 text-[13px] font-bold text-base sm:text-lg mb-1">
      <div className="flex flex-col gap-0.5">
        {transactionCount !== undefined ? (
          <>
            <p className="text-xs text-gray-500"> Omaya Transactions</p>
            <p className="text-lg">{transactionCount}</p>
          </>
        ) : (
          <p>{price}</p>
        )}
      </div>
      <div className="h-5 px-2 rounded-md flex flex-row gap-1 items-center justify-center bg-[#48CC544D]">
        <p className="text-xs text-[#48CC54] font-semibold">{rate}</p>
      </div>
    </div>
    <div className="w-full h-8">
      <MiniChart color={chart} bg={chartBg} bgTrans={chartBgTrans} />
    </div>
  </div>
);

const PriceCards = React.memo(() => {
  const [isMounted, setIsMounted] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = React.useRef(false);
  const lastFetchRef = React.useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    setIsMounted(true);

    // Check if we need to fetch (not fetched yet OR cache expired)
    const now = Date.now();
    const cacheExpired = now - lastFetchRef.current > CACHE_DURATION;

    if (!fetchedRef.current || cacheExpired) {
      loadTopAssets();
    }
  }, []);

  const loadTopAssets = async () => {
    try {
      setLoading(true);
      const response = await fetchTopAssets();

      if (response.success && response.data.length > 0) {
        const mappedData: CryptoData[] = response.data.map(
          (asset: TopAsset) => {
            const colorScheme = getColorScheme(asset.symbol);
            return {
              name: asset.name || asset.symbol,
              symbol: asset.symbol,
              icon: getCryptoIcon(asset.symbol),
              image: asset.image,
              price: `Vol: ${asset.volume.toFixed(3)}`,
              volume: asset.volume,
              transactionCount: asset.transaction_count,
              rate: `${asset.transaction_count} tx`,
              ...colorScheme,
            };
          }
        );
        setCryptoData(mappedData);
        fetchedRef.current = true;
        lastFetchRef.current = Date.now();
      } else {
        // Set empty array if no data available
        setCryptoData([]);
      }
    } catch (error) {
      // Set empty array on error - no fallback data
      setCryptoData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="dark:text-white text-sm sm:text-base mb-3 sm:mb-4">
        Market Overview{" "}
        {loading && (
          <span className="text-xs sm:text-sm text-gray-500">(Loading...)</span>
        )}
      </h2>
      {cryptoData.length > 0 ? (
        <div className="flex flex-row gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4 -mx-1 px-1">
          {cryptoData.map((crypto, index) => (
            <div key={`${crypto.symbol}-${index}`} className="snap-start">
              <CryptoCard {...crypto} />
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className=""></div>
      ) : null}
    </div>
  );
});

PriceCards.displayName = "PriceCards";

export default PriceCards;
