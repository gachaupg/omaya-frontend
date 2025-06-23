/**
 * SwapStatus.tsx – Swap status tracking component
 */
"use client";
import React, { useEffect, useState } from "react";
import { SwapStatus, CreateSwapResponse } from "../types";
import { getSwapStatus } from "../api";

interface SwapStatusProps {
  swapId: string;
  swapResponse?: CreateSwapResponse;
  onBack: () => void;
}

const SwapStatusComponent: React.FC<SwapStatusProps> = ({
  swapId,
  swapResponse,
  onBack,
}) => {
  const [status, setStatus] = useState<SwapStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log("SwapStatusComponent received:", { swapId, swapResponse });
  }, [swapId, swapResponse]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusData = await getSwapStatus(swapId);
        setStatus(statusData);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch status");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      if (status?.status !== "finished" && status?.status !== "failed") {
        fetchStatus();
      }
    }, 30000);

    // Set up timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [swapId, status?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "confirming":
        return "text-blue-500";
      case "exchanging":
        return "text-purple-500";
      case "finished":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        );
      case "confirming":
        return (
          <div className="animate-pulse">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "exchanging":
        return (
          <div className="animate-bounce">
            <svg
              className="w-8 h-8 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </div>
        );
      case "finished":
        return (
          <div className="animate-pulse">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "failed":
        return (
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        );
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting for confirmation...";
      case "confirming":
        return "Confirming transaction...";
      case "exchanging":
        return "Exchanging currencies...";
      case "finished":
        return "Swap completed successfully!";
      case "failed":
        return "Swap failed";
      default:
        return "Processing...";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181820] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#181820] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <button
            onClick={onBack}
            className="bg-[#1D8751] text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181820] w-full">
      <div className="w-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-[#8C8CA1] hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Swap
          </button>
          <div className="text-sm text-[#8C8CA1]">
            Time elapsed: {formatTime(timeElapsed)}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-[#23232b] border border-[#35353E] rounded-2xl p-6 md:p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Swap Progress
            </h2>
            <p className="text-[#8C8CA1]">
              Track your swap transaction progress
            </p>
          </div>

          {/* Step Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6 px-4 md:px-8">
              {/* Step 1: Swap Created */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 ${
                    status?.status
                      ? "bg-[#1D8751] text-white"
                      : "bg-[#35353E] text-[#8C8CA1]"
                  }`}
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs text-center ${
                    status?.status ? "text-[#1D8751]" : "text-[#8C8CA1]"
                  }`}
                >
                  Swap Created
                </span>
              </div>

              {/* Connector Line 1 */}
              <div
                className={`flex-1 h-0.5 mx-2 md:mx-4 ${
                  status?.status && status.status !== "pending"
                    ? "bg-[#1D8751]"
                    : "bg-[#35353E]"
                }`}
              ></div>

              {/* Step 2: Payment Sent */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 ${
                    status?.status && status.status !== "pending"
                      ? "bg-[#1D8751] text-white"
                      : "bg-[#35353E] text-[#8C8CA1]"
                  }`}
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs text-center ${
                    status?.status && status.status !== "pending"
                      ? "text-[#1D8751]"
                      : "text-[#8C8CA1]"
                  }`}
                >
                  Payment Sent
                </span>
              </div>

              {/* Connector Line 2 */}
              <div
                className={`flex-1 h-0.5 mx-2 md:mx-4 ${
                  status?.status &&
                  (status.status === "confirming" ||
                    status.status === "exchanging" ||
                    status.status === "finished")
                    ? "bg-[#1D8751]"
                    : "bg-[#35353E]"
                }`}
              ></div>

              {/* Step 3: Processing */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 ${
                    status?.status &&
                    (status.status === "confirming" ||
                      status.status === "exchanging")
                      ? "bg-[#1D8751] text-white"
                      : status?.status && status.status === "finished"
                      ? "bg-[#1D8751] text-white"
                      : "bg-[#35353E] text-[#8C8CA1]"
                  }`}
                >
                  {status?.status &&
                  (status.status === "confirming" ||
                    status.status === "exchanging") ? (
                    <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-xs text-center ${
                    status?.status &&
                    (status.status === "confirming" ||
                      status.status === "exchanging" ||
                      status.status === "finished")
                      ? "text-[#1D8751]"
                      : "text-[#8C8CA1]"
                  }`}
                >
                  Processing
                </span>
              </div>

              {/* Connector Line 3 */}
              <div
                className={`flex-1 h-0.5 mx-2 md:mx-4 ${
                  status?.status === "finished"
                    ? "bg-[#1D8751]"
                    : "bg-[#35353E]"
                }`}
              ></div>

              {/* Step 4: Completed */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 ${
                    status?.status === "finished"
                      ? "bg-[#1D8751] text-white"
                      : "bg-[#35353E] text-[#8C8CA1]"
                  }`}
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs text-center ${
                    status?.status === "finished"
                      ? "text-[#1D8751]"
                      : "text-[#8C8CA1]"
                  }`}
                >
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Current Status Message */}
          <div className="text-center mb-6">
            <div
              className={`text-lg font-medium ${getStatusColor(
                status?.status || "pending"
              )}`}
            >
              {getStatusMessage(status?.status || "pending")}
            </div>
            <div className="text-sm text-[#8C8CA1] mt-1">
              {status?.status === "pending" &&
                "Waiting for payment confirmation..."}
              {status?.status === "confirming" &&
                "Confirming your payment on the blockchain..."}
              {status?.status === "exchanging" &&
                "Exchanging your currencies..."}
              {status?.status === "finished" &&
                "Your swap has been completed successfully!"}
              {status?.status === "failed" &&
                "Something went wrong with your swap"}
            </div>
          </div>

          {/* Swap Details */}
          {status && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#181820] rounded-lg p-4">
                  <div className="text-sm text-[#8C8CA1] mb-1">From</div>
                  <div className="text-white font-medium">
                    {swapResponse
                      ? `${swapResponse.fromAmount} ${swapResponse.fromCurrency}`
                      : `${status.from_amount} ${status.from_currency}`}
                  </div>
                  <div className="text-xs text-[#8C8CA1]">
                    {swapResponse
                      ? swapResponse.fromNetwork
                      : status.from_network}
                  </div>
                </div>
                <div className="bg-[#181820] rounded-lg p-4">
                  <div className="text-sm text-[#8C8CA1] mb-1">To</div>
                  <div className="text-white font-medium">
                    {swapResponse
                      ? `${swapResponse.toAmount} ${swapResponse.toCurrency}`
                      : `${status.to_amount} ${status.to_currency}`}
                  </div>
                  <div className="text-xs text-[#8C8CA1]">
                    {swapResponse ? swapResponse.toNetwork : status.to_network}
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-[#181820] rounded-lg p-4">
                <div className="text-sm text-[#8C8CA1] mb-3">
                  Transaction Details
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8C8CA1]">Swap ID:</span>
                    <span className="text-white font-mono">{status.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8CA1]">From Address:</span>
                    <span className="text-white font-mono truncate max-w-[200px]">
                      {swapResponse
                        ? swapResponse.payinAddress
                        : status.from_address}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8CA1]">To Address:</span>
                    <span className="text-white font-mono truncate max-w-[200px]">
                      {swapResponse
                        ? swapResponse.payoutAddress
                        : status.to_address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {status.status === "finished" && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-green-500 font-medium mb-2">
                    🎉 Swap Completed!
                  </div>
                  <div className="text-sm text-[#8C8CA1]">
                    Your{" "}
                    {swapResponse
                      ? swapResponse.fromCurrency
                      : status.from_currency}{" "}
                    has been successfully exchanged for{" "}
                    {swapResponse
                      ? swapResponse.toCurrency
                      : status.to_currency}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {status.status === "failed" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="text-red-500 font-medium mb-2">
                    ❌ Swap Failed
                  </div>
                  <div className="text-sm text-[#8C8CA1]">
                    Please contact support if you believe this is an error
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapStatusComponent;
