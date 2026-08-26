"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@/context/theme";
import CopyButton from "@/components/ui/CopyButton";
import {
  fetchForexExchangeThunk,
  patchForexExchangeFromWs,
  setForexExchangeFromCache,
} from "@/features/express/slices/forexSlice";
import { forexStatusWebSocket } from "@/features/express/services/forexStatusWebSocket";
import type { AppDispatch } from "@/store";
import { useRouteProtection } from "@/features/auth/hooks/useRouteProtection";
import Loader from "@/features/p2p/components/Common/Loader";
import { withTimeout } from "@/lib/utils/fetchWithTimeout";
import FailureStatusModal from "@/features/express/components/FailureStatusModal";
import { useScrollAppToTopWhen } from "@/hooks/useScrollAppToTopWhen";
import HowToSendDialBlock from "@/components/ui/HowToSendDialBlock";
import { resolveFormattedForexDepositHowToSend } from "@/features/moneyX/utils/howToSend";
import { encodeQrScanData } from "@/lib/utils/ussdDial";
import type { AdminPaymentInfo, ForexExchangeResponse } from "@/features/express/types/forex";
import {
  forexExchangeMatchesId,
  mapForexStatusToUiStep,
  normalizeForexExchange,
  resolveForexRejectionReason,
} from "@/features/express/utils/normalizeForexExchange";
import { resolveExpressTransactionFailureMessage } from "@/lib/utils/websocketUtils";

const FXP_LOGO = "/assets/FXPRIMUS-logo_2_k8ikwb.png";
const BANK_LOGO_FALLBACK = "/assets/image_7_jijlik.png";

const formatForexAmount = (value: unknown): string => {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return String(value ?? "0");
  if (Number.isInteger(parsed)) return String(parsed);
  return parsed.toFixed(8).replace(/\.?0+$/, "");
};

const normalizeForexCurrency = (currency: unknown): string => {
  const normalized = String(currency ?? "").trim().toUpperCase();
  if (normalized === "FXPRIMUS") return "FXP";
  return normalized;
};

const isFxpCurrency = (currency: unknown): boolean => {
  const normalized = String(currency ?? "").trim().toUpperCase();
  return normalized === "FXP" || normalized === "FXPRIMUS";
};

const pickPaymentText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

const resolvePaymentAccountNumber = (
  info: AdminPaymentInfo | Record<string, unknown> | null | undefined
): string =>
  pickPaymentText(info?.account_number, info?.mobile_number, info?.wallet_address);

function CopyableMonoRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  if (!value) return null;
  return (
    <>
      <div
        className={`${
          isDark ? "text-[#7B7B7B]" : "text-gray-600"
        } text-xs font-semibold mb-0.5`}
      >
        {label}
      </div>
      <div className="flex items-center mb-2 p-2 rounded-lg border border-[#1D8751]/30 bg-[#1D8751]/5 gap-2">
        <span
          className={`${
            isDark ? "text-white" : "text-gray-900"
          } text-sm font-mono break-all flex-1 leading-relaxed`}
          style={{ wordBreak: "break-all", lineHeight: "1.5" }}
        >
          {value}
        </span>
        <CopyButton value={value} className="ml-2 shrink-0" />
      </div>
    </>
  );
}

function ForexStatusContent() {
  const { isChecking, isVerified } = useRouteProtection();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const transactionId = searchParams?.get("transactionId") || null;

  useScrollAppToTopWhen(!!transactionId);

  const { currentExchange, loading, error } = useSelector(
    (state: any) => state.forex
  );

  const authState = useSelector((state: any) => state.auth);
  const accessToken = authState?.tokens?.access || null;

  const [copySuccess, setCopySuccess] = useState(false);
  const initialFetchAttemptedRef = useRef(false);
  const currentExchangeRef = useRef<ForexExchangeResponse | null>(null);
  const [failureModal, setFailureModal] = useState<{
    isOpen: boolean;
    status: string;
    message?: string;
  }>({ isOpen: false, status: "", message: undefined });

  const resolveForexFailureMessage = (
    exchange?: Record<string, unknown> | null,
    wsMessage?: unknown
  ): string | undefined => {
    const fromExchange = exchange ? resolveForexRejectionReason(exchange) : null;
    const fromWs = wsMessage
      ? resolveExpressTransactionFailureMessage(wsMessage)
      : undefined;
    return fromExchange || fromWs || undefined;
  };

  const persistForexExchange = (payload: Record<string, unknown>) => {
    const existingReason = resolveForexRejectionReason(currentExchangeRef.current);
    const incomingReason = resolveForexRejectionReason(payload);
    const normalized = normalizeForexExchange(
      {
        ...(currentExchangeRef.current || {}),
        ...payload,
        ...(incomingReason || existingReason
          ? { rejection_reason: incomingReason || existingReason }
          : {}),
      },
      transactionId || undefined
    );
    dispatch(setForexExchangeFromCache(normalized));
    localStorage.setItem("currentForexExchange", JSON.stringify(normalized));
    currentExchangeRef.current = normalized;
    return normalized;
  };

  const applyForexStatusMessage = (message: any) => {
    const payload =
      message?.data && typeof message.data === "object" ? message.data : null;
    const status = String(
      payload?.status || message?.status || message?.data?.status || ""
    ).trim();
    const stages = payload?.stages || message?.stages || message?.data?.stages;
    const failureMessage = resolveForexFailureMessage(payload, message);

    if (payload) {
      persistForexExchange({
        ...payload,
        ...(failureMessage && !resolveForexRejectionReason(payload)
          ? { rejection_reason: failureMessage }
          : {}),
      });
      return status;
    }

    if (status || stages || failureMessage) {
      dispatch(
        patchForexExchangeFromWs({
          ...(status ? { status } : {}),
          ...(stages ? { stages } : {}),
          ...(failureMessage ? { rejection_reason: failureMessage } : {}),
          ...(message?.status_display
            ? { status_display: message.status_display }
            : {}),
          ...(message?.stage_display
            ? { stage_display: message.stage_display }
            : {}),
        })
      );
    }

    return status;
  };

  useEffect(() => {
    currentExchangeRef.current = currentExchange ?? null;
  }, [currentExchange]);

  // Fetch exchange details once when the page loads with a transactionId.
  useEffect(() => {
    if (!transactionId || initialFetchAttemptedRef.current) return;

    if (forexExchangeMatchesId(currentExchange, transactionId)) {
      initialFetchAttemptedRef.current = true;
      localStorage.setItem(
        "currentForexExchange",
        JSON.stringify(currentExchange)
      );
      return;
    }

    const cachedExchange = localStorage.getItem("currentForexExchange");

    if (cachedExchange) {
      try {
        const exchangeData = JSON.parse(cachedExchange);
        if (forexExchangeMatchesId(exchangeData, transactionId)) {
          initialFetchAttemptedRef.current = true;
          dispatch(setForexExchangeFromCache(exchangeData));
          return;
        }
        localStorage.removeItem("currentForexExchange");
      } catch {
        localStorage.removeItem("currentForexExchange");
      }
    }

    initialFetchAttemptedRef.current = true;
    withTimeout(dispatch(fetchForexExchangeThunk(transactionId)).unwrap(), 15_000)
      .then((data) => {
        localStorage.setItem("currentForexExchange", JSON.stringify(data));
      })
      .catch(() => {});
  }, [transactionId, dispatch]);

  useEffect(() => {
    if (
      currentExchange &&
      transactionId &&
      forexExchangeMatchesId(currentExchange, transactionId)
    ) {
      localStorage.setItem(
        "currentForexExchange",
        JSON.stringify(currentExchange)
      );
    }
  }, [currentExchange, transactionId]);

  // WebSocket connection for real-time status updates
  useEffect(() => {
   

    if (!transactionId || !accessToken) {
      return;
    }

    

    // Connect to WebSocket
    forexStatusWebSocket.connect(transactionId, accessToken);

    // Set up event handlers
    const unsubscribeMessage = forexStatusWebSocket.onMessage((message) => {
      if (
        message.type === "initial_status" ||
        message.type === "status_update"
      ) {
        const payload =
          message?.data && typeof message.data === "object"
            ? (message.data as Record<string, unknown>)
            : null;
        const status = applyForexStatusMessage(message);
        const normalizedStatus = status.toLowerCase();

        if (["rejected", "failed", "stopped"].includes(normalizedStatus)) {
          const failureMessage = resolveForexFailureMessage(payload, message);
          setFailureModal({
            isOpen: true,
            status: normalizedStatus,
            message: failureMessage || undefined,
          });

          // Backend often emits rejected status before populating rejection_reason on WS.
          if (!failureMessage && transactionId) {
            withTimeout(
              dispatch(fetchForexExchangeThunk(transactionId)).unwrap(),
              15_000
            )
              .then((data) => {
                const apiReason = resolveForexRejectionReason(data);
                if (!apiReason) return;
                dispatch(setForexExchangeFromCache(data));
                localStorage.setItem(
                  "currentForexExchange",
                  JSON.stringify(data)
                );
                setFailureModal({
                  isOpen: true,
                  status: normalizedStatus,
                  message: apiReason,
                });
              })
              .catch(() => {});
          }
        }
      }
    });

    const unsubscribeError = forexStatusWebSocket.onError((error) => {
          });

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      forexStatusWebSocket.disconnect();
    };
  }, [transactionId, accessToken, dispatch]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Map backend status to the 3-step progress UI (deposit-style).
  const currentStatus = currentExchange
    ? mapForexStatusToUiStep(currentExchange.status)
    : "pending";

  const parseNumericValue = (value: unknown): number | null => {
    const parsed = Number.parseFloat(String(value ?? ""));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getDisplayedExchangeRate = () => {
    if (!currentExchange) {
      return null;
    }

    const fromAmountNum = parseNumericValue(currentExchange.from_amount);
    const toAmountNum = parseNumericValue(currentExchange.to_amount);

    // FX Primus status should reflect the actual effective rate from the API-driven
    // transaction amounts, not the stale hardcoded rate originally submitted.
    if (
      fromAmountNum &&
      toAmountNum &&
      fromAmountNum > 0 &&
      isFxpCurrency(currentExchange.to_currency)
    ) {
      return (toAmountNum / fromAmountNum).toFixed(8);
    }

    return currentExchange.exchange_rate || null;
  };

  const displayedExchangeRate = getDisplayedExchangeRate();
  const shouldHideExchangeRate =
    isFxpCurrency(currentExchange?.to_currency) ||
    isFxpCurrency(currentExchange?.from_currency);

  const isForexDeposit =
    String(currentExchange?.transaction_type || "").toLowerCase() === "deposit";

  const howToSendDisplay = resolveFormattedForexDepositHowToSend(
    isForexDeposit ? currentExchange : null
  );

  const qrPayload =
    howToSendDisplay ||
    currentExchange?.transaction_reference ||
    currentExchange?.transaction_id ||
    "";

  // Redirect to success page when transaction is completed
  useEffect(() => {
    if (currentExchange && currentStatus === 'completed') {
      // Small delay to show the completed animation before redirect
      const redirectTimer = setTimeout(() => {
        router.push(`/dashboard/express-exchange/forex-success?transactionId=${transactionId}`);
      }, 2000); // 2 second delay to show completed state

      return () => clearTimeout(redirectTimer);
    }
  }, [currentStatus, currentExchange, router, transactionId]);

  useEffect(() => {
    const status = String(currentExchange?.status || "").toLowerCase();
    if (!status || !["rejected", "failed", "stopped"].includes(status)) return;

    const failureMessage = resolveForexFailureMessage(
      currentExchange as Record<string, unknown>
    );
    setFailureModal({
      isOpen: true,
      status,
      message: failureMessage || undefined,
    });
  }, [currentExchange]);

  const terminalFailureStatus = String(currentExchange?.status || "")
    .toLowerCase();
  const isTerminalFailure = ["rejected", "failed", "stopped"].includes(
    terminalFailureStatus
  );
  const visibleRejectionReason = currentExchange
    ? resolveForexRejectionReason(currentExchange as Record<string, unknown>)
    : failureModal.message || null;

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

  if (loading && !currentExchange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1D8751]"></div>
          <p className="text-[#788099] text-lg">Loading forex exchange details...</p>
        </div>
      </div>
    );
  }

  const isNotFoundError =
    typeof error === "string" &&
    (error.includes("404") || error.toLowerCase().includes("not found"));

  if ((error || !currentExchange) && !isNotFoundError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1D1D23] rounded-2xl border-2 border-red-500 p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#788099]">Error Loading Exchange</h2>
            <p className="text-[#788099] text-center">{error || "Failed to load forex exchange details"}</p>
            <button
              onClick={() => router.push("/dashboard/express-exchange")}
              className="mt-4 px-6 py-2 bg-[#1D8751] text-white rounded-2xl hover:bg-[#166b3e] transition-colors"
            >
              Back to Exchange
            </button>
          </div>
        </div>
      </div>
    );
  }

  // For 404 after reject/cleanup, keep page alive for websocket status and modal.
  if (!currentExchange && isNotFoundError && transactionId) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D] p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1D1D23] rounded-2xl border border-gray-200 dark:border-[#35353E] p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1D8751]" />
              <h2 className="text-xl font-bold text-[#788099]">
                Waiting for Transaction Update
              </h2>
              <p className="text-[#788099] text-sm">
                Transaction record is not available via API yet. Please wait while we refresh your status.
              </p>
            </div>
          </div>
        </div>
        <FailureStatusModal
          isOpen={failureModal.isOpen}
          status={failureModal.status}
          message={failureModal.message}
          onClose={() =>
            setFailureModal({ isOpen: false, status: "", message: undefined })
          }
          onBackToForm={() => {
            setFailureModal({ isOpen: false, status: "", message: undefined });
            router.push("/dashboard/express-exchange");
          }}
          isDark={isDark}
        />
      </>
    );
  }

  const referenceNumber =
    currentExchange.transaction_reference ||
    currentExchange.transaction_id ||
    "";
  const fromAmountDisplay = formatForexAmount(currentExchange.from_amount);
  const toAmountDisplay = formatForexAmount(currentExchange.to_amount);
  const fromCurrencyDisplay = normalizeForexCurrency(currentExchange.from_currency);
  const toCurrencyDisplay = normalizeForexCurrency(currentExchange.to_currency);
  const isDeposit =
    String(currentExchange.transaction_type || "").toLowerCase() === "deposit";
  const adminPayment = currentExchange.admin_payment_info;
  const userPayment = currentExchange.user_payment_info as
    | AdminPaymentInfo
    | null
    | undefined;
  const receiveBankInfo = isDeposit ? null : userPayment;
  const sendForexAccount = isDeposit ? null : currentExchange.user_forex_account;
  const receiveForexAccount = isDeposit
    ? currentExchange.user_forex_account
    : null;
  const labelMuted = isDark ? "text-[#7B7B7B]" : "text-gray-600";
  const labelStrong = isDark ? "text-white" : "text-gray-900";

  return (
    <>
    <div className={`container mx-auto px-4 sm:px-6 md:px-8 min-h-screen flex flex-col items-center pt-2 overflow-x-hidden ${isDark ? 'bg-transparent' : 'bg-transparent'}`}>
      {isTerminalFailure && visibleRejectionReason ? (
        <div
          className={`w-full max-w-4xl mb-4 rounded-2xl border-2 border-red-500/40 px-4 py-3 ${
            isDark ? "bg-red-500/10" : "bg-red-50"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              isDark ? "text-red-300" : "text-red-700"
            }`}
          >
            {terminalFailureStatus === "rejected"
              ? "Transaction rejected"
              : "Transaction failed"}
          </p>
          <p
            className={`mt-1 text-sm whitespace-pre-line break-words ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <span className="font-semibold">Reason:</span> {visibleRejectionReason}
          </p>
        </div>
      ) : null}
      {/* Top Card - Transaction Summary */}
      <div
        className={`flex flex-col md:flex-row justify-between items-stretch ${isDark
            ? "bg-[#23232B] border-[#35353E]"
            : "bg-white border-gray-200"
          } border-2 rounded-2xl p-4 shadow-lg w-full max-w-4xl mb-4 min-h-[180px]`}
      >
        <div className="flex-1 flex flex-col justify-between py-2 pr-2 min-w-0">
          <div>
            <div className="flex flex-row flex-wrap gap-x-6 gap-y-3 items-baseline mb-3">
              <div>
                <div className={`${labelMuted} text-xs font-semibold mb-0.5`}>
                  {isDeposit ? "Amount you're sending:" : "You're sending:"}
                </div>
                <div className={`${labelStrong} text-base font-semibold`}>
                  {fromAmountDisplay}{" "}
                  <span className="uppercase">{fromCurrencyDisplay}</span>
                </div>
              </div>
              <div>
                <div className={`${labelMuted} text-xs font-semibold mb-0.5`}>
                  {isDeposit ? "Amount you'll receive:" : "You'll receive:"}
                </div>
                <div className="text-[#1D8751] text-base font-semibold">
                  {toAmountDisplay}{" "}
                  <span className="uppercase">{toCurrencyDisplay}</span>
                </div>
              </div>
              {referenceNumber ? (
                <div>
                  <div className={`${labelMuted} text-xs font-semibold mb-0.5`}>
                    Reference Number
                  </div>
                  <div
                    className={`${labelStrong} text-base font-semibold flex items-center gap-2`}
                  >
                    <code className="font-mono text-sm">{referenceNumber}</code>
                    <CopyButton value={referenceNumber} className="shrink-0" />
                  </div>
                </div>
              ) : null}
            </div>

            {!shouldHideExchangeRate && displayedExchangeRate ? (
              <>
                <div className={`${labelMuted} text-xs font-semibold mb-0.5 mt-1`}>
                  Exchange Rate
                </div>
                <div className={`${labelStrong} text-sm mb-3`}>
                  1 {fromCurrencyDisplay} = {displayedExchangeRate}{" "}
                  {toCurrencyDisplay}
                </div>
              </>
            ) : null}

            <div
              className={`border-t border-dashed ${
                isDark ? "border-[#7B7B7B]" : "border-gray-300"
              } my-3`}
            />

            <div className={`${labelMuted} text-xs font-semibold mb-1`}>From</div>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={
                  isDeposit
                    ? BANK_LOGO_FALLBACK
                    : FXP_LOGO
                }
                alt={isDeposit ? "Bank" : "FXPRIMUS"}
                className="w-7 h-7 rounded-full object-cover shrink-0"
                onError={(e) => {
                  e.currentTarget.src = isDeposit
                    ? BANK_LOGO_FALLBACK
                    : FXP_LOGO;
                }}
              />
              <div className="min-w-0">
                <div className={`${labelStrong} text-sm font-semibold`}>
                  {fromAmountDisplay}{" "}
                  <span className="uppercase">{fromCurrencyDisplay}</span>
                </div>
                <div className={`${labelMuted} text-xs truncate`}>
                  {isDeposit
                    ? pickPaymentText(adminPayment?.provider_name, "Bank Transfer")
                    : "Your FXPRIMUS Account"}
                </div>
              </div>
            </div>
            {isDeposit ? (
              <>
                {pickPaymentText(adminPayment?.account_name) ? (
                  <>
                    <div className={`${labelMuted} text-xs font-semibold mb-0.5`}>
                      Account Name
                    </div>
                    <div className={`${labelStrong} text-sm mb-2`}>
                      {adminPayment?.account_name}
                    </div>
                  </>
                ) : null}
                <CopyableMonoRow
                  label="Account Number"
                  value={resolvePaymentAccountNumber(adminPayment)}
                  isDark={isDark}
                />
              </>
            ) : (
              <CopyableMonoRow
                label="Forex Account Number"
                value={pickPaymentText(sendForexAccount)}
                isDark={isDark}
              />
            )}

            <div className={`${labelMuted} text-xs font-semibold mb-1 mt-3`}>
              To
            </div>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={isDeposit ? FXP_LOGO : BANK_LOGO_FALLBACK}
                alt={isDeposit ? "FXPRIMUS" : "Bank"}
                className="w-7 h-7 rounded-full object-cover shrink-0"
                onError={(e) => {
                  e.currentTarget.src = isDeposit
                    ? FXP_LOGO
                    : BANK_LOGO_FALLBACK;
                }}
              />
              <div className="min-w-0">
                <div className={`${labelStrong} text-sm font-semibold`}>
                  {toAmountDisplay}{" "}
                  <span className="uppercase">{toCurrencyDisplay}</span>
                </div>
                <div className={`${labelMuted} text-xs truncate`}>
                  {isDeposit
                    ? "Your FXPRIMUS Account"
                    : pickPaymentText(receiveBankInfo?.provider_name, "Bank Transfer")}
                </div>
              </div>
            </div>
            {isDeposit ? (
              <CopyableMonoRow
                label="Forex Account Number"
                value={pickPaymentText(receiveForexAccount)}
                isDark={isDark}
              />
            ) : (
              <>
                {pickPaymentText(receiveBankInfo?.account_name) ? (
                  <>
                    <div className={`${labelMuted} text-xs font-semibold mb-0.5`}>
                      Account Name
                    </div>
                    <div className={`${labelStrong} text-sm mb-2`}>
                      {receiveBankInfo?.account_name}
                    </div>
                  </>
                ) : null}
                <CopyableMonoRow
                  label="Account Number"
                  value={resolvePaymentAccountNumber(receiveBankInfo)}
                  isDark={isDark}
                />
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-0 md:ml-6 flex flex-col items-center justify-center py-2 gap-3 min-w-[9rem] max-w-[220px]">
          {qrPayload ? (
            <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeQrScanData(
                  qrPayload
                )}`}
                alt="QR Code"
                className="w-32 h-32"
              />
            </div>
          ) : (
            <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No QR data</span>
            </div>
          )}
          {howToSendDisplay ? (
            <HowToSendDialBlock
              value={howToSendDisplay}
              isDark={isDark}
              compact
              dialOnMobileOnly
              className="w-full"
            />
          ) : null}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-4 relative">
        {/* Connecting Line Background (gray) */}
        <div className="absolute top-5 left-[16.66%] right-[16.66%] h-0.5 bg-[#7B7B7B] z-0"></div>

        {/* Connecting Line Progress (colored) */}
        <div className="absolute top-5 left-[16.66%] right-[16.66%] h-0.5 z-0">
          <div
            className={`h-0.5 transition-all duration-500 ${currentStatus === "completed"
                ? "bg-[#1D8751] w-full"
                : currentStatus === "processing"
                  ? "bg-[#FF9500] w-1/2"
                  : currentStatus === "pending"
                    ? "bg-[#FF9500] w-0"
                    : "bg-[#7B7B7B] w-0"
              }`}
          ></div>
        </div>

        {/* Step 1: Pending Review */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${currentStatus === "pending"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "processing" || currentStatus === "completed"
                  ? "bg-[#1D8751] border-[#1D87511A]"
                  : "bg-[#23232B] border-[#35353E]"
              }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "pending" || currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M12 8v4l2 2"
                stroke={currentStatus === "pending" || currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${currentStatus === "pending"
                  ? "text-[#FF9500]"
                  : currentStatus === "processing" || currentStatus === "completed"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
                }`}
            >
              Pending Review
            </span>
            {currentStatus === "pending" && (
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
            {(currentStatus === "processing" || currentStatus === "completed") && (
              <div className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Processing */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${currentStatus === "processing"
                ? "bg-[#FF9500] border-[#FF95001A]"
                : currentStatus === "completed"
                  ? "bg-[#1D8751] border-[#1D87511A]"
                  : "bg-[#23232B] border-[#35353E]"
              }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M8 12h8M12 8v8"
                stroke={currentStatus === "processing" || currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${currentStatus === "processing"
                  ? "text-[#FF9500]"
                  : currentStatus === "completed"
                    ? "text-[#1D8751]"
                    : "text-[#7B7B7B]"
                }`}
            >
              Processing
            </span>
            {currentStatus === "processing" && (
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
            {currentStatus === "completed" && (
              <div className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Completed */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-4 ${currentStatus === "completed"
                ? "bg-[#1D8751] border-[#1D87511A]"
                : "bg-[#23232B] border-[#35353E]"
              }`}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke={currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke={currentStatus === "completed" ? "#fff" : "#7B7B7B"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold text-base ${currentStatus === "completed"
                  ? "text-[#1D8751]"
                  : "text-[#7B7B7B]"
                }`}
            >
              Completed
            </span>
            {currentStatus === "completed" && (
              <div className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[#1D8751] text-xs font-medium">
                  Complete
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div
        className={`${isDark ? "bg-[#23232B] border-[#35353E]" : "bg-white border-gray-200"
          } border-2 rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-4`}
      >
        {/* Title */}
        <div
          className={`${isDark ? "text-white" : "text-gray-900"
            } text-2xl font-semibold mb-4`}
        >
          Transaction Details
        </div>

        {/* Transaction ID Row */}
        <div className="flex items-center justify-between mb-1">
          <div
            className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-base font-medium`}
          >
            Transaction ID
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-base font-mono font-semibold`}
            >
              {currentExchange.forex_transaction_id || currentExchange.transaction_id}
            </span>
            <CopyButton
              value={currentExchange.forex_transaction_id || currentExchange.transaction_id}
              className="text-[#FFA200] hover:text-[#FFB833] transition-colors"
              showIcon={true}
            />
          </div>
        </div>

        {/* Dashed Divider */}
        <div
          className={`border-t border-dashed ${isDark ? "border-[#7B7B7B]" : "border-gray-400"
            } mb-4`}
        ></div>

        {/* From/To Labels Row */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-base font-medium`}
          >
            From
          </div>
          <div
            className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
              } text-base font-medium`}
          >
            To
          </div>
        </div>

        {/* From/To Content Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <img
                src={isDeposit ? BANK_LOGO_FALLBACK : FXP_LOGO}
                alt={isDeposit ? "Bank" : "FXPRIMUS"}
                className="w-8 h-8 rounded-full object-cover shrink-0"
                onError={(e) => {
                  e.currentTarget.src = isDeposit
                    ? BANK_LOGO_FALLBACK
                    : FXP_LOGO;
                }}
              />
              <div className="min-w-0">
                <div className={`${labelStrong} text-base font-semibold`}>
                  {fromAmountDisplay}{" "}
                  <span className="uppercase">{fromCurrencyDisplay}</span>
                </div>
                <div className={`${labelMuted} text-sm truncate`}>
                  {isDeposit
                    ? pickPaymentText(adminPayment?.provider_name, "Bank Transfer")
                    : "Your FXPRIMUS Account"}
                </div>
              </div>
            </div>
            {isDeposit ? (
              <>
                {pickPaymentText(adminPayment?.account_name) ? (
                  <>
                    <div className={`${labelMuted} text-sm font-medium mb-1`}>
                      Account Name
                    </div>
                    <div className={`${labelStrong} text-sm mb-3`}>
                      {adminPayment?.account_name}
                    </div>
                  </>
                ) : null}
                <CopyableMonoRow
                  label="Account Number"
                  value={resolvePaymentAccountNumber(adminPayment)}
                  isDark={isDark}
                />
              </>
            ) : (
              <CopyableMonoRow
                label="Forex Account Number"
                value={pickPaymentText(sendForexAccount)}
                isDark={isDark}
              />
            )}
          </div>

          <div className="min-w-0 md:text-right">
            <div className="flex items-center gap-2 mb-3 md:justify-end">
              <div className="min-w-0 md:text-right md:order-1">
                <div className={`${labelStrong} text-base font-semibold`}>
                  {toAmountDisplay}{" "}
                  <span className="uppercase">{toCurrencyDisplay}</span>
                </div>
                <div className={`${labelMuted} text-sm truncate`}>
                  {isDeposit
                    ? "Your FXPRIMUS Account"
                    : pickPaymentText(receiveBankInfo?.provider_name, "Bank Transfer")}
                </div>
              </div>
              <img
                src={isDeposit ? FXP_LOGO : BANK_LOGO_FALLBACK}
                alt={isDeposit ? "FXPRIMUS" : "Bank"}
                className="w-8 h-8 rounded-full object-cover shrink-0 md:order-2"
                onError={(e) => {
                  e.currentTarget.src = isDeposit
                    ? FXP_LOGO
                    : BANK_LOGO_FALLBACK;
                }}
              />
            </div>
            {isDeposit ? (
              <CopyableMonoRow
                label="Forex Account Number"
                value={pickPaymentText(receiveForexAccount)}
                isDark={isDark}
              />
            ) : (
              <>
                {pickPaymentText(receiveBankInfo?.account_name) ? (
                  <>
                    <div className={`${labelMuted} text-sm font-medium mb-1 md:text-right`}>
                      Account Name
                    </div>
                    <div className={`${labelStrong} text-sm mb-3 md:text-right`}>
                      {receiveBankInfo?.account_name}
                    </div>
                  </>
                ) : null}
                <CopyableMonoRow
                  label="Account Number"
                  value={resolvePaymentAccountNumber(receiveBankInfo)}
                  isDark={isDark}
                />
              </>
            )}
          </div>
        </div>

        {/* Additional Details */}
        {currentExchange.user_notes && (
          <>
            <div
              className={`border-t border-dashed ${isDark ? "border-[#7B7B7B]" : "border-gray-400"
                } my-4`}
            ></div>
            <div className="flex items-center justify-between">
              <div
                className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                  } text-base font-medium`}
              >
                Notes
              </div>
              <div
                className={`${isDark ? "text-white" : "text-gray-900"
                  } text-base`}
              >
                {currentExchange.user_notes}
              </div>
            </div>
          </>
        )}

        {/* Timestamps */}
        <div
          className={`border-t border-dashed ${isDark ? "border-[#7B7B7B]" : "border-gray-400"
            } my-4`}
        ></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div
              className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-sm font-medium mb-1`}
            >
              Created At
            </div>
            <div
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-sm`}
            >
              {new Date(currentExchange.timestamp || currentExchange.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <div
              className={`${isDark ? "text-[#7B7B7B]" : "text-gray-600"
                } text-sm font-medium mb-1`}
            >
              Updated At
            </div>
            <div
              className={`${isDark ? "text-white" : "text-gray-900"
                } text-sm`}
            >
              {new Date(currentExchange.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>


    </div>
    <FailureStatusModal
      isOpen={failureModal.isOpen}
      status={failureModal.status}
      message={failureModal.message}
      onClose={() =>
        setFailureModal({ isOpen: false, status: "", message: undefined })
      }
      onBackToForm={() => {
        setFailureModal({ isOpen: false, status: "", message: undefined });
        router.push("/dashboard/express-exchange");
      }}
      isDark={isDark}
    />
    </>
  );
}

// Loading component for Suspense boundary
function ForexStatusLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#18181D]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1D8751]"></div>
        <p className="text-[#788099] text-lg">Loading forex exchange details...</p>
      </div>
    </div>
  );
}

// Wrap with Suspense boundary
export default function ForexStatusPage() {
  return (
    <Suspense fallback={<ForexStatusLoading />}>
      <ForexStatusContent />
    </Suspense>
  );
}
