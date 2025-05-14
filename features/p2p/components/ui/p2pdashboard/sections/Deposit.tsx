import React, { useState } from "react";
import Form from "../../../Common/Form";
import Button from "../../../Common/Button";
import Card from "../../../Common/Card";
import { FaCheckCircle, FaUpload, FaRegCopy } from "react-icons/fa";
import Input from "../../../Common/Input";

const USDT_ADDRESS = "123u341039ke3443jj1123";

const Deposit = () => {
  // Form fields for amount (and asset, if needed)

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle form submit
  const handleSubmit = (data: any) => {
    // handle deposit logic
    console.log(data);
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full pt-6">
      <Card className="w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)] px-4 sm:px-8 md:px-12 pt-4 p-0 bg-[#23232B] border-2 border-[#35353E] shadow-xl rounded-[24px] flex flex-col mx-auto my-auto">
        {/* Top: Amount & Asset */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Amount Input */}
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount
            </label>
            <div className="bg-[#35353E] border border-[#23232B] rounded-[24px] flex items-center px-3 py-4 h-[46px]">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                alt="USDT"
                className="w-6 h-6 mr-3"
              />
              <Input
                type="number"
                placeholder="Enter Amount"
                className="w-full bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none p-0"
              />
            </div>
          </div>
          {/* Asset Selector */}
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Asset
            </label>
            <div className="bg-[#35353E] border border-[#23232B] rounded-[24px] flex items-center px-4 sm:px-6 py-4 h-[46px]">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                alt="USDT"
                className="w-6 h-6 mr-3"
              />
              <span className="font-semibold text-white text-base">
                USDT TRC20
              </span>
              <span className="ml-3 text-xs text-gray-400 hidden sm:inline">
                Tether USDT (TRON Network)
              </span>
            </div>
          </div>
        </div>

        {/* QR and Address */}
        <div className="h-auto sm:h-[104px] w-full bg-[#35353E] border border-[#1D8751] rounded-[24px] flex flex-col sm:flex-row items-center p-4 sm:px-8 sm:py-0 mt-4 mx-auto">
          {/* QR Code */}
          <img
            src="https://res.cloudinary.com/pitz/image/upload/v1747039472/download_1_qytuya.png"
            alt="QR Code"
            className="w-[60px] h-[60px] rounded-[8px] bg-white object-contain mb-4 sm:mb-0"
          />
          {/* Address Info */}
          <div className="flex flex-col justify-center sm:ml-8 flex-1 w-full sm:w-auto">
            <span className="text-sm text-gray-400 mb-1">USDT Address</span>
            <div className="flex items-center gap-2">
              <img src="/wallet-icon.svg" alt="Wallet" className="w-6 h-6" />
              <span className="text-[#1D8751] font-mono text-base sm:text-lg select-all break-all">
                123u341039ke3443jj1123
              </span>
            </div>
          </div>
          {/* Copy Button */}
          <button
            className="mt-4 sm:mt-0 sm:ml-auto flex items-center text-[#1D8751] text-base font-medium hover:opacity-80 focus:outline-none"
            onClick={() =>
              navigator.clipboard.writeText("123u341039ke3443jj1123")
            }
            type="button"
          >
            Copy
            <svg
              className="ml-1 w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <rect x="3" y="3" width="13" height="13" rx="2" />
            </svg>
          </button>
        </div>

        {/* Transfer Details */}
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <span className="text-gray-400 text-sm font-medium mr-2">
              Transfer Details
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="border border-[#1D8751] rounded-[16px] bg-[#23232B] px-4 sm:px-6 py-4 mb-6">
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 bg-[#1D8751] rounded-full inline-block mr-3"></span>
              <span className="text-white text-sm">
                Please send the money from your own account Only
              </span>
            </div>
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 bg-[#1D8751] rounded-full inline-block mr-3"></span>
              <span className="text-white text-sm">
                Put transaction ID in the description field of the bank
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-[#1D8751] rounded-full inline-block mr-3"></span>
              <span className="text-white text-sm">
                Please note, If you do not follow above conditions, we will
                reject your transaction and send you back your money.
              </span>
            </div>
          </div>
        </div>

        {/* Upload Documents */}
        <div className="border border-[#FFA500] rounded-[16px] bg-[#23232B] px-4 sm:px-6 py-4 mb-6 flex flex-col">
          <div className="flex items-center mb-2">
            <span className="text-white font-medium mr-2">
              Upload Documents
            </span>
            <label className="flex items-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <svg
                className="w-6 h-6 text-[#FFA500]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 16V4m0 0l-4 4m4-4l4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="4" y="16" width="16" height="4" rx="2" />
              </svg>
            </label>
            {selectedFile && (
              <span className="ml-3 text-xs text-gray-400 truncate max-w-[200px] sm:max-w-none">
                {selectedFile.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>

        {/* Confirm Checkbox */}
        <div className="flex items-center mb-8">
          <input
            type="checkbox"
            id="confirm"
            className="accent-[#1D8751] w-5 h-5 mr-2 rounded-full"
          />
          <label htmlFor="confirm" className="text-white text-sm select-none">
            I confirm that I sent the payment
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
          <button
            className="w-full sm:flex-1 py-3 rounded-[16px] border border-[#5A5A6E] text-white bg-transparent hover:bg-[#35353E] transition text-lg font-medium"
            type="button"
          >
            Cancel
          </button>
          <button
            className="w-full sm:flex-1 py-3 rounded-[16px] bg-[#1D8751] text-white text-lg font-medium hover:bg-[#17693e] transition"
            type="submit"
          >
            Deposit
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Deposit;
