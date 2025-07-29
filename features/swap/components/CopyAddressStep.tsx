import React, { useEffect, useState } from "react";
import { CreateSwapResponse } from "../types";
import { connectSwapStatusWebSocket } from "./websocket";
import { API_CONFIG } from "@/lib/appConfig";
import SwapStatusComponent from "./SwapStatus";

interface CopyAddressStepProps {
  swapResponse: CreateSwapResponse | null;
  copyMessage: string;
  onCopyAddress: () => void;
  onBack: () => void;
  onNext: () => void;
}

// Status mapping for stepper
const statusSteps = [
  { key: "pending", label: "Awaiting Deposit" },
  { key: "confirming", label: "Confirming" },
  { key: "exchanging", label: "Exchanging" },
  { key: "sending", label: "Sending to you" },
  { key: "finished", label: "Completed" },
];

const CopyAddressStep: React.FC<CopyAddressStepProps> = ({
  swapResponse,
  copyMessage,
  onCopyAddress,
  onBack,
  onNext,
}) => {
  const [status, setStatus] = useState<string>("pending");
  const [statusObj, setStatusObj] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Map backend status to stepper status for the stepper UI (case-insensitive)
  function mapBackendStatusToStepperStatus(status: string) {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "waiting") return "pending";
    if (s === "confirming") return "confirming";
    if (s === "exchanging") return "exchanging";
    if (s === "sending") return "sending";
    if (s === "finished") return "finished";
    return s;
  }

  useEffect(() => {
    if (!swapResponse?.id) return;
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let closedByUser = false;
    const wsUrl = API_CONFIG.SWAP.SWAP_STATUS_WS(swapResponse.id);
    console.log("WebSocket URL (actual):", wsUrl);

    function connect() {
      if (!swapResponse?.id) return; // Ensure swapResponse is not null
      ws = connectSwapStatusWebSocket(swapResponse.id, {
        onOpen: (event: Event) => {
          console.log("WebSocket connection opened", event);
          setWsConnected(true);
          setReconnectAttempts(0); // Reset on successful connect
        },
        onClose: (event: CloseEvent) => {
          console.log(
            "WebSocket closed",
            event,
            "code:",
            event.code,
            "reason:",
            event.reason
          );
          setWsConnected(false);
          if (
            !closedByUser &&
            event.code !== 1000 &&
            reconnectAttempts < maxReconnectAttempts
          ) {
            // Abnormal closure, try to reconnect
            const nextAttempt = reconnectAttempts + 1;
            setReconnectAttempts(nextAttempt);
            console.log(
              `Attempting to reconnect WebSocket (#${nextAttempt}) in ${
                reconnectDelay / 1000
              }s...`
            );
            reconnectTimeout = setTimeout(connect, reconnectDelay);
          }
        },
        onError: (event: Event) => {
          console.log("WebSocket error", event);
          setWsConnected(false);
        },
        onMessage: (event: MessageEvent) => {
          console.log(status);

          console.log("WebSocket message received:", event.data);
          try {
            const msg = JSON.parse(event.data);
            const sts = msg.data.status;
            console.log("new data check", sts, msg);

            if (msg.type === "status_update" && msg.data) {
              const backendStatus = msg.data.status;
              const stepperStatus =
                mapBackendStatusToStepperStatus(backendStatus);
              setStatus(stepperStatus);
              setStatusObj(msg.data);
              if (stepperStatus === "finished") {
                onNext();
              }
            }
          } catch (e) {
            console.error("Failed to parse WebSocket message", e, event.data);
          }
        },
      });
    }

    connect();

    return () => {
      closedByUser = true;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [swapResponse && swapResponse.id, reconnectAttempts]);

  if (!swapResponse?.payinAddress) return null;

  // Always map the status before using it in the stepper
  const mappedStatus = mapBackendStatusToStepperStatus(status);
  const currentStepIndex = statusSteps.findIndex((s) => s.key === mappedStatus);
  console.log(
    "status:",
    status,
    "mappedStatus:",
    mappedStatus,
    "currentStepIndex:",
    currentStepIndex
  );

  // If status is finished, show the SwapStatusComponent with real data
  if (mappedStatus === "finished") {
    return (
      <SwapStatusComponent
        transactionId={statusObj?.id || ""}
        date={statusObj?.updatedAt || statusObj?.createdAt || ""}
        paidAmount={statusObj?.expectedAmountFrom || ""}
        paidCurrency={statusObj?.fromCurrency || ""}
        receivedAmount={statusObj?.expectedAmountTo || ""}
        receivedCurrency={statusObj?.toCurrency || ""}
        payinMethod={statusObj?.fromNetwork || ""}
        payoutMethod={statusObj?.toNetwork || ""}
        transactionHash={statusObj?.payinHash || statusObj?.payoutHash || ""}
        netAmount={statusObj?.amountTo || statusObj?.expectedAmountTo || ""}
      />
    );
  }

  return (
    <div className=" min-h-screen bg-[#1D1D23] flex flex-col items-center py-8 w-full">
      {/* Top Card */}
      <div className="flex flex-col md:flex-row justify-between items-stretch bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-3 shadow-lg w-full max-w-4xl mb-4 min-h-[180px]">
        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
          <div>
            <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
              Amount:
            </div>
            <div className="text-white text-base font-semibold mb-1">
              {swapResponse.fromAmount} {swapResponse.fromCurrency}
            </div>
            <div className="mt-4">
              <div className="text-[#7B7B7B] text-xs font-semibold mb-1">
                To this address:
              </div>

    <div className="mb-8">
      <div className="mb-2 text-base font-semibold">2- Copy Address</div>
      <div className="dark:bg-[#23232b] bg-[#F5F5F5] border dark:border-[#35353E] border-gray-300 rounded-xl p-5 mb-2">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Send Payment To</h3>
            <p className="text-sm dark:text-[#8C8CA1] text-[#788099] mb-4">
              Please copy the address below and send your payment to complete
              the swap
            </p>
          </div>
          <div className="text-xs dark:text-[#8C8CA1] text-[#788099] mb-2">
            Payment Address:
          </div>
          <div className="flex items-center gap-2">
            <div className="dark:bg-[#181820] bg-white w-full border border-[#1D8751] rounded-[18px] p-2">
              <div className="flex items-center gap-2">
                <span className="text-[#1D8751] font-mono text-base truncate">
                  {swapResponse.payinAddress}
                </span>
                <button
                  className="bg-[#1D8751] hover:bg-[#16663d] p-2 rounded-lg text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  onClick={onCopyAddress}
                  title="Copy Address"
                >
                  {copyMessage ? (
                    <span className="text-xs font-medium">{copyMessage}</span>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
                {/* WebSocket status indicator */}
                <span className="ml-2 flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      wsConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span className="text-xs text-[#8C8CA1]">
                    {wsConnected ? "Connected" : "Disconnected"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-0 md:ml-6 flex items-center justify-center py-2">
          {/* QR code */}
          <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${swapResponse.payinAddress}`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-3">
        {statusSteps.map((step, idx) => (
          <div
            key={step.key}
            className="flex flex-col items-center flex-1 relative"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${
                idx === currentStepIndex
                  ? "bg-yellow-400 border-yellow-200"
                  : "bg-gray-800 border-gray-700"
              }`}
            >
              {/* Icon for each step */}
              {idx === currentStepIndex ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#facc15" // Tailwind yellow-400
                    strokeWidth="2"
                  />
                  <path
                    d="M12 8v4l2 2"
                    stroke="#facc15" // Tailwind yellow-400
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#7B7B7B"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#7B7B7B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className={`font-semibold text-base ${
                idx === currentStepIndex ? "text-yellow-400" : "text-[#7B7B7B]"
              }`}
            >
              {step.label}
            </span>
            {idx === currentStepIndex && (
              <div className="flex gap-1 mt-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
                <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
                <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transaction Details Card */}
      <div className="bg-[#23232B] border-2 border-[#35353E] rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-3">
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
              {swapResponse.id}
            </span>
            <button
              className="ml-2 bg-[#FFA200] hover:bg-[#FF9500] p-1 rounded transition"
              onClick={() => navigator.clipboard.writeText(swapResponse.id)}
              title="Copy Transaction ID"
            >
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
            </button>
          </div>
        </div>
        {/* Dashed Divider */}
        <div className="border-t border-dashed border-[#7B7B7B] mb-4"></div>
        {/* You Get and Recipient Wallet */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[#7B7B7B] text-base font-medium">You Get</div>
          <div className="text-[#7B7B7B] text-base font-medium">
            Recipient Wallet
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-white text-base font-mono font-semibold">
            {swapResponse.toAmount} {swapResponse.toCurrency}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#7B7B7B] text-sm font-mono">
              {swapResponse.payoutAddress}
            </span>
            <button
              className="ml-2 bg-[#FFA200] hover:bg-[#FF9500] p-1 rounded transition"
              onClick={() =>
                navigator.clipboard.writeText(swapResponse.payoutAddress)
              }
              title="Copy Recipient Wallet"
            >
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
            </button>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Summary - always at the very bottom */}

      <div className="flex items-center mb-2 mt-2 max-w-4xl">
        <img
          src="https://res.cloudinary.com/pitz/image/upload/v1752248844/Frame_34947_hxlr7o.png"
          alt=""
        />
      </div>
        <div className="flex mt-6 gap-5 justify-between">
          <button
            className="dark:bg-[#35353E] bg-gray-300 w-full hover:dark:bg-[#45454E] hover:bg-gray-400 dark:text-white text-[#0D0D0D] px-6 py-2 rounded-[24px] font-semibold transition"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="bg-[#1D8751] w-full hover:bg-[#16663d] text-white px-6 py-2 rounded-[24px] font-semibold transition"
            onClick={onNext}
          >
            I've Sent Payment
          </button>
        </div>
      </div>

      {/* Navigation buttons */}
    </div>
  );
};

export default CopyAddressStep;
