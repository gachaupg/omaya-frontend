import React, { useEffect, useState } from "react";
import { CreateSwapResponse } from "../types";
import { connectSwapStatusWebSocket } from "./websocket";
import { API_CONFIG } from "@/lib/appConfig";
import SwapStatusComponent from "./SwapStatus";
import { Copy } from "lucide-react";

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

const StatusIcons = {
  pending: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#ffffff"
        strokeWidth="2"
        className="z-10"
      />
      <path
        d="M12 8v4l2 2"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  confirming: (
    <svg xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#ffffff" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  exchanging: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-up-icon lucide-arrow-down-up">
      <path d="m3 16 4 4 4-4"/>
      <path d="M7 20V4"/>
      <path d="m21 8-4-4-4 4"/>
      <path d="M17 4v16"/>
    </svg>
  ),
  sending: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-right-icon lucide-arrow-left-right">
      <path d="M8 3 4 7l4 4"/>
      <path d="M4 7h16"/>
      <path d="m16 21 4-4-4-4"/>
      <path d="M20 17H4"/>
    </svg>
  ),
  finished: (
    <svg xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#ffffff" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  )
};

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
            const sts = msg.data?.status;
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
    <div className="min-h-screen dark:bg-[#1D1D23] bg-white flex flex-col items-center py-8 w-full">
      {/* Top Card */}
      <div className="flex flex-col md:flex-row justify-between items-stretch dark:bg-[#1D1D23] bg-white dark:border-[#35353E] border-gray-200 border-2 rounded-2xl p-3 shadow-lg w-full max-w-4xl mb-4 min-h-[180px]">
        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
          <div>
            <div className="dark:text-[#7B7B7B] text-gray-600 text-xs font-semibold mb-0.5">
              Amount:
            </div>
            <div className="dark:text-white text-gray-900 text-base font-semibold mb-1">
              {swapResponse.fromAmount} {swapResponse.fromCurrency}
            </div>
            <div className="mt-4">
              <div className="dark:text-[#7B7B7B] text-gray-600 text-xs font-semibold mb-1">
                To this address:
              </div>
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
                  <span className="text-xs dark:text-[#8C8CA1] text-gray-600">
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
        {statusSteps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;
          
          return (
            <div
              key={step.key}
              className="flex flex-col items-center flex-1 relative"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 b p-1 ${
                  isActive
                    ? "bg-[#F79330] dark:bg-[#F79330]"
                    : isCompleted
                    ? "bg-[#1D8751] dark:bg-[#1D8751] border-green-200"
                    : "dark:bg-[#7B7B7B] bg-gray-300  border-gray-400"
                }`}
              >
                {/* Always show the step's icon, colored appropriately */}
                <span className={isActive ? "text-white" : isCompleted ? "text-white" : "text-white"}>
                  {StatusIcons[step.key as keyof typeof StatusIcons]}
                </span>
              </div>
              <span
                className={`font-semibold text-base ${
                  isActive
                    ? "text-[#F79330]"
                    : isCompleted
                    ? "text-[#1D8751]"
                    : "dark:text-[#7B7B7B] text-gray-600"
                }`}
              >
                {step.label}
              </span>
              {isActive && (
                <div className="flex gap-1 mt-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transaction Details Card */}
      <div className="dark:bg-[#23232B] bg-white dark:border-[#35353E] border-gray-200 border-2 rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-3">
        {/* Title */}
        <div className="dark:text-white text-gray-900 text-2xl font-semibold mb-4">
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex items-center justify-between mb-1">
          <div className="dark:text-[#7B7B7B] text-gray-600 text-base font-medium">
            Transaction ID
          </div>
          <div className="flex items-center gap-2">
            <span className="dark:text-white text-gray-900 text-base font-mono font-semibold">
              {swapResponse.id}
            </span>
            <button
              className="ml-2 p-1 rounded transition"
              onClick={() => navigator.clipboard.writeText(swapResponse.id)}
              title="Copy Transaction ID"
            >
            <Copy className="w-4 h-4 text-[#F79330]" />
            </button>
          </div>
        </div>
        {/* Dashed Divider */}
        <div className="border-t border-dashed dark:border-[#7B7B7B] border-gray-400 mb-4"></div>
        {/* You Get and Recipient Wallet */}
        <div className="flex items-center justify-between mb-2">
          <div className="dark:text-[#7B7B7B] text-gray-600 text-base font-medium">
            You Get
          </div>
          <div className="dark:text-[#7B7B7B] text-gray-600 text-base font-medium">
            Recipient Wallet
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="dark:text-white text-gray-900 text-base font-mono font-semibold">
            {swapResponse.toAmount} {swapResponse.toCurrency}
          </div>
          <div className="flex items-center gap-2">
            <span className="dark:text-[#7B7B7B] text-gray-600 text-sm font-mono">
              {swapResponse.payoutAddress}
            </span>
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
    </div>
  );
};

export default CopyAddressStep;
