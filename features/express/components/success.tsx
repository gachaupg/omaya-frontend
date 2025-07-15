import React from "react";
import { FaCheckCircle } from "react-icons/fa";

const GREEN = "#309A64";

const SuccessPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-2">
      {/* Success Icon and Message */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <FaCheckCircle style={{ color: GREEN }} size={90} />
          {/* Decorative dots */}
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-400 rounded-full" />
          <span
            className="absolute -bottom-2 left-1/4 w-3 h-3"
            style={{ background: GREEN, borderRadius: "9999px" }}
          />
          <span className="absolute -bottom-2 right-1/4 w-3 h-3 bg-blue-400 rounded-full" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: GREEN }}>
          Swap Successful!
        </h1>
        <p className="text-lg text-white/80">
          Your Swap has been completed successfully
        </p>
      </div>

      {/* Transaction Details Card */}
      <div className="w-full max-w-2xl bg-[#23232b] rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Transaction Details
        </h2>
        <div className="flex flex-col md:flex-row md:justify-between text-white/80 text-sm mb-4">
          <div>
            <div className="mb-1">Transaction ID</div>
            <div className="font-mono text-white">TXNWSU09E2DS</div>
          </div>
          <div className="md:text-right mt-2 md:mt-0">
            <div className="mb-1">Date & Time</div>
            <div className="font-mono text-white">6/29/2025, 9:07:43 PM</div>
          </div>
        </div>
        <hr className="border-white/10 my-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Swap Summary</h3>
        <div className="flex flex-col md:flex-row md:justify-between text-white/80 text-sm mb-4">
          <div>
            <div className="mb-1">You Paid</div>
            <div className="font-bold text-white">USD 1</div>
            <div className="text-xs text-white/60">Via Salam Bank</div>
          </div>
          <div className="md:text-right mt-2 md:mt-0">
            <div className="mb-1">You Received</div>
            <div className="font-bold" style={{ color: GREEN }}>
              .0035 USDT
            </div>
            <div className="text-xs text-white/60">to usdt-erc20</div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:justify-between text-white/80 text-sm mb-4">
          <div>
            <div className="mb-1">Transaction Hash</div>
            <div className="font-mono text-white">TXNWSU09E2DS</div>
          </div>
        </div>
        <div
          className="flex justify-end font-semibold text-base"
          style={{ color: GREEN }}
        >
          Net Amount Processed &nbsp;{" "}
          <span className="font-mono">.99 USDT</span>
        </div>
      </div>

      {/* Transaction Completed Banner */}
      <div
        className="w-full max-w-2xl rounded-b-xl rounded-t-md p-4 flex items-center mb-4"
        style={{ background: GREEN }}
      >
        <FaCheckCircle className="text-white mr-3" size={24} />
        <div>
          <div className="font-bold text-white">Transaction Completed</div>
          <div className="text-white/90 text-sm">
            Your USDT has been sent to your wallet. It may take a few minutes to
            reflect in your balance.
          </div>
        </div>
      </div>

      {/* Support Footer */}
      <div className="w-full max-w-2xl text-center text-xs text-white/40 mt-2">
        Need help? Contact our support team at{" "}
        <a href="mailto:support@omayaexchange.com" className="underline">
          support@omayaexchange.com
        </a>
      </div>
    </div>
  );
};

export default SuccessPage;
