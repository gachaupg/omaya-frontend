import React, { useState, useEffect, useRef } from "react";
import CopyButton from "@/components/ui/CopyButton";
import DownloadReceiptButton from "@/components/ui/DownloadReceiptButton";
import { useTheme } from "@/context/theme";
import { ExpressSuccessHero } from "@/features/express/components/ExpressSuccessHero";
import { formatSwapDisplayTicker } from "../utils/swapDisplayFormat";

const formatDateTimeEastAfrica = (input: Date | number | string): string => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

const GREEN = "#309A64";

interface SuccessPageProps {
  transactionData?: {
    type?: "swap";
    amount?: number;
    asset?: any;
    network?: any;
    transactionId?: string;
    totalAmountDue?: string;
    commission?: string;
    networkFee?: string;
    currency?: string;
    websocketUrl?: string;
    websocket_url?: string;
    status?: string;
    message?: string;
    details?: {
      from_currency?: string;
      to_currency?: string;
      to_network?: string;
      estimated_amount?: number;
      changenow_id?: string;
    };
  };
  websocketData?: {
    type: "status_update" | "final_status";
    timestamp?: string;
    data: {
      id?: string;
      status?: string;
      amountFrom?: number;
      amountTo?: number;
      expectedAmountFrom?: number;
      expectedAmountTo?: number;
      fromCurrency?: string;
      toCurrency?: string;
      fromNetwork?: string;
      toNetwork?: string;
      payinAddress?: string;
      payoutAddress?: string;
      payinHash?: string;
      payoutHash?: string;
      createdAt?: string;
      updatedAt?: string;
      [key: string]: any;
    };
  };
  transactionId?: string;
  date?: string;
  paidAmount?: string | number;
  paidCurrency?: string;
  receivedAmount?: string | number;
  receivedCurrency?: string;
  payinMethod?: string;
  payoutMethod?: string;
  transactionHash?: string;
  netAmount?: string | number;
}

const SuccessPage: React.FC<SuccessPageProps> = ({
  transactionData,
  websocketData,
  transactionId = "TXNWSU09E2DS",
  date = new Date().toLocaleString(),
  paidAmount = "USD 1",
  paidCurrency = "USD",
  receivedAmount = ".0035",
  receivedCurrency = "USDT",
  payinMethod = "Salam Bank",
  payoutMethod = "usdt-erc20",
  transactionHash = "0x96ba940eec77c56e7a2806c5c269410303dce20cc2226ca1439659037940ce5b",
  netAmount = ".99",
}) => {
  const { isDark } = useTheme();
  const [formattedDate, setFormattedDate] = useState<string>("");
  const receiptRef = useRef<HTMLDivElement>(null);

  const getRealData = () => {
    if (!transactionData) {
      return {
        transactionId,
        date: new Date().toISOString(),
        paidAmount,
        paidCurrency,
        receivedAmount,
        receivedCurrency,
        payinMethod,
        payoutMethod,
        transactionHash,
        netAmount,
      };
    }

    let currency =
      transactionData.asset?.ticker ||
      transactionData.asset?.symbol ||
      transactionData.asset?.name ||
      transactionData.currency ||
      "USDT";

    if (websocketData?.data?.from_currency) {
      currency = websocketData.data.from_currency.toUpperCase();
    } else if (websocketData?.data?.fromCurrency) {
      currency = websocketData.data.fromCurrency.toUpperCase();
    }

    if (websocketData?.data?.currency) {
      currency = websocketData.data.currency.toUpperCase();
    }

    let amount = transactionData.amount || 0;
    let estimatedAmount =
      transactionData.details?.estimated_amount ||
      transactionData.totalAmountDue ||
      amount;

    if (!amount && websocketData?.data?.amount_from) {
      amount = parseFloat(websocketData.data.amount_from);
    }

    if (websocketData?.data) {
      const wsData = websocketData.data;
      const isDirectFlow =
        !wsData.from_currency ||
        !wsData.to_currency ||
        wsData.from_currency === wsData.to_currency ||
        (wsData.amount && wsData.net_amount && !wsData.amount_from && !wsData.amount_to);

      if (isDirectFlow) {
        if (wsData.amount !== null && wsData.amount !== undefined) {
          amount = parseFloat(wsData.amount);
          estimatedAmount = parseFloat(wsData.amount);
        }
      } else {
        if (wsData.amount_from !== null && wsData.amount_from !== undefined) {
          amount = parseFloat(wsData.amount_from);
        } else if (wsData.amountFrom !== null && wsData.amountFrom !== undefined) {
          amount = wsData.amountFrom;
        } else if (wsData.expectedAmountFrom !== null && wsData.expectedAmountFrom !== undefined) {
          amount = wsData.expectedAmountFrom;
        }

        if (wsData.amount_to !== null && wsData.amount_to !== undefined) {
          estimatedAmount = parseFloat(wsData.amount_to);
        } else if (wsData.amountTo !== null && wsData.amountTo !== undefined) {
          estimatedAmount = wsData.amountTo;
        } else if (wsData.expectedAmountTo !== null && wsData.expectedAmountTo !== undefined) {
          estimatedAmount = wsData.expectedAmountTo;
        }
      }
    }

    let txId =
      transactionData.transactionId ||
      transactionData.details?.changenow_id ||
      "N/A";

    if (websocketData?.data?.swap_id) {
      txId = websocketData.data.swap_id;
    } else if (websocketData?.data?.id) {
      txId = websocketData.data.id;
    } else if (websocketData?.data?.transaction_id) {
      txId = websocketData.data.transaction_id;
    }

    let txHash = txId;
    if (websocketData?.data?.payout_hash) {
      txHash = websocketData.data.payout_hash;
    } else if (websocketData?.data?.payin_hash) {
      txHash = websocketData.data.payin_hash;
    } else if (websocketData?.data?.transaction_hash) {
      txHash = websocketData.data.transaction_hash;
    } else if (websocketData?.data?.tx_hash) {
      txHash = websocketData.data.tx_hash;
    } else if (websocketData?.data?.payinHash) {
      txHash = websocketData.data.payinHash;
    } else if (websocketData?.data?.payoutHash) {
      txHash = websocketData.data.payoutHash;
    }

    const formatAmount = (amt: number | string) => {
      const num = typeof amt === "string" ? parseFloat(amt) : amt;
      return Number.isNaN(num) ? "0" : num.toFixed(8).replace(/\.?0+$/, "");
    };

    const fromCurrency =
      websocketData?.data?.from_currency ||
      websocketData?.data?.fromCurrency ||
      currency;
    const toCurrency =
      websocketData?.data?.to_currency ||
      websocketData?.data?.toCurrency ||
      currency;

    let transactionDate = new Date().toISOString();
    if (websocketData?.timestamp) {
      transactionDate = websocketData.timestamp;
    } else if (websocketData?.data?.updatedAt) {
      transactionDate = websocketData.data.updatedAt;
    } else if (websocketData?.data?.createdAt) {
      transactionDate = websocketData.data.createdAt;
    }

    return {
      transactionId: txId,
      date: transactionDate,
      paidAmount: `${formatAmount(amount)} ${fromCurrency.toUpperCase()}`,
      paidCurrency: fromCurrency.toUpperCase(),
      receivedAmount: formatAmount(estimatedAmount),
      receivedCurrency: toCurrency.toUpperCase(),
      payinMethod: `${formatSwapDisplayTicker(fromCurrency)} Network`,
      payoutMethod: `${formatSwapDisplayTicker(toCurrency)} Network`,
      transactionHash: txHash,
      netAmount: formatAmount(estimatedAmount),
    };
  };

  const realData = getRealData();
  const receivedTicker = formatSwapDisplayTicker(realData.receivedCurrency);

  useEffect(() => {
    try {
      const dateObj = new Date(realData.date);
      if (!Number.isNaN(dateObj.getTime())) {
        setFormattedDate(formatDateTimeEastAfrica(dateObj));
      } else {
        setFormattedDate(formatDateTimeEastAfrica(new Date()));
      }
    } catch {
      setFormattedDate(formatDateTimeEastAfrica(new Date()));
    }
  }, [realData.date]);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-3 sm:px-4 pt-0 pb-2">
      <ExpressSuccessHero variant="swap" className="mb-1" />

      <div
        ref={receiptRef}
        className={`w-full rounded-[18px] shadow-xl border-2 ${
          isDark
            ? "bg-[var(--card-color)] border-[#35353E]"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="p-6">
          <h2
            className={`text-lg font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Transaction Details
          </h2>
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-2">
            <div className="flex-1 min-w-0">
              <div className={isDark ? "text-gray-400" : "text-gray-600"}>
                Transaction ID
              </div>
              <div
                className={`flex items-center gap-2 font-mono break-all ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                <span className="flex-1 min-w-0 break-all">
                  {realData.transactionId}
                </span>
                <CopyButton
                  value={realData.transactionId}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                  showText={false}
                />
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className={isDark ? "text-gray-400" : "text-gray-600"}>
                Date & Time (EAT)
              </div>
              <div className={isDark ? "text-white" : "text-gray-900"}>
                {formattedDate || realData.date}
              </div>
            </div>
          </div>
        </div>

        <div className="pl-6 pr-6 pb-6">
          <div
            className={`border-t border-1 my-4 ${
              isDark ? "border-gray-600" : "border-gray-300"
            }`}
          />

          <h3
            className={`text-lg font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Swap Summary
          </h3>
          <div
            className={`border-t border-dashed my-4 ${
              isDark ? "border-gray-600" : "border-gray-300"
            }`}
          />

          <div className="flex justify-between mb-4">
            <div>
              <div
                className={`text-sm mb-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                You Paid
              </div>
              <div className="font-bold" style={{ color: GREEN }}>
                {realData.paidAmount}
              </div>
              <div
                className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Via {realData.payinMethod}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm mb-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                You Received
              </div>
              <div className="font-bold" style={{ color: GREEN }}>
                {realData.receivedAmount} {receivedTicker}
              </div>
              <div
                className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Via {realData.payoutMethod}
              </div>
            </div>
          </div>

          <div
            className={`border-t border-dashed my-4 ${
              isDark ? "border-gray-600" : "border-gray-300"
            }`}
          />

          <div className="space-y-3">
            <div>
              <div
                className={`text-sm mb-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Transaction Hash
              </div>
              <div
                className={`flex items-center gap-2 text-[12px] font-mono break-all ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                <span className="flex-1 min-w-0 break-all">
                  {realData.transactionHash}
                </span>
                <CopyButton
                  value={realData.transactionHash}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                  showText={false}
                />
              </div>
            </div>
            <div className="flex justify-between mb-3">
              <div
                className={`text-sm ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Net Amount Processed
              </div>
              <div
                className="font-mono flex items-center gap-2"
                style={{ color: GREEN }}
              >
                {transactionData?.asset?.icon && (
                  <img
                    src={transactionData.asset.icon}
                    alt={receivedTicker}
                    className="w-4 h-4 rounded-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <span>{realData.netAmount}</span>
                <span>{receivedTicker}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DownloadReceiptButton
        receiptRef={receiptRef}
        fileNamePrefix="OMAYA_Swap_Receipt"
        transactionId={realData.transactionId}
      />

      <div className="w-full mt-2 space-y-3">
        <div className="w-full rounded-xl bg-[#1D8751] p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base sm:text-lg mb-1">
              Swap Completed
            </h3>
            <p className="text-white/95 text-sm sm:text-base leading-relaxed">
              Your {receivedTicker} has been sent to your wallet. It may take a
              few minutes to reflect in your balance.
            </p>
          </div>
        </div>

        <div
          className={`text-center text-xs ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Need help? Contact our support team at{" "}
          <a
            href="mailto:support@omayaexchange.com"
            className="underline text-green-400"
          >
            support@omayaexchange.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
