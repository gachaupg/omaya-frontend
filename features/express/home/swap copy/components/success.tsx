import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";
import DownloadReceiptButton from "@/components/ui/DownloadReceiptButton";
import { useTheme } from "@/context/theme";
import { formatSwapDisplayTicker } from "@/features/swap/utils/swapDisplayFormat";
import { ExpressSuccessHero } from "@/features/express/components/ExpressSuccessHero";

const GREEN = "#309A64";

interface SuccessPageProps {
  transactionData?: {
    type?: "swap"; // This success page is specifically for swap transactions
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

    // This is a swap transaction, not deposit/withdrawal
    const isSwap = true;
    
    // Get currency information with better fallbacks
    let currency = transactionData.asset?.ticker || 
                  transactionData.asset?.symbol || 
                  transactionData.asset?.name ||
                  transactionData.currency || 
                  "USDT";
    
    // Override with websocket data if available - new format
    if (websocketData?.data?.from_currency) {
      currency = websocketData.data.from_currency.toUpperCase();
    } else if (websocketData?.data?.fromCurrency) {
      currency = websocketData.data.fromCurrency.toUpperCase();
    }
    
    // Check for deposit-specific currency from websocket data
    if (websocketData?.data?.currency) {
      currency = websocketData.data.currency.toUpperCase();
    }
    
    // Check for withdrawal completion currency
    if (websocketData?.data?.status === "completed" && websocketData?.data?.currency) {
      currency = websocketData.data.currency.toUpperCase();
    }
    
    const network = transactionData.network?.network_type || 
                   transactionData.network?.network_id || 
                   transactionData.network?.name ||
                   "Unknown";
    
    // For swaps, we don't need payment methods like deposits/withdrawals
    // The payment method is just the network/currency being swapped
    
    // Get amounts with websocket data priority
    let amount = transactionData.amount || 0;
    let estimatedAmount = transactionData.details?.estimated_amount || 
                         transactionData.totalAmountDue || 
                         amount;
    
    // If amount is null/0, try to get it from websocket data
    if (!amount && websocketData?.data?.amount_from) {
      amount = parseFloat(websocketData.data.amount_from);
    }
    
          // Use websocket data for amounts if available
      if (websocketData?.data) {
        const wsData = websocketData.data;
        
        // Check if this is a direct use flow (first two assets) or ChangeNow flow
        const isDirectFlow = !wsData.from_currency || !wsData.to_currency || 
                            wsData.from_currency === wsData.to_currency ||
                            (wsData.amount && wsData.net_amount && !wsData.amount_from && !wsData.amount_to);
        
        if (isDirectFlow) {
          // Direct use flow: use 'amount' for both paid and received amounts
          // For direct flow: "You Paid" = amount, "You Received" = amount (not net_amount)
          if (wsData.amount !== null && wsData.amount !== undefined) {
            amount = parseFloat(wsData.amount);
            estimatedAmount = parseFloat(wsData.amount); // "You Received" should be amount, not net_amount
          }
        } else {
          // ChangeNow flow: use amount_from, amount_to, etc.
          // Use amount_from for paid amount (what user sent) - new websocket format
          if (wsData.amount_from !== null && wsData.amount_from !== undefined) {
            amount = parseFloat(wsData.amount_from);
          } else if (wsData.amountFrom !== null && wsData.amountFrom !== undefined) {
            amount = wsData.amountFrom;
          } else if (wsData.expectedAmountFrom !== null && wsData.expectedAmountFrom !== undefined) {
            amount = wsData.expectedAmountFrom;
          }
          
          // Use amount_to for received amount (what user gets) - new websocket format
          if (wsData.amount_to !== null && wsData.amount_to !== undefined) {
            estimatedAmount = parseFloat(wsData.amount_to);
          } else if (wsData.amountTo !== null && wsData.amountTo !== undefined) {
            estimatedAmount = wsData.amountTo;
          } else if (wsData.expectedAmountTo !== null && wsData.expectedAmountTo !== undefined) {
            estimatedAmount = wsData.expectedAmountTo;
          }
        }
      }
    
    // Get transaction hash/ID with websocket data priority
    let txId = transactionData.transactionId || 
              transactionData.details?.changenow_id ||
              "N/A";
    
    // Use websocket ID if available - new format
    if (websocketData?.data?.swap_id) {
      txId = websocketData.data.swap_id;
    } else if (websocketData?.data?.id) {
      txId = websocketData.data.id;
    }
    
    // Check for transaction_id from new deposit format
    if (websocketData?.data?.transaction_id) {
      txId = websocketData.data.transaction_id;
    }
    
    // Get transaction hash from websocket data
    let txHash = txId;
    
    // Check for transaction_hash from withdrawal completion (highest priority) - new format
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
    
    // Format amounts properly
    const formatAmount = (amt: number | string) => {
      const num = typeof amt === 'string' ? parseFloat(amt) : amt;
      return isNaN(num) ? "0" : num.toFixed(8).replace(/\.?0+$/, '');
    };
    
    // Get currencies from websocket data if available
    const fromCurrency = websocketData?.data?.from_currency || websocketData?.data?.fromCurrency || currency;
    const toCurrency = websocketData?.data?.to_currency || websocketData?.data?.toCurrency || currency;
    
    return {
      transactionId: txId,
      date: new Date().toLocaleString(), // Always use current date and time
      paidAmount: `${formatAmount(amount)} ${fromCurrency.toUpperCase()}`,
      paidCurrency: fromCurrency.toUpperCase(),
      receivedAmount: formatAmount(estimatedAmount),
      receivedCurrency: toCurrency.toUpperCase(),
      payinMethod: `${fromCurrency.toUpperCase()} Network`,
      payoutMethod: `${toCurrency.toUpperCase()} Network`,
      transactionHash: txHash,
      netAmount: formatAmount(estimatedAmount),
    };
  };

  const realData = getRealData();
  
  // This is a swap transaction
  const isSwap = true;

  // Always use current date and time (local timezone) - client-side only
  useEffect(() => {
    // Set initial time immediately on client
    setFormattedDate(new Date().toLocaleString("en-US"));
    
    // Update every second to keep time current
    const interval = setInterval(() => {
      setFormattedDate(new Date().toLocaleString("en-US"));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 pt-0 pb-2">
      <ExpressSuccessHero className="mb-1" />

      {/* Main Content Container */}
      <div
        ref={receiptRef}
        className={`w-full rounded-[18px] shadow-xl border-2 ${
        isDark 
          ? "bg-[#1D1D23] border-[#35353E]" 
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
              }`}>Date & Time</div>
              <div className={`${
                isDark ? "text-white" : "text-gray-900"
              }`}>{formattedDate}</div>
            </div>
          </div>
        </div>

        {/* Exchange Summary Section */}
        <div className=" pl-6 pr-6">
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
              <div className="font-bold flex items-center gap-2" style={{ color: GREEN }}>
                <span>{realData.paidAmount}</span>
              </div>
              <div className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>Via {realData.payinMethod}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>You Received</div>
              <div className="font-bold flex items-center justify-end gap-2" style={{ color: GREEN }}>
                <span>{realData.receivedAmount} </span>
                <span>{formatSwapDisplayTicker(realData.receivedCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Dashed separator */}
          <div className={`border-t border-dashed my-4 ${
            isDark ? "border-gray-600" : "border-gray-300"
          }`}></div>

          {/* Transaction Hash and Net Amount */}
          <div className="space-y-3">
            <div>
              <div className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>Transaction Hash</div>
              <div className={` text-[12px] font-mono ${
                isDark ? "text-white" : "text-gray-900"
              }`}>{realData.transactionHash} </div>
            </div>
            <div className={`my-4 rounded-[18px] shadow-xl border-1 ${
              isDark 
                ? "bg-[#1D1D23] border-[#35353E]" 
                : "bg-gray-50 border-gray-200"
            }`}></div>
            <div className="flex justify-between mb-3">
              <div className={`text-sm ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Net Amount Processed
              </div>
              <div className="font-mono flex items-center gap-2" style={{ color: GREEN }}>
                {transactionData?.asset?.icon && (
                  <img
                    src={transactionData.asset.icon}
                    alt={realData.receivedCurrency}
                    className="w-4 h-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span>{realData.netAmount}</span>
                <span>{formatSwapDisplayTicker(realData.receivedCurrency)}</span>
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
