import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";

const GREEN = "#309A64";

interface SwapStatusProps {
  transactionId: string;
  date: string;
  paidAmount: string | number;
  paidCurrency: string;
  receivedAmount: string | number;
  receivedCurrency: string;
  payinMethod?: string;
  payoutMethod?: string;
  transactionHash?: string;
  netAmount?: string | number;
}

const SwapStatusComponent: React.FC<SwapStatusProps> = ({
  transactionId,
  date,
  paidAmount,
  paidCurrency,
  receivedAmount,
  receivedCurrency,
  payinMethod,
  payoutMethod,
  transactionHash,
  netAmount,
}) => {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center py-6 sm:py-12 px-3 sm:px-4">
      {/* Success Icon and Message */}
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <div className="relative mb-3 sm:mb-4">
          <FaCheckCircle style={{ color: GREEN }} className="w-16 h-16 sm:w-20 sm:h-20 md:w-[90px] md:h-[90px]" />
          {/* Animated loading dots */}
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
          <span
            className="absolute -bottom-2 left-1/4 w-2 h-2 sm:w-3 sm:h-3 animate-bounce"
            style={{ background: GREEN, borderRadius: "9999px", animationDelay: '0.2s' }}
          />
          <span className="absolute -bottom-2 right-1/4 w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{ color: GREEN }}>
          Swap Successful!
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-white/80 text-center px-4">
          Your Swap has been completed successfully
        </p>
      </div>

      {/* Transaction Details Card */}
      <div className="w-full max-w-2xl dark:bg-[#23232b] bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
          Transaction Details
        </h2>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">
          <div>
            <div className="mb-1">Transaction ID</div>
            <div className="font-mono text-white text-xs sm:text-sm break-all">{transactionId}</div>
          </div>
          <div className="text-left sm:text-right mt-2 sm:mt-0">
            <div className="mb-1">Date & Time</div>
            <div className="font-mono text-white text-xs sm:text-sm">{date}</div>
          </div>
        </div>
        <hr className="border-white/10 my-3 sm:my-4" />
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Swap Summary</h3>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">
          <div>
            <div className="mb-1">You Paid</div>
            <div className="font-bold text-white text-sm sm:text-base">
              {paidAmount} {paidCurrency}
            </div>
            {payinMethod && (
              <div className="text-xs text-white/60">Via {payinMethod}</div>
            )}
          </div>
          <div className="text-left sm:text-right mt-2 sm:mt-0">
            <div className="mb-1">You Received</div>
            <div className="font-bold text-sm sm:text-base" style={{ color: GREEN }}>
              {receivedAmount} {receivedCurrency}
            </div>
            {payoutMethod && (
              <div className="text-xs text-white/60">to {payoutMethod}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">
          <div>
            <div className="mb-1">Transaction Hash</div>
            <div className="font-mono text-white text-xs sm:text-sm break-all">{transactionHash}</div>
          </div>
        </div>
        <div
          className="flex flex-col sm:flex-row sm:justify-end gap-1 sm:gap-0 font-semibold text-sm sm:text-base"
          style={{ color: GREEN }}
        >
          <span>Net Amount Processed</span>
          <span className="font-mono">&nbsp;{netAmount}</span>
        </div>
      </div>

      {/* Transaction Completed Banner */}
      <div
        className="w-full max-w-2xl rounded-b-xl rounded-t-md p-3 sm:p-4 flex items-center mb-4"
        style={{ background: GREEN }}
      >
        <FaCheckCircle className="text-white mr-2 sm:mr-3 flex-shrink-0" size={20} style={{ width: '20px', height: '20px' }} />
        <div className="min-w-0">
          <div className="font-bold text-white text-sm sm:text-base">Transaction Completed</div>
          <div className="text-white/90 text-xs sm:text-sm">
            Your {receivedCurrency} has been sent to your wallet. It may take a
            few minutes to reflect in your balance.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mb-4">
        <button
          className="w-full bg-[#1D8751] hover:bg-[#16663d] text-white font-semibold py-2.5 sm:py-3 rounded-xl text-sm sm:text-base md:text-lg transition"
          onClick={() => router.push("/")}
        >
          Go Back Home
        </button>
        <button
          className="w-full bg-[#F79330] hover:bg-[#e67d1a] text-white font-semibold py-2.5 sm:py-3 rounded-xl text-sm sm:text-base md:text-lg transition"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </button>
      </div>

      {/* Support Footer */}
      <div className="w-full max-w-2xl text-center text-xs text-white/40 mt-2 px-4">
        Need help? Contact our support team at{" "}
        <a href="mailto:support@omayaexchange.com" className="underline break-all">
          support@omayaexchange.com
        </a>
      </div>
    </div>
  );
};

export default SwapStatusComponent;
