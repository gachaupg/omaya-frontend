/**
 * BuyWidget.tsx – auto‑generated placeholder
 */
"use client";
import React, { useState } from "react";

const BuyWidget = () => {
  const [usdAmount, setUsdAmount] = useState("1500");
  const [btcAmount, setBtcAmount] = useState("0.023424");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("visa1");

  return (
    <div className="mx-auto bg-[#181820] p-6 rounded-2xl text-white max-xl">
      <h2 className="text-lg font-semibold mb-6">Buy Crypto</h2>
      {/* 1- Transaction Info */}
      <div className="mb-8">
        <div className="mb-2 text-base font-semibold">1- Transaction Info</div>
        <div className="bg-[#23232b] border border-[#35353E] rounded-xl p-5 mb-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="text-xs mb-1">You Pay</div>
                <div className="flex items-center bg-[#181820] rounded-[18px] px-3 py-2">
                  <input
                    type="text"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    className="bg-transparent outline-none w-full text-white"
                  />
                  <span className="ml-2 text-xs">USD</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1">I want to Recieve</div>
                <div className="flex items-center bg-[#181820] rounded-[18px] px-3 py-2">
                  <input
                    type="text"
                    value={btcAmount}
                    onChange={(e) => setBtcAmount(e.target.value)}
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
                Estimated rate:1 BTC ~ 22.10446 USD
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* 2- Your Wallet Address */}
      <div className="mb-8">
        <div className="mb-2 text-base font-semibold">
          2- Your Wallet Address
        </div>
        <div className="bg-[#23232b] border border-[#35353E] rounded-xl p-5">
          <p className="text-xs text-[#8C8CA1] mb-2">Wallet/Account Address</p>
          <div className="mb-3 flex items-center relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <img
                src="/assets/wallet-01_hugnf4.png"
                alt="Wallet Icon"
                className="w-5 h-5"
              />
            </span>
            <input
              type="text"
              placeholder="Paste your crypto address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full bg-[#181820] border-none rounded-[18px] px-12 py-2 text-white outline-none placeholder-[#8C8CA1] text-sm sm:text-base"
            />
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
                src="/assets/wallet-01_hugnf4.png"
                alt="Paste Icon"
                className="w-4 h-4 ml-1"
              />
            </button>
          </div>
          {/* Checkbox */}
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mr-2 accent-[#1D8751] w-5 h-5 rounded-lg border  border-[#F79330] ring-1 ring-[#F79330] focus:ring-[#F79330] cursor-pointer"
              id="confirm-address"
            />
            <label htmlFor="confirm-address" className="text-sm text-white">
              I Confirm that the above submitted address is correct Address for
              the Cryptocurrency i chose, and not other Crypto *
            </label>
          </div>
        </div>
      </div>
      {/* 3- Payment Method */}
      <div className="mb-8">
        <div className="mb-2 text-base font-semibold">3- Payment Method</div>
        <div className="bg-[#23232b] border border-[#35353E] rounded-xl p-5 flex flex-col gap-4">
          {/* First row */}
          <div className="flex items-center justify-between gap-4">
            <div
              className={`flex items-center flex-1 border rounded-[18px] px-4 py-2 gap-2 ${
                paymentMethod === "visa1"
                  ? "border-[#1D8751]"
                  : "border-[#35353E]"
              }`}
              onClick={() => setPaymentMethod("visa1")}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                alt="Visa"
                className="w-8 h-8"
              />
              <span className="ml-2">Visa Card</span>
              <input
                type="radio"
                checked={paymentMethod === "visa1"}
                readOnly
                className="ml-2 accent-[#1D8751]"
              />
            </div>
            <div
              className={`flex items-center flex-1 border rounded-[18px] px-4 py-2 gap-2 ${
                paymentMethod === "master1"
                  ? "border-[#1D8751]"
                  : "border-[#35353E]"
              }`}
              onClick={() => setPaymentMethod("master1")}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
                alt="MasterCard"
                className="w-8 h-8"
              />
              <span className="ml-2">Master Card</span>
              <input
                type="radio"
                checked={paymentMethod === "master1"}
                readOnly
                className="ml-2 accent-[#1D8751]"
              />
            </div>
          </div>
          {/* Second row */}
          <div className="flex items-center justify-between gap-4">
            <div
              className={`flex items-center flex-1 border rounded-[18px] px-4 py-2 gap-2 ${
                paymentMethod === "visa2"
                  ? "border-[#1D8751]"
                  : "border-[#35353E]"
              }`}
              onClick={() => setPaymentMethod("visa2")}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                alt="Visa"
                className="w-8 h-8"
              />
              <span className="ml-2">Visa Card</span>
              <input
                type="radio"
                checked={paymentMethod === "visa2"}
                readOnly
                className="ml-2 accent-[#1D8751]"
              />
            </div>
            <div
              className={`flex items-center flex-1 border rounded-[18px] px-4 py-2 gap-2 ${
                paymentMethod === "master2"
                  ? "border-[#1D8751]"
                  : "border-[#35353E]"
              }`}
              onClick={() => setPaymentMethod("master2")}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
                alt="MasterCard"
                className="w-8 h-8"
              />
              <span className="ml-2">Master Card</span>
              <input
                type="radio"
                checked={paymentMethod === "master2"}
                readOnly
                className="ml-2 accent-[#1D8751]"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Submit Button */}
      <button
        className="w-full bg-[#1D8751] hover:bg-[#16663d] text-white py-3 rounded-[24px] font-semibold text-base transition"
        disabled={!walletAddress || !confirm}
      >
        Submit
      </button>
    </div>
  );
};

export default BuyWidget;
