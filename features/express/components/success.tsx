import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";
import { useTheme } from "@/context/theme";

const GREEN = "#309A64";

interface SuccessPageProps {
  transactionData?: {
    type: "deposit" | "withdrawal";
    amount: number;
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
  date = "6/29/2025, 9:07:43 PM",
  paidAmount = "USD 1",
  paidCurrency = "USD",
  receivedAmount = ".0035 USDT",
  receivedCurrency = "USDT",
  payinMethod = "Salam Bank",
  payoutMethod = "usdt-erc20",
  transactionHash = "TXNWSU09E2DS",
  netAmount = ".99 USDT",
}) => {
  const router = useRouter();
  const { isDark, isLight } = useTheme();

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
    
    // Get currency information with better fallbacks
    let currency = transactionData.asset?.ticker || 
                  transactionData.asset?.symbol || 
                  transactionData.asset?.name ||
                  transactionData.currency || 
                  "USDT";
    
    // Override with websocket data if available
    if (websocketData?.data?.fromCurrency) {
      currency = websocketData.data.fromCurrency.toUpperCase();
    }
    
    // Check for deposit-specific currency from websocket data
    if (websocketData?.data?.currency) {
      currency = websocketData.data.currency.toUpperCase();
    }
    
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
        
        // Use amountFrom for paid amount (what user sent)
        if (wsData.amountFrom !== null && wsData.amountFrom !== undefined) {
          amount = wsData.amountFrom;
        } else if (wsData.expectedAmountFrom !== null && wsData.expectedAmountFrom !== undefined) {
          amount = wsData.expectedAmountFrom;
        }
        
        // Use amountTo for received amount (what user gets)
        if (wsData.amountTo !== null && wsData.amountTo !== undefined) {
          estimatedAmount = wsData.amountTo;
        } else if (wsData.expectedAmountTo !== null && wsData.expectedAmountTo !== undefined) {
          estimatedAmount = wsData.expectedAmountTo;
        }
        
        // Check for deposit amount from new format
        if (wsData.amount && wsData.transaction_type === "deposit") {
          amount = parseFloat(wsData.amount);
          estimatedAmount = parseFloat(wsData.amount);
        }
      }
    
    // Get transaction hash/ID with websocket data priority
    let txId = transactionData.transactionId || 
              transactionData.details?.changenow_id || 
              transactionData.depositCode ||
              "N/A";
    
    // Use websocket ID if available
    if (websocketData?.data?.id) {
      txId = websocketData.data.id;
    }
    
    // Check for transaction_id from new deposit format
    if (websocketData?.data?.transaction_id) {
      txId = websocketData.data.transaction_id;
    }
    
    // Get transaction hash from websocket data
    let txHash = txId;
    
    // Check for tx_hash from new deposit format (highest priority)
    if (websocketData?.data?.tx_hash) {
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
    
    return {
      transactionId: txId,
      date: websocketData?.data?.updated_at ? 
            new Date(websocketData.data.updated_at).toLocaleString() : 
            websocketData?.data?.updatedAt ? 
            new Date(websocketData.data.updatedAt).toLocaleString() : 
            new Date().toLocaleString(),
      paidAmount: `${formatAmount(amount)} ${currency}`,
      paidCurrency: currency,
      receivedAmount: `${formatAmount(estimatedAmount)} ${currency}`,
      receivedCurrency: currency,
      payinMethod: isDeposit ? paymentMethod : `${currency} Wallet`,
      payoutMethod: isWithdrawal ? paymentMethod : `${currency} Wallet`,
      transactionHash: txHash,
      netAmount: `${formatAmount(estimatedAmount)} ${currency}`,
    };
  };

  const realData = getRealData();
  
  return (
    <div className="flex flex-col  items-center justify-center w-full">
      {/* Success Image */}
      <div className="flex flex-col w-full items-center mb-4">
        <img 
          className="w-80 h-64 object-contain" 
          src={isDark 
            ? "https://res.cloudinary.com/pitz/image/upload/v1756484286/Screenshot_2025-08-29_191548_two36s.png" 
            : "https://res.cloudinary.com/pitz/image/upload/v1756925670/success_wdhc19.png"
          } 
          alt="Success" 
        />
      </div>

      {/* Main Content Container */}
      <div className={`w-full rounded-[18px] shadow-xl border-2 ${
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
              }`}>{realData.date}</div>
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
              <div className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>Via {realData.payinMethod}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>You Received</div>
              <div className="font-bold flex items-center justify-end gap-2" style={{ color: GREEN }}>
                {transactionData?.asset?.icon && (
                  <img
                    src={transactionData.asset.icon}
                    alt={realData.receivedCurrency}
                    className="w-5 h-5"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span>{realData.receivedAmount} {realData.receivedCurrency}</span>
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
              <div className={`font-mono ${
                isDark ? "text-white" : "text-gray-900"
              }`}>{realData.transactionHash}</div>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full  mt-2 space-y-3">
       <img 
         className="w-full" 
         src={isDark 
           ? "https://res.cloudinary.com/pitz/image/upload/v1756484240/Frame_34947_qeutak.png" 
           : "https://res.cloudinary.com/pitz/image/upload/v1756925740/Frame_34947_khxqxo.png"
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
