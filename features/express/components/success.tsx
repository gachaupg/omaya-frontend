import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";
import DownloadReceiptButton from "@/components/ui/DownloadReceiptButton";
import { useTheme } from "@/context/theme";
import { ExpressSuccessHero } from "./ExpressSuccessHero";
import {
  resolvePaymentAccountNumber,
  resolvePaymentProviderName,
} from "@/features/moneyX/utils/paymentAccount";
import {
  resolveExpressReceiveCurrency,
  resolveExpressSendCurrency,
  resolveExpressDepositSuccessDisplay,
  resolveExpressWithdrawalSuccessDisplay,
} from "../utils/successAmountDisplay";
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
    type: "deposit" | "withdrawal";
    isMoneyX?: boolean;
    amount: number;
    receiveAmount?: number;
    netAmount?: unknown;
    net_amount?: unknown;
    fromPaymentMethod?: any;
    toPaymentMethod?: any;
    toPaymentDetail?: any;
    moneyXTransaction?: any;
    asset: any;
    paymentDetail?: any;
    paymentDetails?: any[];
    walletAddress: string;
    network: any;
    transactionId?: string;
    depositCode?: string;
    totalAmountDue?: string;
    commission?: string;
    networkFee?: string;
    currency?: string;
    websocketUrl?: string;
    websocket_url?: string;
    status?: string;
    message?: string;
    withdrawalAddress?: string;
    details?: {
      withdrawal_address?: string;
      payout_address?: string;
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
      // New fields for direct and ChangeNow flows
      amount_from?: number;
      amount_to?: number;
      amount_expected_from?: number;
      amount_expected_to?: number;
      from_currency?: string;
      to_currency?: string;
      paid_amount?: number;
      estimated_amount?: number;
      net_amount?: string;
      commission?: string;
      network_fee?: string;
      payin_hash?: string;
      payout_hash?: string;
      transaction_hash?: string;
      tx_hash?: string;
      transaction_id?: string;
      swap_id?: string;
      is_final?: boolean;
      message?: string;
      last_checked?: string;
      update_count?: number;
      admin_approved?: boolean;
      is_conversion?: boolean;
      rate?: number;
      changelly_fee?: string;
      source?: string;
      original_status?: string;
      api_status?: string;
      api_message?: string;
      api_timestamp?: string;
      from_database?: boolean;
      [key: string]: any;
    };
  };
  // Fallback props for backward compatibility
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
  /** Net / you-receive amount shown on the processing page (deposit / withdrawal USD). */
  processingReceiveAmount?: number | null;
  /** Crypto send amount from the processing page (withdrawal only). */
  processingSendAmount?: number | null;
}

const SuccessPage: React.FC<SuccessPageProps> = ({
  transactionData,
  websocketData,
  processingReceiveAmount,
  processingSendAmount,
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
  const router = useRouter();
  const { isDark } = useTheme();
  const [formattedDate, setFormattedDate] = useState<string>("");
  const receiptRef = useRef<HTMLDivElement>(null);

  const isMoneyX =
    transactionData?.isMoneyX === true ||
    (!!transactionData?.fromPaymentMethod && !!transactionData?.toPaymentMethod);

  const formatAmount = (amt: number | string, cryptoPrecision = false) => {
    const num = typeof amt === "string" ? parseFloat(amt) : amt;
    if (Number.isNaN(num)) return "0";
    const decimals = cryptoPrecision ? 8 : 2;
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  };

  const getMoneyXData = () => {
    const fromPm =
      transactionData?.fromPaymentMethod || transactionData?.paymentDetail;
    const toPm =
      transactionData?.toPaymentMethod || transactionData?.toPaymentDetail;
    const moneyXTx = transactionData?.moneyXTransaction as
      | Record<string, unknown>
      | undefined;
    const wsData = websocketData?.data;

    let paidAmount = transactionData?.amount ?? 0;
    let receivedAmount =
      transactionData?.receiveAmount ?? transactionData?.amount ?? 0;

    if (wsData) {
      if (wsData.amount != null) {
        const parsed = parseFloat(String(wsData.amount));
        if (!Number.isNaN(parsed)) paidAmount = parsed;
      }
      if (wsData.net_amount != null) {
        const parsed = parseFloat(String(wsData.net_amount));
        if (!Number.isNaN(parsed)) receivedAmount = parsed;
      } else if (wsData.amount_to != null) {
        receivedAmount = Number(wsData.amount_to);
      }
    }

    const txId =
      String(
        wsData?.transaction_id ||
          wsData?.id ||
          transactionData?.transactionId ||
          transactionData?.moneyXTransaction?.moneyx_transaction_id ||
          ""
      ).trim() || "N/A";

    let transactionDate = new Date().toISOString();
    if (websocketData?.timestamp) {
      transactionDate = websocketData.timestamp;
    } else if (wsData?.last_checked) {
      transactionDate = String(wsData.last_checked);
    }

    const toAccount = String(
      transactionData?.walletAddress ||
        moneyXTx?.recipient_account_number ||
        resolvePaymentAccountNumber(toPm) ||
        ""
    ).trim();

    return {
      transactionId: txId,
      date: transactionDate,
      paidAmount: formatAmount(paidAmount),
      receivedAmount: formatAmount(receivedAmount),
      fromProvider: resolvePaymentProviderName(fromPm) || "—",
      toProvider: resolvePaymentProviderName(toPm) || "—",
      fromAccount:
        resolvePaymentAccountNumber(fromPm) ||
        resolvePaymentAccountNumber(transactionData?.paymentDetail) ||
        "—",
      toAccount: toAccount || "—",
    };
  };

  // Extract real data from transactionData and websocketData if available
  const getRealData = () => {
    if (!transactionData) {
      return {
        transactionId,
        date: new Date().toLocaleString(),
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

    // Extract data based on transaction type
    const isDeposit = transactionData.type === "deposit";
    const isWithdrawal = transactionData.type === "withdrawal";
    
    let fromCurrency = resolveExpressSendCurrency(transactionData);
    let toCurrency = resolveExpressReceiveCurrency(transactionData);
    
    // Override with websocket data if available
    if (websocketData?.data) {
      const wsData = websocketData.data;
      
      // Handle from_currency (what user sent)
      if (wsData.from_currency) {
        fromCurrency = wsData.from_currency.toUpperCase();
      } else if (wsData.fromCurrency) {
        fromCurrency = wsData.fromCurrency.toUpperCase();
      }
      
      // Handle to_currency (what user receives)
      if (wsData.to_currency) {
        toCurrency = wsData.to_currency.toUpperCase();
      } else if (wsData.toCurrency) {
        toCurrency = wsData.toCurrency.toUpperCase();
      }
      
      // Check for deposit-specific currency from websocket data
      if (wsData.currency) {
        fromCurrency = wsData.currency.toUpperCase();
        toCurrency = wsData.currency.toUpperCase();
      }
    }
    
    // For display purposes, use fromCurrency as the main currency
    const currency = fromCurrency;
    
    const network = transactionData.network?.network_type || 
                   transactionData.network?.network_id || 
                   transactionData.network?.name ||
                   "Unknown";
    
    // Get payment method with better fallbacks
    const paymentMethod = isDeposit 
      ? (transactionData.paymentDetail?.name || 
         transactionData.paymentDetails?.[0]?.name || 
         transactionData.paymentDetail?.bank_name ||
         "Bank Transfer")
      : (transactionData.details?.to_network || 
         transactionData.details?.payout_address ||
         network);
    
    // Get amounts - prefer websocket/socket data (actual processed amounts) over user-typed values
    let amount = transactionData.amount || 0;
    let estimatedAmount = transactionData.details?.estimated_amount ||
      transactionData.totalAmountDue ||
      amount;

    // Use websocket data for amounts when available (actual processed amounts, not what user typed)
    if (websocketData?.data) {
      const wsData = websocketData.data;
      
      // Check if this is a direct use flow (same currency) or conversion flow (different currencies)
      const isDirectFlow = !wsData.from_currency || !wsData.to_currency || 
                          wsData.from_currency === wsData.to_currency ||
                          (wsData.amount && wsData.net_amount && !wsData.amount_from && !wsData.amount_to);
      
      const isConversionFlow = wsData.from_currency && wsData.to_currency && 
                              wsData.from_currency !== wsData.to_currency &&
                              (wsData.amount_from !== null || wsData.amount_to !== null);
      
      if (isDirectFlow) {
        // Direct use flow: use 'amount' for paid and received amounts, 'net_amount' for net amount
        // For direct flow: "You Paid" = amount, "You Received" = amount, "Net Amount Processed" = net_amount
        if (wsData.amount !== null && wsData.amount !== undefined) {
          amount = parseFloat(wsData.amount);
          estimatedAmount = parseFloat(wsData.amount); // "You Received" should be amount
        }
      } else if (isConversionFlow) {
        // Conversion flow: use amount_from for paid, amount_to for received
        // For conversion flow: "You Paid" = amount_from, "You Received" = amount_to
        if (wsData.amount_from !== null && wsData.amount_from !== undefined) {
          amount = wsData.amount_from;
        }
        if (wsData.amount_to !== null && wsData.amount_to !== undefined) {
          estimatedAmount = wsData.amount_to; // "You Received" should be amount_to
        }
      } else {
        // ChangeNow flow: use amount_from, amount_to, etc.
      // Handle amount_from (what user sent/paid) - highest priority
      if (wsData.amount_from !== null && wsData.amount_from !== undefined) {
        amount = wsData.amount_from;
      } else if (wsData.amountFrom !== null && wsData.amountFrom !== undefined) {
        amount = wsData.amountFrom;
      } else if (wsData.paid_amount !== null && wsData.paid_amount !== undefined) {
        amount = wsData.paid_amount;
      } else if (wsData.amount_expected_from !== null && wsData.amount_expected_from !== undefined) {
        amount = wsData.amount_expected_from;
      } else if (wsData.expectedAmountFrom !== null && wsData.expectedAmountFrom !== undefined) {
        amount = wsData.expectedAmountFrom;
      }
      
      // Handle amount_to (what user receives) - highest priority
      if (wsData.amount_to !== null && wsData.amount_to !== undefined) {
        estimatedAmount = wsData.amount_to;
      } else if (wsData.amountTo !== null && wsData.amountTo !== undefined) {
        estimatedAmount = wsData.amountTo;
      } else if (wsData.estimated_amount !== null && wsData.estimated_amount !== undefined) {
        estimatedAmount = wsData.estimated_amount;
      } else if (wsData.amount_expected_to !== null && wsData.amount_expected_to !== undefined) {
        estimatedAmount = wsData.amount_expected_to;
      } else if (wsData.expectedAmountTo !== null && wsData.expectedAmountTo !== undefined) {
        estimatedAmount = wsData.expectedAmountTo;
      }
      }
    }
    
    // Get transaction hash/ID with websocket data priority
    let txId = transactionData.transactionId || 
              transactionData.details?.changenow_id || 
              transactionData.depositCode ||
              "N/A";
    
    // Use websocket ID if available
    if (websocketData?.data) {
      const wsData = websocketData.data;
      
      // Check for transaction_id from new deposit format
      if (wsData.transaction_id) {
        txId = wsData.transaction_id;
      } else if (wsData.id) {
        txId = wsData.id;
      } else if (wsData.swap_id) {
        txId = wsData.swap_id;
      }
    }
    
    // Get transaction hash from websocket data
    let txHash = txId;
    
    // Check for transaction hash from websocket data (highest priority)
    if (websocketData?.data) {
      const wsData = websocketData.data;
      
      // Check for payout_hash (what user receives) - highest priority for withdrawals
      if (wsData.payout_hash) {
        txHash = wsData.payout_hash;
      } else if (wsData.payoutHash) {
        txHash = wsData.payoutHash;
      } else if (wsData.transaction_hash) {
        txHash = wsData.transaction_hash;
      } else if (wsData.tx_hash) {
        txHash = wsData.tx_hash;
      } else if (wsData.payin_hash) {
        txHash = wsData.payin_hash;
      } else if (wsData.payinHash) {
        txHash = wsData.payinHash;
      }
    }
    
    // Net amount: prefer websocket net_amount, else estimatedAmount (actual processed)
    let calculatedNetAmount = estimatedAmount;
    if (websocketData?.data) {
      const wsData = websocketData.data;
      if (wsData.from_currency && wsData.to_currency &&
          wsData.from_currency !== wsData.to_currency &&
          wsData.amount_to != null) {
        calculatedNetAmount = wsData.amount_to;
      } else if (wsData.net_amount != null) {
        const parsed = parseFloat(wsData.net_amount);
        if (!isNaN(parsed)) calculatedNetAmount = parsed;
      }
    }
    
    // Get date from websocket data if available, otherwise use current time
    let transactionDate = new Date().toISOString();
    if (websocketData?.timestamp) {
      transactionDate = websocketData.timestamp;
    } else if (websocketData?.data?.last_checked) {
      transactionDate = websocketData.data.last_checked;
    }

    if (isDeposit) {
      const depositDisplay = resolveExpressDepositSuccessDisplay({
        websocketData,
        transactionData,
        processingReceiveAmount,
      });
      const formattedReceive = formatAmount(depositDisplay.receiveAmount, true);

      return {
        transactionId: txId,
        date: transactionDate,
        paidAmount: formatAmount(depositDisplay.paidAmount),
        paidCurrency: depositDisplay.paidCurrency,
        receivedAmount: formattedReceive,
        receivedCurrency: depositDisplay.receiveCurrency,
        payinMethod: paymentMethod,
        payoutMethod: `${toCurrency} Wallet`,
        transactionHash: txHash,
        netAmount: formattedReceive,
      };
    }

    if (isWithdrawal) {
      const withdrawalDisplay = resolveExpressWithdrawalSuccessDisplay({
        websocketData,
        transactionData,
        processingReceiveAmount,
        processingSendAmount,
      });
      const formattedCrypto = formatAmount(withdrawalDisplay.paidAmount, true);
      const formattedUsd = formatAmount(withdrawalDisplay.receiveAmount);

      return {
        transactionId: txId,
        date: transactionDate,
        paidAmount: formattedCrypto,
        paidCurrency: withdrawalDisplay.paidCurrency,
        receivedAmount: formattedUsd,
        receivedCurrency: withdrawalDisplay.receiveCurrency,
        payinMethod: `${withdrawalDisplay.paidCurrency} Wallet`,
        payoutMethod: paymentMethod,
        transactionHash: txHash,
        netAmount: formattedUsd,
      };
    }
    
    return {
      transactionId: txId,
      date: transactionDate,
      paidAmount: `${formatAmount(amount)} ${fromCurrency}`,
      paidCurrency: fromCurrency,
      receivedAmount: formatAmount(estimatedAmount),
      receivedCurrency: toCurrency,
      payinMethod: isDeposit ? paymentMethod : `${fromCurrency} Wallet`,
      payoutMethod: isWithdrawal ? paymentMethod : `${toCurrency} Wallet`,
      transactionHash: txHash,
      netAmount: formatAmount(calculatedNetAmount),
    };
  };

  const realData = getRealData();
  const moneyXData = isMoneyX ? getMoneyXData() : null;
  const activeTxId = isMoneyX && moneyXData
    ? moneyXData.transactionId
    : realData.transactionId;
  const activeDate = isMoneyX && moneyXData ? moneyXData.date : realData.date;

  // Extract transaction type for use in JSX
  const isDeposit = transactionData?.type === "deposit";
  const isWithdrawal = transactionData?.type === "withdrawal";

  // Format date in East Africa Time (EAT) on client side
  useEffect(() => {
    try {
      const dateObj = new Date(activeDate);
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate(formatDateTimeEastAfrica(dateObj));
      } else {
        setFormattedDate(formatDateTimeEastAfrica(new Date()));
      }
    } catch (error) {
      setFormattedDate(formatDateTimeEastAfrica(new Date()));
    }
  }, [activeDate]);
  
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-3 sm:px-4 pt-0 pb-2">
      <ExpressSuccessHero
        variant={isMoneyX ? "moneyx" : "exchange"}
        className="mb-1"
      />

      {/* Main Content Container — captured for receipt download */}
      <div
        ref={receiptRef}
        className={`w-full rounded-[18px] shadow-xl border-2 ${
        isDark 
          ? "bg-[var(--card-color)] border-[#35353E]" 
          : "bg-white border-gray-200"
      }`}>
        {/* Transaction Details Section */}
        <div className="p-6">
          <h2 className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}>Transaction Details</h2>
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-2">
            <div className="flex-1 min-w-0">
              <div className={`${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>Transaction ID</div>
              <div className={`flex items-center gap-2 font-mono break-all ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                <span className="flex-1 min-w-0 break-all">{activeTxId}</span>
                <CopyButton
                  value={activeTxId}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                  showText={false}
                />
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className={`${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Date & Time (EAT)
              </div>
              <div className={`${
                isDark ? "text-white" : "text-gray-900"
              }`}>{formattedDate || activeDate}</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pl-6 pr-6 pb-6">
          <div className={`border-t border-1 my-4 ${
            isDark ? "border-gray-600" : "border-gray-300"
          }`} />

          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            {isMoneyX ? "Transfer Summary" : "Exchange Summary"}
          </h3>
          <div className={`border-t border-dashed my-4 ${
            isDark ? "border-gray-600" : "border-gray-300"
          }`} />

          {isMoneyX && moneyXData ? (
            <>
              <div className="flex justify-between mb-4">
                <div>
                  <div className={`text-sm mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>You Paid</div>
                  <div className="font-bold">
                    {moneyXData.paidAmount} USD
                  </div>
                  <div className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>Via {moneyXData.fromProvider}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>You Received</div>
                  <div className="font-bold" style={{ color: GREEN }}>
                    {moneyXData.receivedAmount} USD
                  </div>
                  <div className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>Via {moneyXData.toProvider}</div>
                </div>
              </div>

              <div className={`border-t border-dashed my-4 ${
                isDark ? "border-gray-600" : "border-gray-300"
              }`} />

              <div className="space-y-4">
                <div>
                  <div className={`text-sm mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>From account number</div>
                  <div className={`flex items-center gap-2 font-mono text-sm break-all ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    <span className="flex-1 min-w-0">{moneyXData.fromAccount}</span>
                    {moneyXData.fromAccount !== "—" && (
                      <CopyButton
                        value={moneyXData.fromAccount}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                        showText={false}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div className={`text-sm mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>To account number</div>
                  <div className={`flex items-center gap-2 font-mono text-sm break-all ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    <span className="flex-1 min-w-0">{moneyXData.toAccount}</span>
                    {moneyXData.toAccount !== "—" && (
                      <CopyButton
                        value={moneyXData.toAccount}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                        showText={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between mb-4">
                <div>
                  <div className={`text-sm mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>You Paid</div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{realData.paidAmount}</span>
                    {(isDeposit || isWithdrawal) && realData.paidCurrency && (
                      <span>{realData.paidCurrency}</span>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>Via {realData.payinMethod}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>You Received</div>
                  <div className="font-bold flex items-center justify-end gap-2" style={{ color: GREEN }}>
                    <span>{realData.receivedAmount}</span>
                    <span>{realData.receivedCurrency}</span>
                  </div>
                </div>
              </div>

              <div className={`border-t border-dashed my-4 ${
                isDark ? "border-gray-600" : "border-gray-300"
              }`} />

              <div className="space-y-3">
                <div>
                  <div className={`text-sm mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>Transaction Hash</div>
                  <div className={`flex items-center gap-2 text-[12px] font-mono break-all ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    <span className="flex-1 min-w-0 break-all">{realData.transactionHash}</span>
                    <CopyButton
                      value={realData.transactionHash}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
                      showText={false}
                    />
                  </div>
                </div>
                <div className="flex justify-between mb-3">
                  <div className={`text-sm ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    Net Amount Processed
                  </div>
                  <div className="font-mono flex items-center gap-2" style={{ color: GREEN }}>
                    {isDeposit &&
                      (transactionData?.asset?.icon ||
                        transactionData?.asset?.icon_url ||
                        transactionData?.asset?.image_url ||
                        transactionData?.asset?.asset_image ||
                        transactionData?.asset?.image) && (
                      <img
                        src={
                          transactionData.asset.icon ||
                          transactionData.asset.icon_url ||
                          transactionData.asset.image_url ||
                          transactionData.asset.asset_image ||
                          transactionData.asset.image
                        }
                        alt={realData.receivedCurrency}
                        className="w-4 h-4 rounded-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span>{realData.netAmount}</span>
                    <span>{realData.receivedCurrency}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <DownloadReceiptButton
        receiptRef={receiptRef}
        fileNamePrefix={`OMAYA_${isMoneyX ? "MoneyX" : "Exchange"}_Receipt`}
        transactionId={activeTxId}
      />

      {/* Transaction Completed Banner */}
      <div className="w-full mt-2 space-y-3">
        <div className="w-full rounded-xl bg-[#1D8751] p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base sm:text-lg mb-1">
              Transaction Completed
            </h3>
            <p className="text-white/95 text-sm sm:text-base leading-relaxed">
              {isMoneyX
                ? "Your MoneyX transfer is complete. Funds have been sent to the recipient account."
                : isWithdrawal
                  ? `Your ${realData.receivedCurrency} payout has been processed. It may take a few minutes to reflect in your bank account.`
                  : `Your ${realData.receivedCurrency} has been sent to your wallet. It may take a few minutes to reflect in your balance.`}
            </p>
          </div>
        </div>
        
        <div className={`text-center text-xs ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}>
          Need help? Contact our support team at{" "}
          <a href="mailto:support@omayaexchange.com" className="underline text-green-400">
            support@omayaexchange.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
