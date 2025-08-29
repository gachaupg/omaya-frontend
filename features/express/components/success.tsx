import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";

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

  // Extract real data from transactionData if available
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
    const currency = transactionData.asset?.ticker || 
                    transactionData.asset?.symbol || 
                    transactionData.asset?.name ||
                    transactionData.currency || 
                    "USDT";
    
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
         transactionData.details?.payout_address?.substring(0, 10) + "..." ||
         network);
    
    // Get amounts with better handling
    const amount = transactionData.amount || 0;
    const estimatedAmount = transactionData.details?.estimated_amount || 
                           transactionData.totalAmountDue || 
                           amount;
    
    // Get transaction hash/ID with better fallbacks
    const txId = transactionData.transactionId || 
                transactionData.details?.changenow_id || 
                transactionData.depositCode ||
                "N/A";
    
    // Format amounts properly
    const formatAmount = (amt: number | string) => {
      const num = typeof amt === 'string' ? parseFloat(amt) : amt;
      return isNaN(num) ? "0" : num.toFixed(8).replace(/\.?0+$/, '');
    };
    
    return {
      transactionId: txId,
      date: new Date().toLocaleString(),
      paidAmount: `${formatAmount(amount)} ${currency}`,
      paidCurrency: currency,
      receivedAmount: `${formatAmount(estimatedAmount)} ${currency}`,
      receivedCurrency: currency,
      payinMethod: isDeposit ? paymentMethod : `${currency} Wallet`,
      payoutMethod: isWithdrawal ? paymentMethod : `${currency} Wallet`,
      transactionHash: txId,
      netAmount: `${formatAmount(estimatedAmount)} ${currency}`,
    };
  };

  const realData = getRealData();
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Success Image */}
      <div className="flex flex-col w-full items-center mb-8">
        <img className="w-full max-w-md" height={100} src="https://res.cloudinary.com/pitz/image/upload/v1756484286/Screenshot_2025-08-29_191548_two36s.png" alt="Success" />
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-md bg-[#1D1D23] rounded-lg shadow-xl">
        {/* Transaction Details Section */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Transaction Details</h2>
          <div className="flex justify-between text-sm">
            <div>
              <div className="text-gray-400 mb-1">Transaction ID</div>
              <div className="text-white font-mono">{realData.transactionId}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 mb-1">Date & Time</div>
              <div className="text-white">{realData.date}</div>
            </div>
          </div>
        </div>

        {/* Exchange Summary Section */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Exchange Summary</h3>
          
          {/* You Paid / You Received */}
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">You Paid</div>
              <div className="text-gray-400 text-xs">Via {realData.payinMethod}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm mb-1">You Received</div>
              <div className="font-bold" style={{ color: GREEN }}>
                {realData.receivedAmount} {realData.receivedCurrency}
              </div>
              <div className="text-gray-400 text-xs">to {realData.payoutMethod}</div>
            </div>
          </div>

          {/* Dashed separator */}
          <div className="border-t border-dashed border-gray-600 my-4"></div>

          {/* Transaction Hash and Net Amount */}
          <div className="space-y-3">
            <div>
              <div className="text-gray-400 text-sm mb-1">Transaction Hash</div>
              <div className="text-white font-mono">{realData.transactionHash}</div>
            </div>
            <div className="text-right">
              <div className="text-sm" style={{ color: GREEN }}>
                Net Amount Processed
              </div>
              <div className="font-mono" style={{ color: GREEN }}>
                {realData.netAmount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md mt-6 space-y-3">
       <img src="https://res.cloudinary.com/pitz/image/upload/v1756484240/Frame_34947_qeutak.png" alt="" />
        
        <div className="text-center text-xs text-gray-400">
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
