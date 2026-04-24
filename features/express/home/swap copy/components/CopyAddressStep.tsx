import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CreateSwapResponse } from "../types";
import { connectSwapStatusWebSocket } from "./websocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import { API_CONFIG } from "@/lib/appConfig";
import SuccessPage from "./success";
import { Copy } from "lucide-react";
import { useTheme } from "@/context/theme";
import FailureStatusModal from "@/features/express/components/FailureStatusModal";

import { logger } from '@/lib/utils/logger';

// Normalize API response - backend may return snake_case
const getPayinAddress = (r: CreateSwapResponse | null): string =>
  r ? (r as any).payin_address || r.payinAddress || "" : "";

interface CopyAddressStepProps {
  swapResponse: CreateSwapResponse | null;
  copyMessage: string;
  onCopyAddress: () => void;
  onBack: () => void;
  onNext: () => void;
  isHomePage?: boolean;
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
  isHomePage = false,
}) => {
  const { isDark } = useTheme();
  const { tokens } = useSelector((state: any) => state.auth);
  const token = tokens?.access ?? cookieUtils.getCookie("access_token") ?? (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  const [status, setStatus] = useState<string>("pending");
  const [statusObj, setStatusObj] = useState<any>(null);
  const [failureModal, setFailureModal] = useState<{
    isOpen: boolean;
    status: string;
    message?: string;
  }>({ isOpen: false, status: "", message: undefined });
  const payinAddress = getPayinAddress(swapResponse);
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

  const isFailureLikeStatus = (value: unknown): boolean => {
    if (typeof value !== "string") return false;
    const normalized = value.toLowerCase();
    return [
      "failed",
      "rejected",
      "stopped",
      "cancelled",
      "canceled",
      "error",
    ].includes(normalized);
  };

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
        token: token ?? undefined,
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

            const statusCandidates = [
              msg?.data?.status,
              msg?.data?.internal_status,
              msg?.data?.api_status,
              msg?.data?.original_status,
              msg?.status,
              msg?.type === "swap_failed" ? "failed" : null,
            ];
            const detectedFailure = statusCandidates.find(isFailureLikeStatus) as
              | string
              | undefined;
            if (detectedFailure) {
              const rawFailureMessage =
                msg?.data?.message ||
                msg?.data?.api_message ||
                msg?.data?.error ||
                "";
              const normalizedFailureMessage = String(rawFailureMessage || "").toLowerCase();
              const isAmountTooSmall =
                normalizedFailureMessage.includes("amount") &&
                (normalizedFailureMessage.includes("too small") ||
                  normalizedFailureMessage.includes("deposit_too_small") ||
                  normalizedFailureMessage.includes("min amount"));
              setStatusObj(msg.data ?? msg);
              setFailureModal({
                isOpen: true,
                status: detectedFailure,
                message:
                  isAmountTooSmall
                    ? "Amount you have sent is too small to complete the transaction."
                    : rawFailureMessage || "Swap transaction failed.",
              });
              return;
            }

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

  // Show loading when swapResponse exists but payinAddress not yet available
  if (!swapResponse) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751] mb-4"></div>
        <p className="text-gray-600 dark:text-[#788099] text-sm">Loading swap details...</p>
      </div>
    );
  }
  if (!payinAddress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">
            Unable to load deposit address. Please try again or contact support.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-[#1D8751] hover:bg-[#16663d] text-white rounded-lg text-sm font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
    <div className={`${isHomePage ? 'min-h-0' : 'min-h-screen'} flex flex-col items-center ${isHomePage ? 'py-2 sm:py-3' : 'py-4 sm:py-8'} px-2 sm:px-4 w-full overflow-x-hidden`}>
      {/* Top Card */}
      <div className={`flex flex-col md:flex-row justify-between items-stretch bg-white dark:bg-[#23232b] border-2 border-gray-200 dark:border-[#35353E] rounded-2xl ${isHomePage ? 'p-2 sm:p-3' : 'p-3 sm:p-4'} shadow-lg w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'} ${isHomePage ? 'min-h-[120px] sm:min-h-[140px]' : 'min-h-[180px]'} overflow-hidden`}>
        <div className={`flex-1 flex flex-col justify-between ${isHomePage ? 'py-1 sm:py-2 pr-0 sm:pr-2' : 'py-2 pr-0 sm:pr-2'} min-w-0`}>
          <div>
            <div className="text-gray-600 dark:text-[#7e7e8f] text-xs font-semibold mb-0.5">
              Amount:
            </div>
            <div className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold mb-1">
              {statusObj?.amount_from || swapResponse.fromAmount} 
              <span className='uppercase ml-2 sm:ml-4'>{statusObj?.from_currency || swapResponse.fromCurrency}</span>
            </div>
           
            <div className="mt-3 sm:mt-4">
              <div className="text-gray-600 dark:text-[#7e7e8f] text-xs font-semibold mb-1">
                To this address:
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <span className="text-[#1D8751] dark:text-[#1D8751] font-mono text-xs sm:text-base break-all sm:break-words max-w-full min-w-0 flex-1">
                  {payinAddress}
                </span>
                <button
                  className="bg-[#1D8751] hover:bg-[#16663d] dark:bg-[#1D8751] dark:hover:bg-[#16663d] p-2 rounded-lg text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0 self-start sm:self-auto"
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
        <div className={`flex-shrink-0 ${isHomePage ? 'ml-0 mt-2 md:mt-0 md:ml-3' : 'ml-0 md:ml-6'} flex items-center justify-center ${isHomePage ? 'py-1 sm:py-2' : 'py-2'} mt-3 md:mt-0`}>
          {/* QR code */}
          <div className={`${isHomePage ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-28 h-28 sm:w-36 sm:h-36'} bg-white rounded-lg flex items-center justify-center flex-shrink-0`}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=${isHomePage ? '96' : '180'}x${isHomePage ? '96' : '180'}&data=${encodeURIComponent(payinAddress)}`}
              alt="QR Code"
              className={isHomePage ? "w-16 h-16 sm:w-20 sm:h-20" : "w-24 h-24 sm:w-32 sm:h-32"}
            />
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className={`w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-3'} px-2 sm:px-0 overflow-x-auto`}>
        {/* Circle and connecting line row */}
        <div className={`flex items-center ${isHomePage ? 'mb-1 sm:mb-2' : 'mb-2'} ${isHomePage ? 'min-w-[280px]' : 'min-w-[320px]'}`}>
          {statusSteps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            
            return (
              <React.Fragment key={step.key}>
                <div className={`flex items-center flex-shrink-0 ${isHomePage ? 'min-w-[50px] sm:min-w-[56px]' : ''}`}>
                  <div
                    className={`${isHomePage ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8 sm:w-10 sm:h-10'} rounded-full flex items-center justify-center p-1 ${
                      isActive
                        ? "bg-[#F79330] dark:bg-[#F79330]"
                        : isCompleted
                        ? "bg-[#1D8751] dark:bg-[#1D8751]"
                        : "bg-gray-300 dark:bg-[#7B7B7B]"
                    }`}
                  >
                    {/* Always show the step's icon, colored appropriately */}
                    <span className={`${isActive ? "text-white" : isCompleted ? "text-white" : "text-white"} [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-6 sm:[&>svg]:h-6`}>
                      {StatusIcons[step.key as keyof typeof StatusIcons]}
                    </span>
                  </div>
                </div>
                {/* Connecting line at circle center */}
                {idx < statusSteps.length - 1 && (
                  <div className={`flex-1 ${isHomePage ? 'h-0.5' : 'h-0.5 sm:h-1'} ${isHomePage ? 'mx-0.5 sm:mx-1' : 'mx-1 sm:mx-2'} rounded-full ${isHomePage ? 'min-w-[12px]' : 'min-w-[20px]'}`}>
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
        <div className={`flex items-center ${isHomePage ? 'min-w-[280px]' : 'min-w-[320px]'}`}>
          {statusSteps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            
            return (
              <React.Fragment key={`text-${step.key}`}>
                <div className={`flex flex-col items-center ${isHomePage ? 'w-6 sm:w-10' : 'w-8 sm:w-12'} shrink-0`}>
                  <span
                    className={`font-medium ${isHomePage ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} text-center leading-tight ${
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
                    <div className="flex gap-0.5 sm:gap-1 mt-1">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-400 rounded-full inline-block animate-bounce" style={{animationDelay: '0s'}}></span>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-400 rounded-full inline-block animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-400 rounded-full inline-block animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                  )}
                </div>
                {/* Spacer for connecting line area */}
                {idx < statusSteps.length - 1 && (
                  <div className={`flex-1 ${isHomePage ? 'mx-0.5 sm:mx-1' : 'mx-1 sm:mx-2'} ${isHomePage ? 'min-w-[12px]' : 'min-w-[20px]'}`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className={`bg-white dark:bg-[#23232b] border-2 border-gray-200 dark:border-[#35353E] rounded-2xl ${isHomePage ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} shadow-lg w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-3'} overflow-hidden`}>
        {/* Title */}
        <div className={`text-gray-900 dark:text-white ${isHomePage ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-semibold ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'}`}>
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-2 sm:gap-0">
          <div className="text-gray-600 dark:text-[#7e7e8f] text-sm sm:text-base font-medium">
            Transaction ID
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-gray-900 dark:text-white text-xs sm:text-base font-mono font-semibold truncate max-w-[180px] sm:max-w-none">
              {swapResponse.id}
            </span>
            <button
              className="flex-shrink-0 p-1 rounded transition"
              onClick={() => navigator.clipboard.writeText(swapResponse.id)}
              title="Copy Transaction ID"
            >
            <Copy className="w-4 h-4 text-[#F79330]" />
            </button>
          </div>
        </div>
        {/* Dashed Divider */}
        <div className="border-t border-dashed border-gray-400 dark:border-[#7e7e8f] my-4"></div>
        {/* You Get and Recipient Wallet */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
          {/* You Get Section */}
          <div className="flex-1">
            <div className="text-gray-600 dark:text-[#7e7e8f] text-sm sm:text-base font-medium mb-1">
              You Get
            </div>
            <div className="text-gray-900 dark:text-white text-sm sm:text-base font-mono font-semibold uppercase">
              {statusObj?.amount_to || swapResponse.toAmount} {statusObj?.to_currency || swapResponse.toCurrency}
            </div>
          </div>
          {/* Recipient Wallet Section */}
          <div className="flex-1 sm:text-right">
            <div className="text-gray-600 dark:text-[#7e7e8f] text-sm sm:text-base font-medium mb-1">
              Recipient Wallet
            </div>
            <div className="text-gray-600 dark:text-[#7e7e8f] text-xs sm:text-sm font-mono break-all sm:break-normal">
              {swapResponse.payoutAddress}
            </div>
          </div>
        </div>
      </div>

      {/* View Results Button - shown when transaction is finished */}
      {mappedStatus === "finished" && (
        <div className={`w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-4'} px-2 sm:px-0`}>
          <div className={`bg-[#1D8751] dark:bg-[#1D8751] border border-[#1D8751] dark:border-[#1D8751] rounded-2xl ${isHomePage ? 'p-2 sm:p-3' : 'p-3 sm:p-4'} shadow-lg text-center`}>
            <h3 className={`text-white dark:text-white ${isHomePage ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-semibold ${isHomePage ? 'mb-1 sm:mb-2' : 'mb-2'}`}>🎉 Transaction Completed!</h3>
            <p className={`text-white/90 dark:text-white/90 ${isHomePage ? 'text-xs' : 'text-xs sm:text-sm'} ${isHomePage ? 'mb-2 sm:mb-3' : 'mb-3 sm:mb-4'}`}>Your swap has been processed successfully.</p>
            <button
              className="bg-white hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-100 text-[#1D8751] dark:text-[#1D8751] font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition w-full sm:w-auto"
              onClick={onNext}
            >
              View Results
            </button>
          </div>
        </div>
      )}

      {/* Terms & Conditions - visible in both light and dark mode */}
      <div className={`w-full ${isHomePage ? '' : 'max-w-4xl'} ${isHomePage ? 'mb-1 sm:mb-2 mt-1 sm:mt-2' : 'mb-2 mt-2'} px-2 sm:px-0`}>
        <div className={`border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"}`}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className={`font-medium text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
                Terms & Conditions
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">1.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Send from your own wallet only:</span> You must send the crypto asset from a wallet that you personally own and control.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">2.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Send the correct asset and network:</span> Sending any other asset or using a different network will result in PERMANENT LOSS of funds.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1D8751] font-bold text-sm flex-shrink-0">3.</span>
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  <span className="font-semibold">Provide the correct receiving address:</span> Enter the correct wallet address. Wrong address = permanent loss of funds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FailureStatusModal
        isOpen={failureModal.isOpen}
        status={failureModal.status}
        message={failureModal.message}
        isDark={isDark}
        onClose={() =>
          setFailureModal({ isOpen: false, status: "", message: undefined })
        }
        onBackToForm={() => {
          setFailureModal({ isOpen: false, status: "", message: undefined });
          onBack();
        }}
      />
      
    </div>
  );
};

export default CopyAddressStep;
