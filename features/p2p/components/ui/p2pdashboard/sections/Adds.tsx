// src/features/p2p/components/ui/p2pdashboard/sections/Adds.tsx
"use client";

import React, { useState, useEffect } from "react";
import Button from "../../../Common/Button";
import Card from "../../../Common/Card";

interface AddsProps {
  filterType: "buy" | "sell";
}

const COLORS = {
  buy: "#1D8751",
  sell: "#E23D3A",
};

const paymentMethods = [
  { label: "Bank Transfer", value: "bank" },
  { label: "Mobile Money", value: "mobile" },
  { label: "Merchant", value: "merchant" },
];

const providers = [
  { label: "Salam Bank", value: "salam" },
  // Add more providers as needed
];

const timeLimits = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
];

const Adds: React.FC<AddsProps> = ({ filterType }) => {
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<"buy" | "sell">(filterType);
  const [asset] = useState("Tether USDT TRC20");
  const [commission, setCommission] = useState(1);
  const [amount, setAmount] = useState("");
  const [orderMin, setOrderMin] = useState("");
  const [orderMax, setOrderMax] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [provider, setProvider] = useState(providers[0].value);
  const [timeLimit, setTimeLimit] = useState(timeLimits[0].value);
  const [terms, setTerms] = useState("");
  const [autoReply, setAutoReply] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // keep your loading guard
  }

  return (
    <div className="w-full p-0 sm:p-4 min-h-screen flex flex-col items-center justify-start ">
      {/* Title and Buy/Sell Switch */}
      <div className="mb-1 w-full md:max-w-4xl md:mx-auto px-0 sm:px-0">
        <div className="text-white text-lg font-semibold mb-1">Post Ad</div>
        <div
          className={`flex w-fit border-2 rounded-[8px] overflow-hidden ${
            type === "buy" ? "border-[#1D8751]" : "border-[#E23D3A]"
          }`}
        >
          <button
            className={`px-2 py-1 text-sm font-medium transition rounded-l-[6px] ${
              type === "buy"
                ? "bg-[#1D8751] text-white"
                : "bg-transparent text-white"
            }`}
            onClick={() => setType("buy")}
            type="button"
          >
            Buy
          </button>
          <button
            className={`px-4 py-1 text-sm font-medium transition rounded-r-[6px] ${
              type === "sell"
                ? "bg-[#E23D3A] text-white"
                : "bg-transparent text-white"
            }`}
            onClick={() => setType("sell")}
            type="button"
          >
            Sell
          </button>
        </div>
      </div>

      {/* Type & Price */}
      <div className="w-full md:max-w-4xl md:mx-auto px-0 sm:px-2 md:px-0">
        <div className="text-sm text-[#788099] font-semibold mb-2 mt-3">
          Type & Price
        </div>
        <Card className="w-full mb-2 px-2 py-2 sm:px-4 sm:py-4 bg-[#1D1D23] border border-[#35353E] rounded-[24px]">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end w-full">
            {/* Asset */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs text-[#788099] mb-2">Asset</span>
              <div className="flex w-full items-center bg-[#18181D] border border-[#35353E] rounded-[16px] px-4 py-2 min-h-[56px]">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                  alt="USDT"
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-white text-base font-semibold ml-2">
                  {asset}
                </span>
                <svg
                  className="ml-auto w-5 h-5 text-[#788099]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* Commission */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs text-[#788099] mb-2">Commission</span>
              <div className="flex w-full items-center bg-[#18181D] border border-[#35353E] rounded-[16px] px-4 py-2 min-h-[56px]">
                <svg
                  className="w-6 h-6 text-[#1D8751] mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 9V7a5 5 0 00-10 0v2" />
                  <path d="M12 17v2a2 2 0 002 2h4a2 2 0 002-2v-2" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-white text-base font-semibold mr-4">
                  {commission}%
                </span>
                <button
                  className="text-[#1D8751] text-xl font-bold w-8 h-8 rounded-full hover:bg-[#1D8751]/10 flex items-center justify-center transition"
                  onClick={() => setCommission((c) => c + 1)}
                >
                  +
                </button>
                <button
                  className="text-[#1D8751] text-xl font-bold w-8 h-8 rounded-full hover:bg-[#1D8751]/10 flex items-center justify-center transition"
                  onClick={() => setCommission((c) => Math.max(0, c - 1))}
                >
                  –
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Amount & Payment Method */}
        <div className="text-sm text-[#788099] font-semibold mb-2 mt-6">
          Amount & Payment Method
        </div>
        <Card className="w-full mb-4 px-2 py-2 sm:px-4 sm:py-4 bg-[#1D1D23] border border-[#35353E] rounded-[24px]">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* I want to sell */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm text-[#788099] mb-1">I want to sell</label>
              <div className="flex items-center bg-[#18181D] border border-[#35353E] rounded-[20px] px-4 py-3">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                  alt=""
                  className="w-6 h-6 mr-2"
                />
                <span className="text-white text-base font-semibold mr-1">
                  {amount || "1,000"}
                </span>
                <span className="text-[#788099] text-base font-semibold">USDT</span>
                <svg
                  className="ml-auto w-5 h-5 text-[#788099]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* Order Min */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm text-[#788099] mb-1">Order Min.</label>
              <div className="flex items-center bg-[#18181D] border border-[#35353E] rounded-[20px] px-4 py-3">
                <svg
                  className="w-6 h-6 text-[#1D8751] mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1v22" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <span className="text-white text-base font-semibold mr-1">
                  {orderMin || "20.00"}
                </span>
                <span className="text-[#788099] text-base font-semibold">USD</span>
                <svg
                  className="ml-auto w-5 h-5 text-[#788099]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* Order Max */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm text-[#788099] mb-1">Order Max</label>
              <div className="flex items-center bg-[#18181D] border border-[#35353E] rounded-[20px] px-4 py-3">
                <svg
                  className="w-6 h-6 text-[#1D8751] mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1v22" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <span className="text-white text-base font-semibold mr-1">
                  {orderMax || "200.00"}
                </span>
                <span className="text-[#788099] text-base font-semibold">USD</span>
                <svg
                  className="ml-auto w-5 h-5 text-[#788099]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Payment Method */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm text-[#788099] mb-1">
                Payment Method
              </label>
              <select
                className="bg-[#18181D] border border-[#35353E] rounded-[20px] px-4 py-3 text-white text-base font-semibold"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {paymentMethods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Button
                borderRadius={24}
                className="mt-4 bg-[#1D8751] text-white rounded-full font-semibold w-fit px-6 py-2"
              >
                Add payment method
              </Button>
            </div>
            {/* Provider */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm text-[#788099] mb-1">Provider</label>
              <div className="flex items-center bg-[#18181D] border border-[#35353E] rounded-[20px] px-4 py-3">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
                  alt="Provider"
                  className="w-6 h-6 mr-2 rounded-full"
                />
                <span className="text-white text-base font-semibold">
                  {provider}
                </span>
              </div>
            </div>
            {/* Time Limit */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm text-[#788099] mb-1">Time Limit</label>
              <div className="flex items-center bg-[#18181D] border border-[#35353E] rounded-[20px] px-4 py-3">
                <svg
                  className="w-6 h-6 text-[#1D8751] mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="text-white text-base font-semibold">
                  {timeLimits.find((t) => t.value === timeLimit)?.label}
                </span>
                <svg
                  className="ml-auto w-5 h-5 text-[#788099]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Terms & Auto Reply */}
          <div className="text-2xl text-[#788099] font-semibold mb-2 mt-6">
            Terms & Auto Reply
          </div>
          <Card className="w-full mb-4 px-2 py-2 sm:px-4 sm:py-4 bg-[#1D1D23] border border-[#35353E] rounded-[24px]">
            <div>
              <label className="text-lg text-[#788099] font-semibold mb-2 block">
                Terms (Optional)
              </label>
              <textarea
                className="w-full bg-[#18181D] border-none rounded-[24px] px-6 py-5 text-[#788099] min-h-[120px] mb-6 resize-none"
                placeholder="Enter terms..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
            <div>
              <label className="text-lg text-[#788099] font-semibold mb-2 block">
                Auto Reply (Optional)
              </label>
              <textarea
                className="w-full bg-[#18181D] border-none rounded-[24px] px-6 py-5 text-[#788099] min-h-[120px] mb-6 resize-none"
                placeholder="Enter auto-reply..."
                value={autoReply}
                onChange={(e) => setAutoReply(e.target.value)}
              />
            </div>
            <div className="flex gap-6 mt-6">
              <Button
                borderRadius={24}
                className="flex-1 rounded-[24px] border-1 border-[#1D8751] text-white bg-transparent text-base font-medium py-2 hover:bg-[#23232B] transition"
                variant="outline"
              >
                Cancel Post
              </Button>
              <Button
                borderRadius={24}
                className={`flex-1 rounded-[24px] border-1 text-white text-base font-medium py-2 ${
                  type === "buy"
                    ? "bg-[#1D8751] border-[#1D8751]"
                    : "bg-[#E23D3A] border-[#E23D3A]"
                }`}
                type="submit"
              >
                Post Ad
              </Button>
            </div>
          </Card>
        </Card>
      </div>
    </div>
  );
};

export default Adds;