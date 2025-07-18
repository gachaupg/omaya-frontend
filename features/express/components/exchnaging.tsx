import React from "react";
import SuccessPage from "./success";

interface ExchangingProps {
  transactionData?: {
    type: "deposit" | "withdrawal";
    amount: number;
    asset: any;
    paymentDetail?: any;
    paymentDetails?: any[];
    walletAddress: string;
    network: any;
  };
}

export default function Exchanging({ transactionData }: ExchangingProps) {
  return (
    <div className="w-full min-h-screen bg-[#18181F] flex flex-col items-center py-8">
      {/* Top Card */}
      <div className="flex flex-col md:flex-row justify-between items-stretch bg-[#23232B] border-2 border-[#35353E] rounded-2xl p-4 shadow-lg w-full max-w-3xl mb-4 min-h-[180px]">
        <div className="flex-1 flex flex-col justify-between py-2 pr-2">
          <div>
            <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
              Amount:
            </div>
            <div className="text-white text-base font-semibold mb-1">
              {transactionData?.amount || 0}{" "}
              {transactionData?.asset?.symbol || "USDT"}
            </div>
            {transactionData?.type === "deposit" &&
              transactionData?.paymentDetail && (
                <>
                  <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                    Bank:
                  </div>
                  <div className="flex items-center mb-1">
                    <img
                      src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                      alt={transactionData.paymentDetail.provider_name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-white text-sm font-semibold">
                      {transactionData.paymentDetail.provider_name}
                    </span>
                  </div>
                  <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                    Account Name:
                  </div>
                  <div className="text-white text-sm mb-1">
                    {transactionData.paymentDetail.account_name}
                  </div>
                  <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                    Account Number:
                  </div>
                  <div className="text-white text-sm font-mono">
                    {transactionData.paymentDetail.account_number}
                  </div>
                </>
              )}
            {transactionData?.type === "withdrawal" && (
              <>
                <div className="text-[#7B7B7B] text-xs font-semibold mb-0.5">
                  Wallet Address:
                </div>
                <div className="text-white text-sm font-mono break-all">
                  {transactionData.walletAddress}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-0 md:ml-6 flex items-center justify-center py-2">
          {/* QR code */}
          <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${
                transactionData?.type === "deposit" &&
                transactionData?.paymentDetail
                  ? transactionData.paymentDetail.account_number
                  : transactionData?.walletAddress || ""
              }`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between w-full max-w-3xl mb-4">
        {/* Step 1: Awaiting Deposit */}
        <div className="flex flex-col items-center flex-1 relative">
          <div className="w-10 h-10 rounded-full bg-[#FF9500] flex items-center justify-center mb-1 border-4 border-[#FF95001A]">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
              <path
                d="M12 8v4l2 2"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[#FF9500] font-semibold text-base">
            Awaiting Deposit
          </span>
          <div className="flex gap-1 mt-1">
            <span className="w-2 h-2 bg-[#FF9500] rounded-full inline-block"></span>
            <span className="w-2 h-2 bg-[#FF9500] rounded-full inline-block"></span>
            <span className="w-2 h-2 bg-[#FF9500] rounded-full inline-block"></span>
          </div>
        </div>
        {/* Step 2: Confirming */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-[#23232B] flex items-center justify-center mb-1 border-4 border-[#35353E]">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#7B7B7B" strokeWidth="2" />
              <path
                d="M9 12l2 2 4-4"
                stroke="#7B7B7B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[#7B7B7B] font-semibold text-base">
            Confirming
          </span>
        </div>
        {/* Step 3: Exchanging */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-[#23232B] flex items-center justify-center mb-1 border-4 border-[#35353E]">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#7B7B7B" strokeWidth="2" />
              <path
                d="M8 12h8M12 8v8"
                stroke="#7B7B7B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-[#7B7B7B] font-semibold text-base">
            Exchanging
          </span>
        </div>
        {/* Step 4: Sending to you */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-[#23232B] flex items-center justify-center mb-1 border-4 border-[#35353E]">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#7B7B7B" strokeWidth="2" />
              <path
                d="M8 12h8M16 12l-4 4m4-4l-4-4"
                stroke="#7B7B7B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-[#7B7B7B] font-semibold text-base">
            Sending to you
          </span>
        </div>
      </div>

      {/* Address Field */}
      <div className="w-full max-w-3xl mb-4">
        <div className="bg-[#23232B] border border-[#1D8751] rounded-2xl px-4 py-3 flex items-center">
          <span className="text-[#1D8751] font-mono text-base truncate">
            {transactionData?.type === "deposit" &&
            transactionData?.paymentDetail
              ? transactionData.paymentDetail.account_number
              : transactionData?.walletAddress ||
                "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
          </span>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className="bg-[#23232B] border-2 border-[#35353E] rounded-2xl p-6 shadow-lg w-full max-w-3xl mb-4">
        {/* Title */}
        <div className="text-white text-2xl font-semibold mb-4">
          Transaction Details
        </div>
        {/* Transaction ID Row */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-[#7B7B7B] text-base font-medium">
            Transaction ID
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-base font-mono font-semibold">
              TXNWSU09E2DS
            </span>
            <span className="text-[#FFA200] cursor-pointer flex items-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="#FFA200"
                  strokeWidth="2"
                />
                <rect
                  x="3"
                  y="3"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="#FFA200"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </div>
        </div>
        {/* Dashed Divider */}
        <div className="border-t border-dashed border-[#7B7B7B] mb-4"></div>
        {/* From/To Labels Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[#7B7B7B] text-base font-medium">From</div>
          <div className="text-[#7B7B7B] text-base font-medium">To</div>
        </div>
        {/* From/To Content Row */}
        <div className="flex items-center justify-between mt-2">
          {/* From */}
          <div className="flex items-center gap-2">
            {transactionData?.type === "deposit" &&
            transactionData?.paymentDetail ? (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt={transactionData.paymentDetail.provider_name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-white text-base font-semibold">
                    {transactionData.paymentDetail.provider_name}
                  </div>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {transactionData.paymentDetail.account_number}
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  alt={transactionData?.asset?.symbol || "USDT"}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-white text-base font-semibold">
                    {transactionData?.asset?.symbol || "USDT"}
                  </div>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {transactionData?.walletAddress ||
                      "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* To */}
          <div className="flex items-center gap-2">
            {transactionData?.type === "deposit" ? (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  alt={transactionData?.asset?.symbol || "USDT"}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-right">
                  <div className="text-white text-base font-semibold inline-block align-middle">
                    {transactionData?.asset?.symbol || "USDT"}
                  </div>
                  <span className="text-[#7B7B7B] text-base font-normal ml-1 align-middle">
                    {transactionData?.asset?.description || "Tether US"}
                  </span>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {transactionData?.walletAddress ||
                      "TQn9Y2khEsLJW1ChVWFM...RDow5oRP7bX"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png"
                  alt="Bank"
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-right">
                  <div className="text-white text-base font-semibold inline-block align-middle">
                    Bank Transfer
                  </div>
                  <span className="text-[#7B7B7B] text-base font-normal ml-1 align-middle">
                    To your account
                  </span>
                  <div className="text-[#7B7B7B] text-sm font-mono">
                    {transactionData?.paymentDetails?.[0]?.account_number ||
                      "Account Number"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions Summary Bar */}
      <div className="w-full max-w-3xl rounded-2xl flex ">
        {/* Faded clock icon */}
        <img
          src="https://res.cloudinary.com/pitz/image/upload/v1752248844/Frame_34947_hxlr7o.png"
          alt=""
        />
      </div>
      {/* <SuccessPage /> */}
    </div>
  );
}
