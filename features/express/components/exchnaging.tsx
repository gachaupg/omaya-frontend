import React, { useEffect, useState } from "react";
import SuccessPage from "./success";
import {
  useTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "../websockets";

interface ExchangingProps {
  transactionData?: {
    type: "deposit" | "withdrawal";
    amount: number;
    asset: any;
    paymentDetail?: any;
    paymentDetails?: any[];
    walletAddress: string;
    network: any;
    transactionId?: string;
    // Additional deposit-specific fields
    depositCode?: string;
    totalAmountDue?: string;
    commission?: string;
    networkFee?: string;
    currency?: string;
    websocketUrl?: string;
  };
}

export default function Exchanging({ transactionData }: ExchangingProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [persistedTransactionData, setPersistedTransactionData] =
    useState<any>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  // Check for persisted transaction data on component mount
  useEffect(() => {
    const stored = localStorage.getItem("express_transaction_data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPersistedTransactionData(parsed);
        console.log("Found persisted transaction data:", parsed);
      } catch (error) {
        console.error("Error parsing stored transaction data:", error);
        localStorage.removeItem("express_transaction_data");
      }
    }
  }, []);

  // Use persisted data if no transactionData is provided (page reload scenario)
  const effectiveTransactionData = transactionData || persistedTransactionData;

  // Store transaction data in localStorage when it's provided
  useEffect(() => {
    if (transactionData && transactionData.transactionId) {
      localStorage.setItem(
        "express_transaction_data",
        JSON.stringify(transactionData)
      );
      console.log("Stored transaction data in localStorage:", transactionData);
    }
  }, [transactionData]);

  // Clear localStorage when transaction is completed
  useEffect(() => {
    if (showSuccess) {
      localStorage.removeItem("express_transaction_data");
      console.log(
        "Cleared transaction data from localStorage - transaction completed"
      );
    }
  }, [showSuccess]);

  // Use WebSocket for both deposit and withdrawal transactions
  const shouldUseWebSocket =
    effectiveTransactionData?.transactionId &&
    (effectiveTransactionData?.type === "withdrawal" ||
      effectiveTransactionData?.type === "deposit");

  // WebSocket hook for both deposit and withdrawal transactions
  console.log("DEBUG: transactionData received:", effectiveTransactionData);
  console.log(
    "DEBUG: transactionId being passed to WebSocket:",
    effectiveTransactionData?.transactionId
  );
  console.log("DEBUG: transaction type:", effectiveTransactionData?.type);

  const { isConnected, lastMessage } = useTransactionStatusWebSocket(
    effectiveTransactionData?.transactionId || "",
    effectiveTransactionData?.type || "withdrawal",
    {
      onMessage: (data: TransactionStatusMessage) => {
        console.log("Transaction status update:", data);

        // Clear any WebSocket errors when we receive a message
        setWsError(null);
        setConnectionAttempts(0); // Reset connection attempts on successful message

        // Handle the new message structure
        const status = data.data?.status || data.status;

        // Process statuses for both deposit and withdrawal
        const validStatuses = [
          "pending",
          "processing",
          "completed",
          "failed",
          "awaiting_payment",
          "exchanging",
          "sending",
        ];

        if (status && validStatuses.includes(status)) {
          setCurrentStatus(status);

          // Auto-navigate to success page when transaction is completed
          if (status === "completed" || status === "confirmed") {
            setShowSuccess(true);
            // Auto-redirect after 1 second
            setTimeout(() => {
              // You can redirect to dashboard or another page here
              window.location.href = "/dashboard";
            }, 1000);
          }
        } else {
          console.log(
            "Bypassing status:",
            status,
            "- not in valid statuses list"
          );
        }
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
        console.error("WebSocket error details:", {
          type: error.type,
          target: error.target,
          isTrusted: error.isTrusted,
          timeStamp: error.timeStamp,
        });

        // Increment connection attempts
        setConnectionAttempts((prev) => prev + 1);

        // Only show error in UI after multiple attempts
        // This prevents showing errors for initial connection attempts
        if (!isConnected && connectionAttempts > 2) {
          setWsError(
            `WebSocket connection error (attempt ${connectionAttempts}). Trying to reconnect...`
          );

          // Clear error after 5 seconds
          setTimeout(() => setWsError(null), 5000);
        }

        // Don't crash the component on WebSocket errors
        // Just log them and continue
      },
      autoReconnect: true,
    }
  );

  // Debug logging
  useEffect(() => {
    if (shouldUseWebSocket) {
      console.log(
        "WebSocket enabled for transaction:",
        effectiveTransactionData?.transactionId
      );
      console.log(
        "Transaction ID source:",
        effectiveTransactionData?.transactionId ? "provided" : "missing"
      );
      console.log("Current status:", currentStatus);
      console.log("WebSocket connected:", isConnected);
    }
  }, [
    shouldUseWebSocket,
    effectiveTransactionData?.transactionId,
    currentStatus,
    isConnected,
  ]);

  // If showing success page, render it
  if (showSuccess) {
    return <SuccessPage />;
  }

  // If no transaction data available (not from form submission or localStorage), show loading or redirect
  if (!effectiveTransactionData) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center pt-2">
        <div className="text-white text-lg">Loading transaction data...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen  flex flex-col items-center pt-2 ">
      {/* Top Card */}
      <div className="flex flex-col md:flex-row justify-between items-stretch bg-[#FFFFFF] dark:bg-[#23232B]  border-2 border:[#E8EFF5] dark:border-[#35353E] rounded-2xl p-4 shadow-lg w-full max-w-4xl mb-4 min-h-[180px]">
        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
          <div>
            <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
              Amount:
            </div>
            <div className="text-white text-base font-semibold mb-1">
              {effectiveTransactionData?.amount || 0}{" "}
              {effectiveTransactionData?.asset?.symbol || "USDT"}
            </div>
            {effectiveTransactionData?.type === "deposit" &&
              effectiveTransactionData?.paymentDetail && (
                <>
                  <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                    Bank:
                  </div>
                  <div className="flex items-center mb-1">
                    <img
                      src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                      alt={effectiveTransactionData.paymentDetail.provider_name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-white text-sm font-semibold">
                      {effectiveTransactionData.paymentDetail.provider_name}
                    </span>
                  </div>
                  <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                    Account Name:
                  </div>
                  <div className="text-white text-sm mb-1">
                    {effectiveTransactionData.paymentDetail.account_name}
                  </div>
                  <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                    Account Number:
                  </div>
                  <div className="text-white text-sm font-mono">
                    {effectiveTransactionData.paymentDetail.account_number}
                  </div>
                </>
              )}
            {effectiveTransactionData?.type === "withdrawal" && (
              <>
                <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                  Wallet Address:
                </div>
                <div className="text-white text-sm font-mono break-all">
                  {effectiveTransactionData.walletAddress}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-0 md:ml-6 flex items-center justify-center py-2">
          {/* QR code */}
          <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${
                effectiveTransactionData?.type === "deposit" &&
                effectiveTransactionData?.paymentDetail
                  ? effectiveTransactionData.paymentDetail.account_number
                  : effectiveTransactionData?.walletAddress || ""
              }`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

      {/* WebSocket Connection Status */}

      {/* Stepper */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-4 relative">
        {/* Connecting Lines */}
        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-[#7B7B7B] z-0"></div>

        {/* Step 1: Awaiting Deposit */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "pending" || !shouldUseWebSocket
                ? "bg-[#FF9500] border-[#FF95001A]"
                : "bg-[#23232B] border-[#35353E]"
            }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={
                  currentStatus === "pending" || !shouldUseWebSocket
                    ? "#fff"
                    : "#7B7B7B"
                }
                strokeWidth="2"
              />
              <path
                d="M12 8v4l2 2"
                stroke={
                  currentStatus === "pending" || !shouldUseWebSocket
                    ? "#fff"
                    : "#7B7B7B"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${
                currentStatus === "pending" || !shouldUseWebSocket
                  ? "text-[#FF9500]"
                  : "text-[#7B7B7B]"
              }`}
            >
              Awaiting Deposit
            </span>
            {(currentStatus === "pending" || !shouldUseWebSocket) && (
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            )}
          </div>
        </div>
        {/* Step 2: Confirming */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "confirming"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : "bg-[#23232B] border-[#35353E]"
            }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "confirming" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke={currentStatus === "confirming" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${
                currentStatus === "confirming"
                  ? "text-[#FF9500]"
                  : "text-[#7B7B7B]"
              }`}
            >
              Confirming
            </span>
            {currentStatus === "confirming" && (
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            )}
          </div>
        </div>
        {/* Step 3: Exchanging */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "exchanging"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : "bg-[#23232B] border-[#35353E]"
            }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "exchanging" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M8 12h8M12 8v8"
                stroke={currentStatus === "exchanging" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${
                currentStatus === "exchanging"
                  ? "text-[#FF9500]"
                  : "text-[#7B7B7B]"
              }`}
            >
              Exchanging
            </span>
            {currentStatus === "exchanging" && (
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            )}
          </div>
        </div>
        {/* Step 4: Sending to you */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
              currentStatus === "sending"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : "bg-[#23232B] border-[#35353E]"
            }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "sending" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M8 12h8M16 12l-4 4m4-4l-4-4"
                stroke={currentStatus === "sending" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${
                currentStatus === "sending"
                  ? "text-[#FF9500]"
                  : "text-[#7B7B7B]"
              }`}
            >
              Sending to you
            </span>
            {currentStatus === "sending" && (
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-[#FF9500] rounded-full inline-block animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className="bg-[#23232B] border-2 border-[#35353E] rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-4">
        {/* Title */}
        <div className="text-white text-2xl font-semibold mb-4">
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-[#7B7B7B] text-base font-medium">
            Transaction ID
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-base font-mono font-semibold">
              TXNWSU09E2DS
            </span>
            <span className="text-[#FFA200] cursor-pointer flex items-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="#FFA200"
                  strokeWidth="2"
                />
                <rect
                  x="3"
                  y="3"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="#FFA200"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </div>
        </div>
        {/* Dashed Divider */}
        <div className="border-t border-dashed border-[#7B7B7B] mb-4"></div>
        {/* From/To Labels Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[#7B7B7B] text-base font-medium">From</div>
          <div className="text-[#7B7B7B] text-base font-medium">To</div>
        </div>
        {/* From/To Content Row */}
        <div className="flex items-center justify-between mt-2">
          {/* From */}
          <div className="flex items-center gap-2">
            {effectiveTransactionData?.type === "deposit" &&
            effectiveTransactionData?.paymentDetail ? (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt={effectiveTransactionData.paymentDetail.provider_name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-white text-base font-semibold">
                    {effectiveTransactionData.paymentDetail.provider_name}
                  </div>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {effectiveTransactionData.paymentDetail.account_number}
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  alt={effectiveTransactionData?.asset?.symbol || "USDT"}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-white text-base font-semibold">
                    {effectiveTransactionData?.asset?.symbol || "USDT"}
                  </div>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {effectiveTransactionData?.walletAddress ||
                      "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* To */}
          <div className="flex items-center gap-2">
            {effectiveTransactionData?.type === "deposit" ? (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  alt={effectiveTransactionData?.asset?.symbol || "USDT"}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-right">
                  <div className="text-white text-base font-semibold inline-block align-middle">
                    {effectiveTransactionData?.asset?.symbol || "USDT"}
                  </div>
                  <span className="text-[#7B7B7B] text-base font-normal ml-1 align-middle">
                    {effectiveTransactionData?.asset?.description ||
                      "Tether US"}
                  </span>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {effectiveTransactionData?.walletAddress ||
                      "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt="Bank"
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-right">
                  <div className="text-white text-base font-semibold inline-block align-middle">
                    Bank Transfer
                  </div>
                  <span className="text-[#7B7B7B] text-base font-normal ml-1 align-middle">
                    To your account
                  </span>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {effectiveTransactionData?.paymentDetails?.[0]
                      ?.account_number || "Account Number"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Status Display (for withdrawal transactions) */}
      {/* {shouldUseWebSocket && lastMessage && (
        <div className="w-full max-w-3xl mb-4">
          <div className="bg-[#23232B] border border-[#1D8751] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#1D8751] font-semibold text-base">
                Live Status
              </span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  (lastMessage.data?.status || lastMessage.status) ===
                  "completed"
                    ? "bg-green-500/20 text-green-400"
                    : (lastMessage.data?.status || lastMessage.status) ===
                      "failed"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {(
                  lastMessage.data?.status || lastMessage.status
                )?.toUpperCase() || "PENDING"}
              </span>
            </div>
            {lastMessage.data?.confirmations && (
              <div className="text-[#7B7B7B] text-sm mb-1">
                Confirmations: {lastMessage.data.confirmations}
              </div>
            )}
            {lastMessage.data?.block_number && (
              <div className="text-[#7B7B7B] text-sm mb-1">
                Block: {lastMessage.data.block_number}
              </div>
            )}
            {lastMessage.data?.timestamp && (
              <div className="text-[#7B7B7B] text-sm">
                Updated: {new Date(lastMessage.data.timestamp).toLocaleString()}
              </div>
            )}
            {lastMessage.data?.error && (
              <div className="text-red-400 text-sm mt-2">
                Error: {lastMessage.data.error}
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* Terms and Conditions Summary Bar */}
      <div className="w-full max-w-4xl rounded-2xl flex ">
        {/* Faded clock icon */}
        <img
          src="https://res.cloudinary.com/pitz/image/upload/v1752248844/Frame_34947_hxlr7o.png"
          alt=""
        />
      </div>
    </div>
  );
}
