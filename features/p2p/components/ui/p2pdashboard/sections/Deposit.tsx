import React, { useState, useEffect } from "react";
import Form from "../../../Common/Form";
import Button from "../../../Common/Button";
import Card from "../../../Common/Card";
import { FaCheckCircle, FaUpload, FaRegCopy } from "react-icons/fa";
import Input from "../../../Common/Input";
import { showToast } from "@/lib/utils/toast";
import {
  validateDepositForm,
  getFieldError,
  type ValidationError,
  type DepositFormData,
} from "./validation";
import Loader from "../../../Common/Loader";
import { useDispatch, useSelector } from "react-redux";
import { createDeposit } from "@/features/p2p/slices/depositSlice";
import { AppDispatch } from "@/store";
import {
  type CreateP2PDepositRequest,
  type Currency,
  type Network,
  type WalletType,
} from "@/features/p2p/types";
import Select from "../../../Common/Select";
import { fetchAssets } from "@/features/p2p/slices/assetsSlice";
import { RootState } from "@/store/rootReducer";
import { useRouter } from "next/navigation";
import { FinancialCalculator } from "@/lib/utils/financial";
import { useTransactionValidation } from "@/features/p2p/hooks/useTransactionValidation";

const USDT_ADDRESS = "123u341039ke3443jj1123";

const Deposit = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading: isSubmitting, error: submitError } = useSelector(
    (state: RootState) => state.deposits
  );
  const { data: assetsData, loading: assetsLoading } = useSelector(
    (state: RootState) => state.assets
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");
  const { validateTransaction } = useTransactionValidation();

  useEffect(() => {
    if (!assetsData && !assetsLoading) {
      dispatch(fetchAssets());
    }
  }, [assetsData, assetsLoading, dispatch]);

  // Find selected asset and network
  const selectedAsset = assetsData?.assets.find(
    (a) => a.asset_id === selectedAssetId
  );
  const networkOptions =
    selectedAsset?.networks.map((n) => ({
      value: n.network_id,
      label: n.network_type,
    })) || [];
  const selectedNetwork = selectedAsset?.networks.find(
    (n) => n.network_id === selectedNetworkId
  );

  // Find wallet address for selected asset/network
  const adminAccount = selectedAsset?.admin_accounts.find(
    (acc) => acc.network === selectedNetwork?.network_type
  );
  const walletAddress = adminAccount?.wallet_address || "";

  // Asset options (only show USDT Tether)
  const assetOptions =
    assetsData?.assets
      .filter((a) => a.symbol === "USDT Tether")
      .map((a) => ({
        value: a.asset_id,
        label: a.symbol,
      })) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Clear file error if exists
      setErrors(errors.filter((error) => error.field !== "file"));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    // Clear amount error if exists
    setErrors(errors.filter((error) => error.field !== "amount"));
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPayment(e.target.checked);
    // Clear confirmation error if exists
    setErrors(errors.filter((error) => error.field !== "confirmPayment"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: DepositFormData = {
      amount,
      file: selectedFile,
      confirmPayment,
    };

    const validationErrors = validateDepositForm(
      formData,
      "USDT",
      selectedNetwork?.network_type,
      validateTransaction
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const depositData: CreateP2PDepositRequest = {
        amount: FinancialCalculator.toNumber(amount),
        currency: "USDT" as Currency,
        network: "TRON" as Network,
        wallet_type: "USDT" as WalletType,
        document: selectedFile as File,
      };

      const resultAction = await dispatch(createDeposit(depositData));

      if (createDeposit.rejected.match(resultAction)) {
        throw new Error(
          resultAction.error.message || "Failed to submit deposit"
        );
      }

      // Show success toast
      showToast.success(
        "Deposit submitted successfully",
        "Your deposit request has been received and is being processed."
      );

      // Reset form
      setAmount("");
      setSelectedFile(null);
      setConfirmPayment(false);
      setErrors([]);

      // Close deposit window by navigating back to P2P dashboard
      router.push("/dashboard/p2p/");
    } catch (err) {
      setErrors([
        {
          field: "submit",
          message: err instanceof Error ? err.message : "An error occurred",
        },
      ]);
    }
  };

  const getInputBorderColor = (field: string) => {
    return getFieldError(field, errors) ? "border-red-500" : "border-[#23232B]";
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full pt-1">
      <Card className="w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)] px-4 sm:px-8 md:px-12 pt-4 p-0 bg-[#1D1D23] border-1 border-[#35353E] shadow-xl rounded-[24px] flex flex-col mx-auto my-auto">
        <form onSubmit={handleSubmit}>
          {/* Asset & Network Selectors */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4">
            {/* Asset Selector with Image inside */}
            <div className="flex-1 flex  flex-col">
              <label className="block  text-sm font-medium text-gray-400 mb-2">
                Asset
              </label>
              <div className="relative  rounded-[40px] w-full">
                {selectedAsset?.asset_image && (
                  <img
                    src={selectedAsset.asset_image}
                    alt={selectedAsset.symbol}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 object-contain rounded-full"
                  />
                )}
                <Select
                  options={assetOptions}
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    setSelectedNetworkId(""); // Reset network on asset change
                  }}
                  placeholder="Select Asset"
                  className="w-full h-[24px] rounded-[19px] pl-12 text-base"
                  style={{ minHeight: 46 }}
                />
              </div>
            </div>
            {/* Network Selector */}
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Network
              </label>
              <div className="relative  w-full">
                <Select
                  options={networkOptions}
                  value={selectedNetworkId}
                  onChange={(e) => setSelectedNetworkId(e.target.value)}
                  placeholder="Select Network"
                  className="w-full h-[24px] rounded-[19px] text-base"
                  style={{ minHeight: 46 }}
                  disabled={!selectedAssetId}
                />
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex-1 flex flex-col mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount
            </label>
            <div
              className={`bg-[#35353E] border ${getInputBorderColor(
                "amount"
              )} rounded-[19px] flex items-center px-3 py-4 h-[46px]`}
            >
              {selectedAsset?.asset_image && (
                <img
                  src={selectedAsset.asset_image}
                  alt={selectedAsset.symbol}
                  className="w-6 h-6 mr-3"
                />
              )}
              <Input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter Amount"
                className="w-full bg-transparent rounded-[19px] border-none text-white placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none p-0"
                disabled={!selectedAssetId || !selectedNetworkId}
                step="0.01"
                min="0"
              />
            </div>
            {getFieldError("amount", errors) && (
              <span className="text-red-500 text-sm mt-1">
                {getFieldError("amount", errors)}
              </span>
            )}
          </div>

          {/* QR and Address */}
          {selectedAssetId && selectedNetworkId && (
            <div className="h-auto sm:h-[104px] w-full bg-[#35353E] border border-[#1D8751] rounded-[24px] flex flex-col sm:flex-row items-center p-4 sm:px-8 sm:py-0 mt-4 mx-auto">
              {/* QR Code (placeholder or from adminAccount if available) */}
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1747039472/download_1_qytuya.png"
                alt="QR Code"
                className="w-[60px] h-[60px] rounded-[8px] bg-white object-contain mb-4 sm:mb-0"
              />
              {/* Address Info */}
              <div className="flex flex-col justify-center sm:ml-8 flex-1 w-full sm:w-auto">
                <span className="text-sm text-gray-400 mb-1">
                  Wallet Address
                </span>
                <div className="flex items-center gap-2">
                  {/* <img
                    src="/wallet-icon.svg"
                    alt="Wallet"
                    className="w-6 h-6"
                  /> */}
                  <span className="text-[#1D8751] font-mono text-base sm:text-lg select-all break-all">
                    {walletAddress}
                  </span>
                </div>
              </div>
              {/* Copy Button */}
              <button
                className="mt-4 sm:mt-0 cursor-pointer sm:ml-auto flex items-center text-[#1D8751] text-base font-medium hover:opacity-80 focus:outline-none"
                onClick={() => {
                  if (walletAddress) {
                    navigator.clipboard.writeText(walletAddress);
                    showToast.success(
                      "Copied!",
                      "Wallet address copied to clipboard."
                    );
                  }
                }}
                type="button"
                disabled={!walletAddress}
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
          )}

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
          <div
            className={`border border-[#F79330] rounded-[16px] bg-[#23232B] px-4 sm:px-6 py-4 mb-6 flex flex-col`}
          >
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
            {getFieldError("file", errors) && (
              <span className="text-red-500 text-sm mt-1">
                {getFieldError("file", errors)}
              </span>
            )}
            <p className="text-[#788099] text-[14px]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat
            </p>
          </div>

          {/* Confirm Checkbox */}
          <div className="flex items-center mb-8">
            <div className="relative">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmPayment}
                onChange={handleConfirmChange}
                className={`w-5 h-5 mr-2 appearance-none border-2 border-[#1D8751] bg-transparent checked:bg-[#1D8751] checked:border-[#1D8751] relative ${
                  getFieldError("confirmPayment", errors)
                    ? "border-red-500"
                    : ""
                }`}
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  appearance: "none",
                  background: "transparent",
                  border: "2px solid #1D8751",
                  borderRadius: "4px",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  position: "relative",
                }}
              />
              {confirmPayment && (
                <svg
                  className="absolute top-[2px] left-[2px] w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#1D8751"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <label htmlFor="confirm" className="text-white text-sm select-none">
              I confirm that I sent the payment
            </label>
            {getFieldError("confirmPayment", errors) && (
              <span className="text-red-500 text-sm ml-2">
                {getFieldError("confirmPayment", errors)}
              </span>
            )}
          </div>

          {/* General Error Message */}
          {getFieldError("submit", errors) && (
            <div className="text-red-500 text-sm mb-4">
              {getFieldError("submit", errors)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
            <Button
              borderRadius={18}
              type="button"
              variant="outline"
              className="w-full rounded-[18px] sm:flex-1"
              height={45}
              borderColor="#788099"
              onClick={() => {
                router.push("/dashboard/p2p/");
              }}
            >
              Cancel
            </Button>
            <Button
              borderRadius={18}
              type="submit"
              variant="primary"
              className="w-full rounded-[18px] sm:flex-1"
              height={45}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                "Deposit"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Deposit;
