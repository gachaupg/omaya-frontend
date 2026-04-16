"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";

function ForexSuccessContent() {
  const { isChecking, isVerified } = useRouteProtection();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const transactionId = searchParams?.get("transactionId") || null;
  
  const { currentExchange } = useSelector((state: any) => state.forex);
  const [exchangeData, setExchangeData] = useState<any>(null);
  const shouldHideExchangeRate =
    String(exchangeData?.to_currency || "").toUpperCase() === "FXP" ||
    String(exchangeData?.from_currency || "").toUpperCase() === "FXP";

  // Load exchange data from localStorage or Redux
  useEffect(() => {
    if (currentExchange && currentExchange.forex_transaction_id === transactionId) {
      setExchangeData(currentExchange);
    } else {
      // Try to load from localStorage
      const cachedExchange = localStorage.getItem('currentForexExchange');
      if (cachedExchange) {
        try {
          const data = JSON.parse(cachedExchange);
          if (data.forex_transaction_id === transactionId) {
            setExchangeData(data);
          }
        } catch (e) {
          console.error('Failed to parse cached exchange data:', e);
        }
      }
    }
  }, [currentExchange, transactionId]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" color="#1D8751" />
      </div>
    );
  }

  if (isVerified === false) {
    return null; // Modal will be shown by the hook
  }

  if (!exchangeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1D8751]"></div>
          <p className="text-[#788099] text-lg">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 sm:px-6 md:px-8 min-h-screen flex flex-col items-center justify-center pt-8 pb-8 overflow-x-hidden ${isDark ? 'bg-[#18181D]' : 'bg-transparent'}`}>
      {/* Success Animation Card */}
      <div className="w-full max-w-2xl mb-6">
        <div
          className={`${
            isDark ? "bg-[#23232B] border-[#35353E]" : "bg-white border-gray-200"
          } border-2 rounded-2xl p-8 shadow-lg flex flex-col items-center`}
        >
          {/* Success Check Animation */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-[#1D8751] bg-opacity-10 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[#1D8751] flex items-center justify-center animate-pulse">
                <svg width="60" height="60" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <h1 className={`${isDark ? "text-white" : "text-gray-900"} text-3xl font-bold mb-2 text-center`}>
            Transaction Complete!
          </h1>
          <p className={`${isDark ? "text-[#788099]" : "text-gray-600"} text-lg mb-6 text-center`}>
            Your forex exchange has been successfully processed
          </p>

          {/* Transaction Summary */}
          <div className={`w-full p-6 border-2 rounded-xl mb-6 ${isDark ? "border-[#35353E]" : "border-gray-300"}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? "text-[#788099]" : "text-gray-600"} text-base font-medium`}>
                  Exchange:
                </span>
                <span className={`${isDark ? "text-white" : "text-gray-900"} text-lg font-bold`}>
                  {exchangeData.from_amount} {exchangeData.from_currency} → {exchangeData.to_amount} {exchangeData.to_currency}
                </span>
              </div>

              <div className={`border-t ${isDark ? "border-[#35353E]" : "border-gray-300"}`}></div>

              <div className="flex items-center justify-between">
                <span className={`${isDark ? "text-[#788099]" : "text-gray-600"} text-base font-medium`}>
                  Reference Number:
                </span>
                <div className="flex items-center gap-2">
                  <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm font-mono`}>
                    {exchangeData.transaction_reference || exchangeData.transaction_id}
                  </span>
                  <CopyButton
                    value={exchangeData.transaction_reference || exchangeData.transaction_id}
                    className="text-[#1D8751]"
                  />
                </div>
              </div>

              {!shouldHideExchangeRate && (
                <>
                  <div className={`border-t ${isDark ? "border-[#35353E]" : "border-gray-300"}`}></div>

                  <div className="flex items-center justify-between">
                    <span className={`${isDark ? "text-[#788099]" : "text-gray-600"} text-base font-medium`}>
                      Exchange Rate:
                    </span>
                    <span className={`${isDark ? "text-white" : "text-gray-900"} text-base font-semibold`}>
                      1 {exchangeData.from_currency} = {exchangeData.exchange_rate} {exchangeData.to_currency}
                    </span>
                  </div>
                </>
              )}

              {exchangeData.user_forex_account && (
                <>
                  <div className={`border-t ${isDark ? "border-[#35353E]" : "border-gray-300"}`}></div>
                  <div className="flex items-center justify-between">
                    <span className={`${isDark ? "text-[#788099]" : "text-gray-600"} text-base font-medium`}>
                      Forex Account:
                    </span>
                    <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm font-mono`}>
                      {exchangeData.user_forex_account}
                    </span>
                  </div>
                </>
              )}

              <div className={`border-t ${isDark ? "border-[#35353E]" : "border-gray-300"}`}></div>

              <div className="flex items-center justify-between">
                <span className={`${isDark ? "text-[#788099]" : "text-gray-600"} text-base font-medium`}>
                  Completed At:
                </span>
                <span className={`${isDark ? "text-white" : "text-gray-900"} text-sm`}>
                  {new Date(exchangeData.updated_at || exchangeData.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="mb-6">
            <div className="w-48 h-48 bg-white rounded-lg p-4 flex items-center justify-center shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${
                  exchangeData.transaction_reference || exchangeData.transaction_id
                }`}
                alt="Transaction QR Code"
                className="w-full h-full"
              />
            </div>
            <p className={`${isDark ? "text-[#788099]" : "text-gray-600"} text-xs text-center mt-2`}>
              Scan to view transaction details
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={() => router.push("/dashboard/express-exchange")}
              className="w-full py-3 bg-[#1D8751] text-white rounded-2xl font-semibold hover:bg-[#166b3e] transition-colors"
            >
              New Exchange
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className={`w-full py-3 ${
                isDark ? "bg-[#35353E] text-white" : "bg-gray-200 text-gray-900"
              } rounded-2xl font-semibold hover:opacity-80 transition-opacity`}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// Loading component
function ForexSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1D8751]"></div>
        <p className="text-[#788099] text-lg">Loading success page...</p>
      </div>
    </div>
  );
}

// Wrap with Suspense
export default function ForexSuccessPage() {
  return (
    <Suspense fallback={<ForexSuccessLoading />}>
      <ForexSuccessContent />
    </Suspense>
  );
}

