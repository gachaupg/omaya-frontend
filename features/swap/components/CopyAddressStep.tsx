import React, { useEffect, useState } from "react";
import { CreateSwapResponse } from "../types";
import { connectSwapStatusWebSocket } from "./websocket";
import { API_CONFIG } from "@/lib/appConfig";
import SuccessPage from "./success";
import { Copy } from "lucide-react";

import { logger } from '@/lib/utils/logger';

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
    if (s === "completed") return "completed"; // Keep completed as completed
    return s;
  }

  useEffect(() => {
    if (!swapResponse?.id) return;
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let closedByUser = false;
    const wsUrl = API_CONFIG.SWAP.SWAP_STATUS_WS(swapResponse.id);
    logger.debug('swap', "WebSocket URL (actual):", wsUrl);

    function connect() {
      if (!swapResponse?.id) return; // Ensure swapResponse is not null
      ws = connectSwapStatusWebSocket(swapResponse.id, {
        onOpen: (event: Event) => {
          logger.debug('swap', "WebSocket connection opened", event);
          setWsConnected(true);
          setReconnectAttempts(0); // Reset on successful connect
        },
        onClose: (event: CloseEvent) => {
          logger.debug('swap', 
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
            logger.debug('swap', 
              `Attempting to reconnect WebSocket (#${nextAttempt}) in ${
                reconnectDelay / 1000
              }s...`
            );
            reconnectTimeout = setTimeout(connect, reconnectDelay);
          }
        },
        onError: (event: Event) => {
          logger.debug('swap', "WebSocket error", event);
          setWsConnected(false);
        },
        onMessage: (event: MessageEvent) => {
          logger.debug('swap', status);

          logger.debug('swap', "WebSocket message received:", event.data);
          try {
            const msg = JSON.parse(event.data);
            const sts = msg.data?.status;
            logger.debug('swap', "new data check", sts, msg);

            if (msg.type === "status_update" && msg.data) {
              const backendStatus = msg.data.status;
              const stepperStatus =
                mapBackendStatusToStepperStatus(backendStatus);
              setStatus(stepperStatus);
              setStatusObj(msg.data);
              
              // Auto-navigate to success page when status is completed
              if (backendStatus === "completed") {
                logger.debug('swap', "✅ Swap completed, automatically showing success page");
                logger.debug('swap', "Status changed to completed, triggering success page");
                // Keep the status as "completed" to trigger success page
                setStatus("completed");
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
  logger.debug('swap', 
    "status:",
    status,
    "mappedStatus:",
    mappedStatus,
    "currentStepIndex:",
    currentStepIndex
  );

  // If status is completed, show the SuccessPage with real data
  if (mappedStatus === "completed" || mappedStatus === "finished") {
    logger.debug('swap', "🎉 Rendering success page for status:", mappedStatus);
    return (
      <SuccessPage
        transactionId={statusObj?.swap_id || statusObj?.id || swapResponse?.id || ""}
        date={new Date().toLocaleString()}
        paidAmount={statusObj?.amount_from || swapResponse?.fromAmount || statusObj?.expectedAmountFrom || ""}
        paidCurrency={statusObj?.from_currency || swapResponse?.fromCurrency || statusObj?.fromCurrency || ""}
        receivedAmount={statusObj?.amount_to || swapResponse?.toAmount || statusObj?.expectedAmountTo || ""}
        receivedCurrency={statusObj?.to_currency || swapResponse?.toCurrency || statusObj?.toCurrency || ""}
        payinMethod={statusObj?.from_currency || swapResponse?.fromNetwork || statusObj?.fromNetwork || ""}
        payoutMethod={statusObj?.to_currency || swapResponse?.toNetwork || statusObj?.toNetwork || ""}
        transactionHash={statusObj?.payout_hash || statusObj?.payin_hash || statusObj?.payinHash || statusObj?.payoutHash || ""}
        netAmount={statusObj?.amount_to || statusObj?.net_amount || swapResponse?.toAmount || statusObj?.expectedAmountTo || ""}
        websocketData={{
          type: "status_update",
          data: statusObj
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-2 sm:py-4 md:py-8 w-full pr-2 sm:pr-0">
      {/* Top Card */}
      <div className="flex flex-col md:flex-row justify-between items-stretch bg-white dark:bg-[var(--card-color)] border-2 border-gray-200 dark:border-[#35353E] rounded-2xl p-2 sm:p-3 md:p-4 shadow-lg w-full sm:max-w-4xl mb-2 sm:mb-4 min-h-[160px] sm:min-h-[180px]">
        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
                      <div>
              <div className="text-gray-600 dark:text-[#7e7e8f] text-xs font-semibold mb-0.5">
                Amount:
              </div>
              <div className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold mb-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <span>{statusObj?.amount_from || swapResponse.fromAmount}</span>
                <span className='uppercase sm:ml-4'>{statusObj?.from_currency || swapResponse.fromCurrency}</span>
              </div>
             
              <div className="mt-3 sm:mt-4">
                <div className="text-gray-600 dark:text-[#7e7e8f] text-xs font-semibold mb-1">
                  To this address:
                </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#1D8751] dark:text-[#1D8751] font-mono text-xs sm:text-base break-all flex-1 min-w-0">
                  {swapResponse.payinAddress}
                </span>
                <button
                  className="bg-[#1D8751] hover:bg-[#16663d] dark:bg-[#1D8751] dark:hover:bg-[#16663d] p-1.5 sm:p-2 rounded-lg text-white transition-colors min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center flex-shrink-0"
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

              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-0 md:ml-6 flex items-center justify-center py-2">
          {/* QR code */}
          <div className="w-24 h-24 sm:w-36 sm:h-36 bg-white rounded-lg flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${swapResponse.payinAddress}`}
              alt="QR Code"
              className="w-20 h-20 sm:w-32 sm:h-32"
            />
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="w-full sm:max-w-4xl mb-3 overflow-x-auto">
        {/* Circle and connecting line row */}
        <div className="flex items-center mb-2 min-w-max sm:min-w-0">
          {statusSteps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            
            return (
              <React.Fragment key={step.key}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center p-1 flex-shrink-0 ${
                      isActive
                        ? "bg-[#F79330] dark:bg-[#F79330]"
                        : isCompleted
                        ? "bg-[#1D8751] dark:bg-[#1D8751]"
                        : "bg-gray-300 dark:bg-[#7B7B7B]"
                    }`}
                  >
                    {/* Always show the step's icon, colored appropriately */}
                    <span className={isActive ? "text-white" : isCompleted ? "text-white" : "text-white"}>
                      {StatusIcons[step.key as keyof typeof StatusIcons]}
                    </span>
                  </div>
                </div>
                {/* Connecting line at circle center */}
                {idx < statusSteps.length - 1 && (
                  <div className="flex-1 h-1 mx-1 sm:mx-2 rounded-full min-w-[20px] sm:min-w-0">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx < currentStepIndex
                          ? "bg-[#1D8751] dark:bg-[#1D8751]"
                          : idx === currentStepIndex
                          ? "bg-gradient-to-r from-[#F79330] to-gray-300 dark:from-[#F79330] dark:to-[#7B7B7B]"
                          : "bg-gray-300 dark:bg-[#7B7B7B]"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Text and dots row */}
        <div className="flex items-center min-w-max sm:min-w-0">
          {statusSteps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            
            return (
              <React.Fragment key={`text-${step.key}`}>
                <div className="flex flex-col items-center w-10 sm:w-auto min-w-[60px] sm:min-w-0">
                  <span
                    className={`font-medium text-[10px] sm:text-xs text-center ${
                      isActive
                        ? "text-[#F79330] dark:text-[#F79330]"
                        : isCompleted
                        ? "text-[#1D8751] dark:text-[#1D8751]"
                        : "text-gray-600 dark:text-[#7B7B7B]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <div className="flex gap-1 mt-1">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block animate-bounce" style={{animationDelay: '0s'}}></span>
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                  )}
                </div>
                {/* Spacer for connecting line area */}
                {idx < statusSteps.length - 1 && (
                  <div className="flex-1 mx-2"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className="bg-white dark:bg-[var(--card-color)] border-2 border-gray-200 dark:border-[#35353E] rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg w-full sm:max-w-4xl mb-2 sm:mb-3">
        {/* Title */}
        <div className="text-gray-900 dark:text-white text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-1">
          <div className="text-gray-600 dark:text-[#7e7e8f] text-sm sm:text-base font-medium">
            Transaction ID
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 dark:text-white text-xs sm:text-base font-mono font-semibold break-all">
              {swapResponse.id}
            </span>
            <button
              className="ml-2 p-1 rounded transition flex-shrink-0"
              onClick={() => navigator.clipboard.writeText(swapResponse.id)}
              title="Copy Transaction ID"
            >
            <Copy className="w-4 h-4 text-[#F79330]" />
            </button>
          </div>
        </div>
        {/* Dashed Divider */}
        <div className="border-t border-dashed border-gray-400 dark:border-[#7e7e8f] mb-4"></div>
        {/* You Get and Recipient Wallet */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
          <div className="text-gray-600 dark:text-[#7e7e8f] text-sm sm:text-base font-medium">
            You Get
          </div>
          <div className="text-gray-600 dark:text-[#7e7e8f] text-sm sm:text-base font-medium">
            Recipient Wallet
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-2">
          <div className="text-gray-900 dark:text-white text-sm sm:text-base font-mono font-semibold">
            {statusObj?.amount_to || swapResponse.toAmount} {statusObj?.to_currency || swapResponse.toCurrency}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-[#7e7e8f] text-xs sm:text-sm font-mono break-all">
              {swapResponse.payoutAddress}
            </span>
          </div>
        </div>
      </div>

      {/* View Results Button - shown when transaction is finished */}
      {mappedStatus === "finished" && (
        <div className="w-full sm:max-w-4xl mb-4">
          <div className="bg-[#1D8751] dark:bg-[#1D8751] border border-[#1D8751] dark:border-[#1D8751] rounded-2xl p-3 sm:p-4 shadow-lg text-center">
            <h3 className="text-white dark:text-white text-base sm:text-lg font-semibold mb-2">🎉 Transaction Completed!</h3>
            <p className="text-white/90 dark:text-white/90 text-xs sm:text-sm mb-4">Your swap has been processed successfully.</p>
            <button
              className="bg-white hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-100 text-[#1D8751] dark:text-[#1D8751] font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl text-sm sm:text-lg transition"
              onClick={onNext}
            >
              View Results
            </button>
          </div>
        </div>
      )}

      {/* Terms and Conditions Summary - always at the very bottom */}
      <div className="w-full sm:max-w-4xl mb-2 mt-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-500 rounded-xl p-4 sm:p-5 shadow-lg">
          <h3 className="text-white font-semibold text-base sm:text-lg mb-3 sm:mb-4">
            Terms and Conditions Summary
          </h3>
          <div className="space-y-0.5">
            {/* Term 1 - Dynamic asset and network */}
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-white text-lg sm:text-xl font-bold mt-0.5">•</span>
              <p className="text-white text-xs sm:text-sm flex-1">
                Only send {statusObj?.from_currency || swapResponse?.fromCurrency || ""} ({statusObj?.fromNetwork || swapResponse?.fromNetwork || "TRC20"}) to this address
              </p>
            </div>
            
            {/* Term 2 - Send exact amount */}
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-white text-lg sm:text-xl font-bold mt-0.5">•</span>
              <p className="text-white text-xs sm:text-sm flex-1">
                Send exactly the amount specified below
              </p>
            </div>
            
            {/* Term 3 - No exchange accounts */}
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-white text-lg sm:text-xl font-bold mt-0.5">•</span>
              <p className="text-white text-xs sm:text-sm flex-1">
                Do not send from exchange accounts
              </p>
            </div>
            
            {/* Term 4 - Minimum confirmations */}
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-white text-lg sm:text-xl font-bold mt-0.5">•</span>
              <p className="text-white text-xs sm:text-sm flex-1">
                Minimum confirmations required: 1
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default CopyAddressStep;
