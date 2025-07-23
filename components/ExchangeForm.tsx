import Image from "next/image";
import React, { useState } from "react";
import { useTheme } from "@/context/theme";

export default function ExchangeForm() {
  const [activeTab, setActiveTab] = useState<"express" | "swap">("express");
  const { isDark } = useTheme();

  return (
    <div className="w-full bg-white dark:bg-[#1D1D23] rounded-3xl p-10">
      <div className=" w-full flex justify-between">
        <button
          onClick={() => setActiveTab("express")}
          className={`w-1/2 flex justify-center p-5 transition-opacity ${
            activeTab === "express"
              ? "opacity-100"
              : "opacity-50 hover:opacity-75"
          }`}
        >
          {/* Conditional rendering based on theme */}
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
        </button>
        <button
          onClick={() => setActiveTab("swap")}
          className={`w-1/2 flex justify-center p-5 transition-opacity ${
            activeTab === "swap" ? "opacity-100" : "opacity-50 hover:opacity-75"
          }`}
        >
          <h3
            className={`text-lg font-bold transition-colors ${
              activeTab === "swap"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-white/50"
            }`}
          >
            Swap cerypto
          </h3>
        </button>
      </div>
      <div>
        <div className=" flex flex-col  p-5 border border-gray-300 dark:border-white/20  rounded-xl -mb-5">
          <h2 className="text-gray-900 dark:text-white text-sm mb-3">
            You pay
          </h2>
          <div className=" flex justify-between">
            <div className=" flex items-center al gap-2">
              <Image
                src={"/images/salam.svg"}
                alt="usdt"
                width={44}
                height={44}
              />
              <p className=" text-base font-bold text-gray-900 dark:text-white">
                Salam Bank
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-[#8C8CA1] text-xs mb-2">
                Amount
              </p>
              <input
                type="text"
                className=" border border-gray-300 dark:border-gray-300/20  text-gray-900 dark:text-white w-full px-5   py-4 rounded-full"
                placeholder="10"
              />
            </div>
          </div>
        </div>
        <div className=" flex justify-center items-center">
          <button>
            {/* Conditional rendering based on theme */}
            <Image
              src={isDark ? "/images/swap.svg" : "/images/swap-light.svg"}
              alt="swap icon"
              width={54}
              height={54}
            />
          </button>
        </div>
        <div className=" flex flex-col  p-5 border border-gray-300 dark:border-white/20 -mt-5  rounded-xl">
          <h2 className="text-gray-900 dark:text-white text-sm mb-3">
            You Get
          </h2>
          <div className=" flex justify-between">
            <div className=" flex items-center al gap-2">
              <Image
                src={"/images/tether.svg"}
                alt="usdt"
                width={44}
                height={44}
              />
              <div>
                <p className=" text-lg font-bold text-gray-900 dark:text-white">
                  USDT
                </p>
                <p className=" text-xs text-gray-500 dark:text-white/70">
                  Tether US
                </p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 dark:text-[#8C8CA1] text-xs mb-2">
                Amount
              </p>
              <input
                type="text"
                className=" border border-gray-300 dark:border-gray-300/20  text-gray-900 dark:text-white w-full px-5   py-4  rounded-full"
                placeholder="10"
              />
            </div>
          </div>
        </div>
      </div>
      <div className=" flex flex-col p-5 gap-5">
        <div className=" flex items-center gap-2">
          <Image
            src={"/images/alert-circle.svg"}
            alt="salam"
            width={24}
            height={24}
          />
          <p className="  w-full  text-xs text-gray-600 dark:text-white/70">
            This is only an estimated price based on current market rates. The
            final price will be confirmed when we receive the funds.
          </p>
        </div>

        <button className=" w-full  bg-[#1D8751]  flex items-center justify-center p-5   rounded-full">
          {/* Always use white/light version for button */}
          <Image
            src={"/images/Express Excahnge.svg"}
            alt="express exchange button"
            width={120}
            height={140}
          />
        </button>
      </div>
    </div>
  );
}
