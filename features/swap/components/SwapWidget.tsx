/**
 * SwapWidget.tsx – auto‑generated placeholder
 */
"use client";
import React, { useState } from "react";

const SwapWidget = () => {
  const [fromAsset, setFromAsset] = useState("BTC");
  const [toAsset, setToAsset] = useState("ETH");
  const [fromAmount, setFromAmount] = useState("0.01");
  const [toAmount, setToAmount] = useState("0.2210446");
  const [walletAddress, setWalletAddress] = useState("");
  const [toWalletAddress] = useState("31r8yoz21o44vy6SuhiLahwvRqQZF");
  const [confirm, setConfirm] = useState(false);

  return (
    <div className=" mx-auto bg-[#181820] p-6 rounded-2xl text-white">
      <h2 className="text-lg font-semibold mb-6">Swap Crypto</h2>
      {/* 1- Transaction Info */}
      <div className="mb-8">
        <div className="mb-2 text-base font-semibold">1- Transaction Info</div>
        <div className="bg-[#23232b] border border-[#35353E] rounded-xl p-5 mb-2">
          <div className="flex flex-col gap-4">
            {/* You Send */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="text-xs mb-1">You Send</div>
                <div className="flex items-center bg-[#181820] rounded-[18px] px-3 py-2">
                  <img
                    src="https://res.cloudinary.com/pitz/image/upload/v1749722107/Bitcoin_c5cb61.png"
                    alt="BTC"
                    className="w-6 h-6 mr-2"
                  />
                  <span className="font-medium mr-2">BTC</span>
                  <span className="text-[#8C8CA1] text-xs">Bitcoin</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1">I want to Recieve</div>
                <div className="flex items-center bg-[#181820] rounded-[18px] px-3 py-2">
                  <input
                    type="text"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-transparent outline-none w-full text-white"
                  />
                  <span className="ml-2 text-xs">BTC</span>
                </div>
              </div>
            </div>
            {/* Warning */}
            <div className="flex items-center text-[#FF4D4D] text-xs mt-1">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs text-[#ffff]">
                This is only estimated price and its based on current Market
                Price. We will fix the price when we receive the funds .
              </span>
            </div>
            {/* Estimated Rate */}
            <div className="mt-2 flex items-center gap-2 border border-[#35353E] justify-center rounded-[24px] px-3 py-2">
              <span className=" text-[#8C8CA1] bg-[#35353E] text-xs px-3 py-1 rounded-full">
                Estimated rate: 1 BTC = 22.10446 ETH
              </span>
            </div>
            {/* You Get */}{" "}
            <div className="text-xs flex items-center gap-2 justify-between">
              <span className="text-[#8C8CA1]">You Get</span>
              <span className="text-[#ffff]">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1749722630/Group_164097_1_by5uzz.png"
                  alt="ETH"
                  className="w-6 h-6 mr-2"
                />
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4 ">
              <div className="flex-1">
                <div>Asset</div>
                <div className="flex items-center bg-[#181820] rounded-[18px] px-3 py-2">
                  <img
                    src="https://res.cloudinary.com/pitz/image/upload/v1749722106/27463866eb9fa6fe4b6d2bd2cd3d6fd88392cb43_cedynw.png"
                    alt="ETH"
                    className="w-6 h-6 mr-2"
                  />
                  <span className="font-medium mr-2">ETH</span>
                  <span className="text-[#8C8CA1] text-xs">Ethereum</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1">I want to Recieve</div>
                <div className="flex items-center border border-[#35353E] rounded-[18px] px-3 py-2">
                  <input
                    type="text"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className="bg-transparent outline-none w-full text-white"
                  />
                  <span className="ml-2 text-xs">ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 2- Your Wallet Address */}
      <div className="mb-8">
        <div className="mb-2 text-base font-semibold text-[#8C8CA1]">
          Wallet/Account Address
        </div>
        <div className="bg-[#23232b] border border-[#35353E] rounded-xl p-5">
            <p className="text-xs text-[#8C8CA1] mb-2">Wallet/Account Address</p>
          <div className="mb-3 flex items-center relative">
            {/* Wallet SVG Icon */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1749724441/wallet-01_hugnf4.png"
                alt="Paste Icon"
                className="w-4 h-4 ml-1"
              />  
            </span>
            <input
              type="text"
              placeholder="Paste here your Crypto address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full bg-[#181820] border-none rounded-[18px] px-12 py-2 text-white outline-none placeholder-[#8C8CA1] text-base"
            />
            {/* Paste Button with SVG */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#35353E] text-[#8C8CA1] px-4 py-2 rounded-[18px] font-medium"
              onClick={() =>
                navigator.clipboard
                  .readText()
                  .then((text) => setWalletAddress(text))
              }
              type="button"
            >
              Paste
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1749724441/wallet-01_hugnf4.png"
                alt="Paste Icon"
                className="w-4 h-4 ml-1"
              />
            </button>
          </div>
          {/* Checkbox */}
          <div className="flex items-center  mb-3">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mr-2 accent-[#1D8751] w-5 h-5 rounded-[18px] border border-[#F79330] cursor-pointer"
              id="confirm-address"
            />
            <label htmlFor="confirm-address" className="text-sm text-white">
              I Confirm that the above submitted address is correct Address for
              the Cryptocurrency i chose, and not other Crypto *
            </label>
          </div>
          {/* Submit Button */}
          <button
            className="w-full bg-[#1D8751] hover:bg-[#1D8751] text-white py-2 rounded-[24px] font-semibold text-base transition"
            disabled={!walletAddress || !confirm}
          >
            Submit
          </button>
        </div>
      </div>
      {/* 3- To Wallet Address */}
      <div className="mb-2">
        <div className="mb-2 text-base font-semibold">3- To Wallet Address</div>
        <div className="bg-[#23232b] rounded-xl p-5">
            <p className="text-xs text-[#8C8CA1] mb-2">Wallet/Account Address</p>
          <div className="mb-3 flex items-center">
            <input
              type="text"
              value={toWalletAddress}
              readOnly
              className="w-full bg-[#181820] border border-[#1D8751] rounded-[18px] px-3 py-2 text-[#1D8751] font-mono outline-none"
            />
            <button
              className="ml-2 bg-[#181820] hover:bg-[#35353E] p- rounded-[18px] border border-[#35353E] text-[#1D8751]"
              onClick={() => {
                navigator.clipboard.writeText(toWalletAddress);
              }}
              title="Copy"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
          <button className="w-full bg-[#1D8751] hover:bg-[#16663d] text-white py-2 rounded-[18px] font-semibold transition">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapWidget;
