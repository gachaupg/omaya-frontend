import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";
import DownloadReceiptButton from "@/components/ui/DownloadReceiptButton";
import { useTheme } from "@/context/theme";
import { ExpressSuccessHero } from "@/features/express/components/ExpressSuccessHero";
import {
  resolveExpressReceiveCurrency,
  resolveExpressSendCurrency,
  resolveExpressDepositSuccessDisplay,
  resolveExpressWithdrawalSuccessDisplay,
  resolveHomeExpressSuccessReceiveCurrency,
} from "../../utils/successAmountDisplay";

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
    amount: number;
    receiveAmount?: number;
    netAmount?: unknown;
    net_amount?: unknown;
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
  /** Net / you-receive amount shown on the processing page (deposit only). */
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
  const { isDark, isLight } = useTheme();
  const [formattedDate, setFormattedDate] = useState<string>("");
  const receiptRef = useRef<HTMLDivElement>(null);

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
    
    // Get amounts with websocket data priority
    let amount = transactionData.amount || 0;
    let estimatedAmount = transactionData.details?.estimated_amount || 
                         transactionData.totalAmountDue || 
                         amount;
    
    // Use websocket data for amounts if available
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
    
    // Format amounts properly
    const formatAmount = (amt: number | string) => {
      const num = typeof amt === 'string' ? parseFloat(amt) : amt;
      return isNaN(num) ? "0" : num.toFixed(8).replace(/\.?0+$/, '');
    };
    
    // Get net amount from websocket data if available, otherwise use estimatedAmount
    let calculatedNetAmount = estimatedAmount;
    if (websocketData?.data) {
      const wsData = websocketData.data;

      if (wsData.amount_to != null && wsData.amount_to !== undefined) {
        calculatedNetAmount =
          typeof wsData.amount_to === "number"
            ? wsData.amount_to
            : parseFloat(String(wsData.amount_to));
      } else if (
        wsData.net_amount !== null &&
        wsData.net_amount !== undefined
      ) {
        calculatedNetAmount = parseFloat(String(wsData.net_amount));
      }
    }
    
    // Get date from websocket data if available, otherwise use current time
    let transactionDate = new Date().toISOString();
    if (websocketData?.timestamp) {
      transactionDate = websocketData.timestamp;
    } else if (websocketData?.data?.last_checked) {
      transactionDate = websocketData.data.last_checked;
    }
    
    const displayReceiveCurrency = resolveHomeExpressSuccessReceiveCurrency(
      transactionData.type,
      toCurrency,
      transactionData
    );

    if (isDeposit) {
      const depositDisplay = resolveExpressDepositSuccessDisplay({
        websocketData,
        transactionData,
        processingReceiveAmount,
      });
      const formattedReceive = formatAmount(depositDisplay.receiveAmount);

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
      const formattedCrypto = formatAmount(withdrawalDisplay.paidAmount);
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
      receivedCurrency: displayReceiveCurrency,
      payinMethod: isDeposit ? paymentMethod : `${fromCurrency} Wallet`,
      payoutMethod: isWithdrawal ? paymentMethod : `${toCurrency} Wallet`,
      transactionHash: txHash,
      netAmount: formatAmount(calculatedNetAmount),
    };
  };

  const realData = getRealData();
  
  // Extract transaction type for use in JSX
  const isDeposit = transactionData?.type === "deposit";
  const isWithdrawal = transactionData?.type === "withdrawal";

  // Format date in East Africa Time (EAT) on client side
  useEffect(() => {
    try {
      const dateObj = new Date(realData.date);
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate(formatDateTimeEastAfrica(dateObj));
      } else {
        setFormattedDate(formatDateTimeEastAfrica(new Date()));
      }
    } catch (error) {
      setFormattedDate(formatDateTimeEastAfrica(new Date()));
    }
  }, [realData.date]);
  
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 pt-0 pb-2">
      <ExpressSuccessHero className="mb-1" />

      {/* Main Content Container */}
      <div
        ref={receiptRef}
        className={`w-full rounded-[18px] shadow-xl border-2 ${
        isDark 
          ? "bg-black border-[#35353E]" 
          : "bg-white border-gray-200"
      }`}>
        {/* Transaction Details Section */}
        <div className="p-6">
          <h2 className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}>Transaction Details</h2>
          <div className="flex justify-between text-sm">
            <div>
              <div className={`${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>Transaction ID</div>
              <div className={`font-mono ${
                isDark ? "text-white" : "text-gray-900"
              }`}>{realData.transactionId}</div>
            </div>
            <div className="text-right">
              <div className={`${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>Date & Time (EAT)</div>
              <div className={`${
                isDark ? "text-white" : "text-gray-900"
              }`}>{formattedDate || realData.date}</div>
            </div>
          </div>
        </div>

        {/* Exchange Summary Section */}
        <div className="pl-6 pr-6 pb-6 min-w-0 overflow-hidden">
        <div className={`border-t border-1 my-4 ${
          isDark ? "border-gray-600" : "border-gray-300"
        }`}></div>

          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>Exchange Summary</h3>
          <div className={`border-t border-dashed my-4 ${
            isDark ? "border-gray-600" : "border-gray-300"
          }`}></div>
          {/* You Paid / You Received */}
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

          {/* Dashed separator */}
          <div className={`border-t border-dashed my-4 ${
            isDark ? "border-gray-600" : "border-gray-300"
          }`}></div>

          {/* Transaction Hash and Net Amount */}
          <div className="space-y-3 min-w-0">
            <div className="min-w-0">
              <div className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>Transaction Hash</div>
              <div className={`flex items-start gap-2 text-[12px] font-mono break-all min-w-0 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
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
            <div className={`my-4 rounded-[18px] shadow-xl border-1 ${
              isDark 
                ? "bg-black border-[#35353E]" 
                : "bg-gray-50 border-gray-200"
            }`}></div>
            <div className="flex justify-between mb-3">
              <div className={`text-sm ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Final Amount (after fees)
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
        </div>

   
      </div>

      <DownloadReceiptButton
        receiptRef={receiptRef}
        fileNamePrefix="OMAYA_Exchange_Receipt"
        transactionId={realData.transactionId}
      />

      {/* Action Buttons */}
      <div className="w-full mt-2 space-y-3">
       <img 
         className="w-full" 
         src={isDark 
           ? "/assets/Frame_34947_qeutak.png" 
           : "/assets/Frame_34947_khxqxo.png"
         } 
         alt="" 
       />
        
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
