import React, { useState, useEffect } from "react";
import Card from "../../../Common/Card";
import { FaCheckCircle } from "react-icons/fa";
import {
  ASSETS,
  NETWORKS,
  WALLET_TYPES,
  NETWORK_FEE,
} from "@/features/p2p/data";

const Withdraw = () => {
  const [isClient, setIsClient] = useState(false);
  const [asset, setAsset] = useState("");
  const [network, setNetwork] = useState("");
  const [walletType, setWalletType] = useState("");
  const [amount, setAmount] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");

  useEffect(() => {
    setIsClient(true);
    setAsset(ASSETS[0].value);
    setNetwork(NETWORKS[0].value);
    setWalletType(WALLET_TYPES[0].value);
  }, []);

  const receiveAmount = amount
    ? Math.max(0, parseFloat(amount) - NETWORK_FEE).toFixed(5)
    : "0.00000";

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex justify-center items-center min-h-screen w-full pt-6">
      <Card className="w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)] px-4 sm:px-8 md:px-12 pt-4 p-0 bg-[#23232B] border-2 border-[#35353E] shadow-xl rounded-[24px] flex flex-col mx-auto my-auto">
        {/* Asset & Network */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Asset Dropdown */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Asset
            </label>
            <div className="relative">
              <select
                className="w-full bg-[#35353E] border border-[#23232B] rounded-[18px] text-white py-3 pl-10 pr-4 appearance-none focus:outline-none"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              >
                {ASSETS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <img
                src={ASSETS[0].icon}
                alt="asset"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              />
            </div>
          </div>
          {/* Network Dropdown */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Network
            </label>
            <div className="relative">
              <select
                className="w-full bg-[#35353E] border border-[#23232B] rounded-[18px] text-white py-3 pl-10 pr-4 appearance-none focus:outline-none"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                {NETWORKS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
              <img
                src={NETWORKS[0].icon}
                alt="network"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              />
            </div>
          </div>
        </div>

        {/* Wallet Type Selector */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Wallet Type
          </label>
          <div className="flex flex-wrap gap-2">
            {WALLET_TYPES.map((w) => (
              <button
                key={w.value}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[12px] border ${
                  walletType === w.value
                    ? "border-[#1D8751] bg-[#23232B]"
                    : "border-[#35353E] bg-[#35353E]"
                } text-white text-sm font-medium focus:outline-none`}
                onClick={() => setWalletType(w.value)}
                type="button"
              >
                <img src={w.icon} alt="wallet" className="w-5 h-5" />
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount and Receive */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Amount Input */}
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              I want to withdraw
            </label>
            <div className="relative flex items-center py-3 pl-10 pr-4 h-[55px] bg-[#35353E] border border-[#23232B] rounded-[18px] px-4">
              <span className="text-[#1D8751] text-lg font-semibold mr-2">
                $
              </span>
              <input
                type="number"
                className="w-full bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none p-0 text-lg"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
              />
              <span className="ml-2 text-xs flex text-gray-400">
                <span className="text-[#1D8751]">Max.</span> USDT
              </span>
            </div>
          </div>
          {/* Receive Calculation */}
          <div className="flex-1 flex flex-col">
            <label className="text-xs flex flex-col sm:flex-row sm:justify-between font-medium text-gray-400 mb-1">
              <p>I will Receive</p>
              <p className="mt-1 sm:mt-0">
                Network Fee{" "}
                <span className="text-[#1D8751]">${NETWORK_FEE}</span>
              </p>
            </label>
            <div className="relative flex items-center py-3 pl-10 pr-4 bg-[#35353E] border border-[#23232B] rounded-[18px] px-4">
              <img src={ASSETS[0].icon} alt="usdt" className="w-5 h-5 mr-2" />
              <span className="text-[#1D8751] text-base sm:text-lg font-semibold">
                {receiveAmount} USDT
              </span>
              <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                <span className="relative group">
                  <svg
                    className="w-4 h-4 ml-1 text-gray-400 cursor-pointer"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-8 bg-[#23232B] text-xs text-white px-3 py-2 rounded shadow-lg border border-[#35353E] w-56 z-10">
                    A network fee will be deducted from withdrawals, covering
                    the costs of blockchain transactions.
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* USDT Address Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            USDT Address
          </label>
          <input
            type="text"
            className="w-full bg-[#35353E] border border-[#23232B] rounded-[12px] text-white py-3 px-4 placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none text-base"
            placeholder="Type in here your USDT TRC20 (TRON) Wallet Address"
            value={usdtAddress}
            onChange={(e) => setUsdtAddress(e.target.value)}
          />
        </div>

        {/* Transfer Details */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <span className="text-gray-400 text-sm font-medium mr-2">
              Transfer Details
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="border border-[#1D8751] rounded-[16px] bg-[#23232B] px-4 sm:px-6 py-4">
            <div className="flex items-center mb-2">
              <FaCheckCircle className="text-[#1D8751] mr-3" />
              <span className="text-white text-sm">
                Please send the money from your own account Only
              </span>
            </div>
            <div className="flex items-center mb-2">
              <FaCheckCircle className="text-[#1D8751] mr-3" />
              <span className="text-white text-sm">
                Put transaction ID in the description field of the bank
              </span>
            </div>
            <div className="flex items-center">
              <FaCheckCircle className="text-[#1D8751] mr-3" />
              <span className="text-white text-sm">
                Please note, if you do not follow above conditions, we will
                reject your transaction and send you back your money.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-2">
          <button
            className="w-full sm:flex-1 py-3 rounded-[16px] border border-[#5A5A6E] text-white bg-transparent hover:bg-[#35353E] transition text-lg font-medium"
            type="button"
          >
            Cancel
          </button>
          <button
            className="w-full sm:flex-1 py-3 rounded-[16px] bg-[#E23D3A] text-white text-lg font-medium hover:bg-[#17693e] transition"
            type="submit"
          >
            Withdraw
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Withdraw;
