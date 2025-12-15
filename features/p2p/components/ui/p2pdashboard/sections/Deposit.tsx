import React, { useState, useEffect } from "react";
import Button from "../../../Common/Button";
import Card from "../../../Common/Card";
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
import { AlertCircle } from "lucide-react";

const Deposit: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  /* ------------------------------ selectors ----------------------------- */
  const { loading: isSubmitting } = useSelector((s: RootState) => s.deposits);
  const { data: assetsData, loading: assetsLoading } = useSelector(
    (s: RootState) => s.assets
  );

  /* ------------------------------- state -------------------------------- */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedNetworkId, setSelectedNetworkId] = useState("");
  const { validateTransaction } = useTransactionValidation();

  /* ------------------------------ effects ------------------------------- */
  useEffect(() => {
    if (!assetsData && !assetsLoading) dispatch(fetchAssets());
  }, [assetsData, assetsLoading, dispatch]);

  /* ------------------------- derived selections ------------------------- */
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
  const adminAccount = selectedAsset?.admin_accounts.find(
    (acc) => acc.network === selectedNetwork?.network_type
  );
  const walletAddress = adminAccount?.wallet_address || "";
  const assetOptions =
    assetsData?.assets
      .filter((a) => a.symbol === "USDT Tether")
      .map((a) => ({ value: a.asset_id, label: a.symbol })) || [];

  const borderColor = (field: string) =>
    getFieldError(field, errors)
      ? "border-red-500"
      : "border-gray-300 dark:border-[#23232B]";

  /* --------------------------- form handlers --------------------------- */
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
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }

    try {
      const payload: CreateP2PDepositRequest = {
        amount: FinancialCalculator.toNumber(amount),
        currency: "USDT" as Currency,
        network: "TRON" as Network,
        wallet_type: "USDT" as WalletType,
        document: selectedFile as File,
      };

      const res = await dispatch(createDeposit(payload));
      if (createDeposit.rejected.match(res))
        throw new Error(res.error.message || "Failed to submit deposit");

      showToast.success(
        "Deposit submitted successfully",
        "Your deposit request has been received and is being processed."
      );
      // reset
      setAmount("");
      setSelectedFile(null);
      setConfirmPayment(false);
      setErrors([]);
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

  /* -------------------------------- render ------------------------------ */
  return (
    <div className="flex justify-center items-center min-h-screen w-full pt-1">
      <Card className="w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)] px-4 sm:px-8 md:px-12 pt-4 p-0 bg-white dark:bg-[var(--card-color)] border border-gray-200 dark:border-[#35353E] shadow-xl rounded-[24px] mx-auto text-gray-900 dark:text-white">
        <form onSubmit={handleSubmit}>
          {/* ---------------- Asset & Network ---------------- */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4">
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Asset
              </label>
              <div className="relative w-full">
                {selectedAsset?.asset_image && (
                  <img
                    src={selectedAsset.asset_image}
                    alt={selectedAsset.symbol}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full object-contain"
                  />
                )}
                <Select
                  options={assetOptions}
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    setSelectedNetworkId("");
                  }}
                  placeholder="Select Asset"
                  className="w-full h-[24px] pl-12 rounded-[19px] text-base pr-10"
                  style={{ minHeight: 46 , appearance: "none", background: "transparent" }}
                />
                 {/* Custom filled arrow */}
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                  <svg width="20" height="20" fill="#ACACAC" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5" />
                  </svg>
                </span> 
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Network
              </label>
              <div className="relative w-full">
                <Select
                options={networkOptions}
                value={selectedNetworkId}
                onChange={(e) => setSelectedNetworkId(e.target.value)}
                placeholder="Select Network"
                className="w-full h-[24px] rounded-[19px] text-base pr-10"
                style={{ minHeight: 46, appearance: "none", background: "transparent" }}
                disabled={!selectedAssetId}
              />
                {/* Custom filled arrow */}
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                <svg width="20" height="20" fill="#ACACAC" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5" />
                </svg>
              </span>
              </div>
            </div>
          </div>

          {/* ----------------------- Amount ---------------------- */}
            <div className="mb-4">
            <label className="block text-sm font-medium text-black dark:text-gray-400 mb-2">
              Amount
            </label>
            <div
              className={`flex items-center px-3 py-4 h-[46px] rounded-[19px] bg-white dark:bg-[#35353E] border ${borderColor(
              "amount"
              )}`}
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
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors(errors.filter((err) => err.field !== "amount"));
              }}
              placeholder="Enter Amount"
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[#727272] dark:text-gray-400 placeholder-black dark:placeholder-gray-400"
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

          {/* --------------- Wallet Address/QR block -------------- */}
          {selectedAssetId && selectedNetworkId && (
            <div className="w-full bg-gray-50 dark:bg-[#35353E] border border-[#1D8751] rounded-[24px] flex flex-col sm:flex-row items-center p-4 sm:px-8 mt-4">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1747039472/download_1_qytuya.png"
                alt="QR"
                className="w-[60px] h-[60px] rounded-[8px] bg-white object-contain mb-4 sm:mb-0"
              />
              <div className="flex flex-col sm:ml-8 flex-1">
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Wallet Address
                </span>
                <span className="text-[#1D8751] font-mono break-all select-all text-base">
                  {walletAddress}
                </span>
              </div>
              <button
                type="button"
                disabled={!walletAddress}
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  showToast.success(
                    "Copied!",
                    "Wallet address copied to clipboard."
                  );
                }}
                className="mt-4 sm:mt-0 sm:ml-auto text-[#1D8751] font-medium hover:opacity-80"
              >
                Copy
              </button>
            </div>
          )}

          {/* -------------------- Transfer rules ------------------- */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Transfer Details
              </span>{" "}
              <AlertCircle className="w-4 h-4 text-[#1D8751]" />
            </div>
            <div className="border border-[#1D8751] rounded-[16px] bg-gray-50 dark:bg-[var(--card-color)] px-4 py-4 mb-6 text-sm">
              {[
                "Please send the money from your own account only.",
                "Put transaction ID in the description field of the bank.",
                "If you don't follow these conditions, we will reject the transaction and refund you.",
              ].map((msg, i) => (
                <p key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                  <span className="inline-block w-3 h-3 bg-[#1D8751] rounded-full"></span>
                  {msg}
                </p>
              ))}
            </div>
          </div>

          {/* -------------------- Upload proof ------------------- */}
          <div className="border border-[#F79330] rounded-[16px] bg-gray-50 dark:bg-[var(--card-color)] px-4 py-4 mb-6">
            <div className="flex items-center mb-2 font-medium">
              Upload Documents
              <label className="ml-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                      setErrors(errors.filter((err) => err.field !== "file"));
                    }
                  }}
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
                <span className="ml-3 text-xs text-gray-500 truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
              )}
            </div>
            {getFieldError("file", errors) && (
              <span className="text-red-500 text-sm">
                {getFieldError("file", errors)}
              </span>
            )}
            <p className="text-[#788099] text-sm mt-2">
              Please upload proof of transfer (e.g., screenshot or receipt).
            </p>
          </div>

          {/* ------------------- Confirm checkbox ------------------ */}
          <div className="flex items-center mb-8 gap-2">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmPayment}
              onChange={(e) => {
                setConfirmPayment(e.target.checked);
                setErrors(
                  errors.filter((err) => err.field !== "confirmPayment")
                );
              }}
              className={`w-5 h-5 border-2 rounded ${
                confirmPayment
                  ? "bg-[#1D8751] border-[#1D8751]"
                  : "bg-transparent border-[#1D8751]"
              } ${
                getFieldError("confirmPayment", errors) ? "border-red-500" : ""
              }`}
            />
            <label htmlFor="confirm" className="text-sm select-none">
              I confirm that I sent the payment
            </label>
            {getFieldError("confirmPayment", errors) && (
              <span className="text-red-500 text-sm ml-2">
                {getFieldError("confirmPayment", errors)}
              </span>
            )}
          </div>

          {/* -------------------- General error ------------------- */}
          {getFieldError("submit", errors) && (
            <div className="text-red-500 text-sm mb-4">
              {getFieldError("submit", errors)}
            </div>
          )}

          {/* --------------------- Action btns -------------------- */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button
              borderRadius={18}
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              height={45}
              borderColor="#788099"
              onClick={() => router.push("/dashboard/p2p/")}
            >
              Cancel
            </Button>
            <Button
              borderRadius={18}
              type="submit"
              variant="primary"
              className="w-full sm:flex-1"
              height={45}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" /> Processing...
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
