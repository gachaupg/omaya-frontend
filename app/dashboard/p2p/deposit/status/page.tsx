"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";
import Link from "next/link";

const P2P_DEPOSIT_STATUS_KEY = "p2pDepositStatusData";

interface DepositStatusData {
  id: string;
  amount: number;
  currency: string;
  network: string;
  wallet_type: string;
  walletAddress: string;
  timestamp: string;
}

function P2PDepositStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { isChecking, isVerified } = useRouteProtection();
  const [data, setData] = useState<DepositStatusData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const id = searchParams?.get("id") || null;

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem(P2P_DEPOSIT_STATUS_KEY);
      if (!raw) {
        setNotFound(true);
        return;
      }
      const parsed = JSON.parse(raw) as DepositStatusData;
      if (parsed.id !== id) {
        setNotFound(true);
        return;
      }
      setData(parsed);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" color="#1D8751" />
      </div>
    );
  }

  if (isVerified === false) {
    return null;
  }

  if (notFound || !data) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center px-4 ${
          isDark ? "bg-[#18181D]" : "bg-gray-50"
        }`}
      >
        <div
          className={`w-full max-w-md rounded-2xl border-2 p-8 ${
            isDark
              ? "bg-[#1D1D23] border-[#35353E]"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-xl font-bold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Deposit not found
          </h2>
          <p
            className={
              isDark ? "text-[#788099]" : "text-gray-600"
            }
          >
            This deposit session may have expired. Check your P2P transactions for
            status.
          </p>
          <Link
            href="/dashboard/p2p"
            className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#1D8751] text-white font-semibold hover:bg-[#166b3e] transition-colors"
          >
            Back to P2P
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div
      className={`min-h-screen px-4 py-6 sm:py-8 ${
        isDark ? "bg-[#18181D]" : "bg-gray-50"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard/p2p"
          className={`inline-flex items-center gap-2 text-sm font-medium mb-6 ${
            isDark ? "text-[#788099] hover:text-white" : "text-gray-600 hover:text-gray-900"
          } transition-colors`}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to P2P
        </Link>

        {/* Success header */}
        <div
          className={`rounded-2xl border-2 p-6 sm:p-8 mb-6 ${
            isDark
              ? "bg-[#1D1D23] border-[#35353E]"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#1D8751]/20 flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#1D8751"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h1
                className={`text-xl sm:text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Deposit submitted
              </h1>
              <p
                className={
                  isDark ? "text-[#788099] text-sm" : "text-gray-600 text-sm"
                }
              >
                Your request is being processed
              </p>
            </div>
          </div>

          {/* Transaction Details - layout aligned with MoneyX Exchanging */}
          <div
            className={`${
              isDark ? "bg-[var(--card-color)] border-[#35353E]" : "bg-white border-gray-200"
            } border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg w-full overflow-hidden box-border`}
          >
            <div
              className={`${
                isDark ? "text-white" : "text-gray-900"
              } text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4`}
            >
              Transaction Details
            </div>
            {/* Reference ID Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-1">
              <div
                className={`${
                  isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-sm sm:text-base font-medium`}
              >
                Reference ID
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                <span
                  className={`${
                    isDark ? "text-white" : "text-gray-900"
                  } text-xs sm:text-sm md:text-base font-mono font-semibold break-all sm:break-normal`}
                >
                  {data.id}
                </span>
                <CopyButton
                  value={data.id}
                  className="text-[#FFA200] hover:text-[#FFB833] transition-colors"
                  showIcon={true}
                />
              </div>
            </div>
            {/* Dashed Divider */}
            <div
              className={`border-t border-dashed ${
                isDark ? "border-[#7B7B7B]" : "border-gray-400"
              } mb-4`}
            />
            {/* From / To Labels Row */}
            <div className="flex items-center justify-between mb-2">
              <div
                className={`${
                  isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-sm sm:text-base font-medium`}
              >
                From
              </div>
              <div
                className={`${
                  isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-sm sm:text-base font-medium`}
              >
                To
              </div>
            </div>
            {/* From / To Content Row */}
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mt-2">
              {/* From: Direct, USDT */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="min-w-0">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold break-words`}
                  >
                    Direct
                  </div>
                  <div
                    className={`${
                      isDark ? "text-[#7B7B7B]" : "text-gray-600"
                    } text-xs sm:text-sm font-mono break-all`}
                  >
                    {data.currency || data.wallet_type || "USDT"}
                  </div>
                </div>
              </div>
              {/* To: USDT, wallet address */}
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                <div className="text-right min-w-0">
                  <div
                    className={`${
                      isDark ? "text-white" : "text-gray-900"
                    } text-sm sm:text-base font-semibold break-words`}
                  >
                    {data.currency || data.wallet_type || "USDT"}
                  </div>
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <span
                      className={`${
                        isDark ? "text-[#7B7B7B]" : "text-gray-600"
                      } text-xs sm:text-sm font-mono break-all`}
                    >
                      {data.walletAddress || "—"}
                    </span>
                    {data.walletAddress && (
                      <CopyButton
                        value={data.walletAddress}
                        className="flex-shrink-0 text-[#FFA200] hover:text-[#FFB833] transition-colors"
                        showIcon={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Amount, Network, Submitted */}
            <div
              className={`mt-6 pt-6 border-t ${
                isDark ? "border-[#35353E]" : "border-gray-200"
              }`}
            >
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div
                  className={`text-xs ${
                    isDark ? "text-[#788099]" : "text-gray-500"
                  }`}
                >
                  Amount
                </div>
                <div
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {data.amount} {data.currency || "USDT"}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs ${
                    isDark ? "text-[#788099]" : "text-gray-500"
                  }`}
                >
                  Network
                </div>
                <div
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {data.network || "—"}
                </div>
              </div>
              <div className="col-span-2">
                <div
                  className={`text-xs ${
                    isDark ? "text-[#788099]" : "text-gray-500"
                  }`}
                >
                  Submitted
                </div>
                <div
                  className={`text-sm ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatDate(data.timestamp)}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/p2p"
          className="block w-full text-center py-3 rounded-2xl bg-[#1D8751] text-white font-semibold hover:bg-[#166b3e] transition-colors"
        >
          Back to P2P Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function P2PDepositStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader size="lg" color="#1D8751" />
        </div>
      }
    >
      <P2PDepositStatusContent />
    </Suspense>
  );
}
