import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme";

/**
 * ExchangeForm – TypeScript version with BTC ⇄ ETH swap support.
 * Image assets expected in /public/images:
 *   - salam.svg
 *   - tether.svg
 *   - Bitcoin.svg (note the capital B)
 *   - eth.svg
 *   - swap.svg / swap-light.svg
 *   - Express Excahnge.svg / Express Excahnge-light.svg
 */

type Tab = "express" | "swap";
interface Currency {
  label: string;
  sub?: string;
  icon: string;
}
interface Preset {
  pay: Currency;
  get: Currency;
}

export default function ExchangeForm() {
  const { isDark } = useTheme();

  /* ------------------- State ------------------- */
  const [activeTab, setActiveTab] = useState<Tab>("express");
  const [payAmount, setPayAmount] = useState("");
  const [getAmount, setGetAmount] = useState("");

  const presets: Record<Tab, Preset> = {
    express: {
      pay: { label: "Salam Bank", icon: "/images/salam.svg" },
      get: { label: "USDT", sub: "Tether US", icon: "/images/tether.svg" },
    },
    swap: {
      pay: { label: "BTC", sub: "Bitcoin", icon: "/images/Bitcoin.svg" },
      get: { label: "ETH", sub: "Ethereum", icon: "/images/eth.svg" },
    },
  };

  const [payCurrency, setPayCurrency] = useState<Currency>(presets.express.pay);
  const [getCurrency, setGetCurrency] = useState<Currency>(presets.express.get);

  /* Sync currencies when tab switches */
  useEffect(() => {
    setPayCurrency(presets[activeTab].pay);
    setGetCurrency(presets[activeTab].get);
    setPayAmount("");
    setGetAmount("");
  }, [activeTab]);

  /* Swap currencies + amounts */
  const handleSwap = () => {
    setPayCurrency(getCurrency);
    setGetCurrency(payCurrency);
    setPayAmount(getAmount);
    setGetAmount(payAmount);
  };

  /* ------------------- Helpers ------------------- */
  const TabButton: React.FC<{ id: Tab; children: React.ReactNode }> = ({
    id,
    children,
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-1/2 flex justify-center p-5 transition-opacity ${
        activeTab === id ? "opacity-100" : "opacity-50 hover:opacity-75"
      }`}
    >
      {children}
    </button>
  );

  const AmountInput: React.FC<{
    amount: string;
    onChange: (v: string) => void;
  }> = ({ amount, onChange }) => (
    <input
      type="text"
      value={amount}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      className="border border-gray-300 dark:border-gray-300/20 text-gray-900 dark:text-white w-full px-5 py-4 rounded-full"
    />
  );

  /* ------------------- UI ------------------- */
  return (
    <div className="w-full bg-white dark:bg-[#1D1D23] rounded-3xl p-10">
      {/* Tabs */}
      <div className="w-full flex justify-between">
        <TabButton id="express">
          <Image
            src={
              isDark
                ? "/images/Express Excahnge.svg"
                : "/images/Express Excahnge-light.svg"
            }
            alt="express exchange logo"
            width={150}
            height={250}
          />
        </TabButton>
        <TabButton id="swap">
          <h3
            className={`text-lg font-bold transition-colors ${
              activeTab === "swap"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-white/50"
            }`}
          >
            Swap crypto
          </h3>
        </TabButton>
      </div>

      {/* Pay card */}
      <div className="flex flex-col p-5 border border-gray-300 dark:border-white/20 rounded-xl -mb-5 mt-10">
        <h2 className="text-gray-900 dark:text-white text-sm mb-3">You pay</h2>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={payCurrency.icon}
              alt={payCurrency.label}
              width={44}
              height={44}
            />
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {payCurrency.label}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-[#8C8CA1] text-xs mb-2">
              Amount
            </p>
            <AmountInput amount={payAmount} onChange={setPayAmount} />
          </div>
        </div>
      </div>

      {/* Swap button */}
      <div className="flex justify-center items-center">
        <button onClick={handleSwap} aria-label="Swap currencies">
          <Image
            src={isDark ? "/images/swap.svg" : "/images/swap-light.svg"}
            alt="swap icon"
            width={54}
            height={54}
          />
        </button>
      </div>

      {/* Get card */}
      <div className="flex flex-col p-5 border border-gray-300 dark:border-white/20 -mt-5 rounded-xl">
        <h2 className="text-gray-900 dark:text-white text-sm mb-3">You get</h2>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={getCurrency.icon}
              alt={getCurrency.label}
              width={44}
              height={44}
            />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {getCurrency.label}
              </p>
              {getCurrency.sub && (
                <p className="text-xs text-gray-500 dark:text-white/70">
                  {getCurrency.sub}
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-gray-500 dark:text-[#8C8CA1] text-xs mb-2">
              Amount
            </p>
            <AmountInput amount={getAmount} onChange={setGetAmount} />
          </div>
        </div>
      </div>

      {/* Footer note & CTA */}
      <div className="flex flex-col p-5 gap-5">
        <div className="flex items-center gap-2">
          <Image
            src="/images/alert-circle.svg"
            alt="alert"
            width={24}
            height={24}
          />
          <p className="w-full text-xs text-gray-600 dark:text-white/70">
            This is only an estimated price based on current market rates. The
            final price will be confirmed when we receive the funds.
          </p>
        </div>

        <button className="w-full bg-[#1D8751] flex items-center justify-center p-5 rounded-full">
          <Image
            src="/images/Express Excahnge.svg"
            alt="express exchange button"
            width={120}
            height={140}
          />
        </button>
      </div>
    </div>
  );
}
