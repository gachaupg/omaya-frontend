import React, { useState, useEffect } from "react";
import Card from "../../../Common/Card";
import Loader from "../../../Common/Loader";
import Button from "../../../Common/Button";
import Input from "../../../Common/Input";
import { FaCheckCircle } from "react-icons/fa";
import {
  validateWithdrawalForm,
  getFieldError,
  type ValidationError,
  type WithdrawalFormData,
} from "./validation";
import { useDispatch, useSelector } from "react-redux";
import { createWithdrawal } from "@/features/p2p/slices/withdrawSlice";
import { AppDispatch } from "@/store";
import {
  type CreateP2PWithdrawRequest,
  type Currency,
  type Network,
  type WalletType,
  type AssetNetwork,
} from "@/features/p2p/types";
import Select from "../../../Common/Select";
import { fetchAssets } from "@/features/p2p/slices/assetsSlice";
import { showToast } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/rootReducer";
import { FinancialCalculator } from "@/lib/utils/financial";
import { useTransactionValidation } from "@/features/p2p/hooks/useTransactionValidation";

const Withdraw = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading: isSubmitting, error: submitError } = useSelector(
    (state: RootState) => state.withdrawals
  );
  const { data: assetsData, loading: assetsLoading } = useSelector(
    (state: RootState) => state.assets
  );
  const { validateTransaction } = useTransactionValidation();
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedNetworkId, setSelectedNetworkId] = useState("");
  const [amount, setAmount] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [binanceAddress, setBinanceAddress] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [confirmPayment, setConfirmPayment] = useState(false);

  useEffect(() => {
    if (!assetsData && !assetsLoading) {
      dispatch(fetchAssets());
    }
  }, [assetsData, assetsLoading, dispatch]);

  // Asset options (only show USDT Tether)
  const assetOptions =
    assetsData?.assets
      .filter((a: { symbol: string }) => a.symbol === "USDT Tether")
      .map((a: { asset_id: string; symbol: string }) => ({
        value: a.asset_id,
        label: a.symbol,
      })) || [];

  // Find selected asset and network
  const selectedAsset = assetsData?.assets.find(
    (a: { asset_id: string }) => a.asset_id === selectedAssetId
  );
  const networkOptions =
    selectedAsset?.networks.map((n: AssetNetwork) => ({
      value: n.network_id,
      label: n.network_type,
    })) || [];
  const selectedNetwork = selectedAsset?.networks.find(
    (n: AssetNetwork) => n.network_id === selectedNetworkId
  );

  // console.log(assetsData);

  // Withdrawal fee
  const withdrawalFee = selectedNetwork ? selectedNetwork.withdrawal_fee : "0";
  const { netAmount } = FinancialCalculator.calculateWithdrawalAmount(
    amount || "0",
    withdrawalFee
  );
  const receiveAmount = amount ? netAmount.toFixed(2) : "0.00";

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setErrors(errors.filter((error) => error.field !== "amount"));
  };

  const handleUsdtAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsdtAddress(e.target.value);
    setErrors(errors.filter((error) => error.field !== "walletAddress"));
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPayment(e.target.checked);
    setErrors(errors.filter((error) => error.field !== "confirmPayment"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: WithdrawalFormData = {
      amount,
      file: null, // Not needed for withdrawal
      confirmPayment,
      walletAddress: usdtAddress,
    };

    const validationErrors = validateWithdrawalForm(
      formData,
      selectedNetwork?.network_type,
      "USDT", // Use USDT instead of USDT Tether for validation
      validateTransaction
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const withdrawalData: CreateP2PWithdrawRequest = {
        amount: FinancialCalculator.toNumber(amount),
        currency: selectedAsset?.symbol as Currency,
        network: selectedNetwork?.network_type as Network,
        wallet_type: "withdraw",
        receiver_wallet: usdtAddress,
        binance_address: "",
      };

      const resultAction = await dispatch(createWithdrawal(withdrawalData));

      if (createWithdrawal.rejected.match(resultAction)) {
        throw new Error(
          resultAction.error.message || "Failed to submit withdrawal"
        );
      }

      // Reset form
      setAmount("");
      setUsdtAddress("");
      setConfirmPayment(false);
      setErrors([]);
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
    <div className="flex justify-center items-center min-h-screen w-full pt-2">
      <Card className="w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)] bg-[#1D1D23] px-4 sm:px-8 md:px-12 pt-4 p-0 border-1 border-[#35353E] shadow-xl rounded-[24px] flex flex-col mx-auto my-auto">
        <form onSubmit={handleSubmit}>
          {/* Asset & Network Selectors */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Asset Selector with Image inside */}
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Asset
              </label>
              <div className="relative w-full">
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
                    setSelectedNetworkId("");
                  }}
                  placeholder="Select Asset"
                  className="w-full h-[46px] rounded-[19px] pl-10 text-base"
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
                  className="w-full h-[46px] rounded-[19px] text-base"
                  style={{ minHeight: 46 }}
                  disabled={!selectedAssetId}
                />
              </div>
            </div>
          </div>
          {/* Address Type */}
          <div className="mb-2">
            <div className="flex items-center border border-[#1D8751] rounded-[12px] px-3 py-2 w-fit bg-[#]">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                alt="USDT"
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="text-white font-medium text-base">
                USDT Wallet Address
              </span>
              {/* Optionally add a TRC20 badge/icon here if needed */}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                I want to withdraw
              </label>
              <div
                className={`relative flex items-center py-3  pr-4 h-[46px] bg-[#35353E] border ${getInputBorderColor(
                  "amount"
                )} rounded-[19px] px-4`}
              >
                <span className="text-[#1D8751] text-lg font-semibold ">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full bg-transparent rounded-[19px] border-none text-white placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none p-0 text-lg"
                  min="0"
                  disabled={!selectedAssetId || !selectedNetworkId}
                />
                <span className="ml-2 text-xs flex text-gray-400">
                  <span className="text-[#1D8751]">Max.</span> USDT
                </span>
              </div>
              {getFieldError("amount", errors) && (
                <span className="text-red-500 text-sm mt-1">
                  {getFieldError("amount", errors)}
                </span>
              )}
            </div>
            {/* Receive Calculation with Fee */}
            <div className="flex-1 flex flex-col">
              <label className=" flex items-center justify-between text-xs font-medium text-gray-400 mb-1">
                You will receive
                <p>
                  {selectedNetwork && (
                    <span className="ml-4 text-xs text-[#F79330]">
                      Fee: {selectedNetwork.withdrawal_fee} USDT
                    </span>
                  )}
                </p>
              </label>
              <div className="relative flex items-center py-3  pr-4 h-[46px] bg-[#35353E] border border-[#23232B] rounded-[19px] px-4">
                <span className="text-[#1D8751] text-lg font-semibold mr-2">
                  $
                </span>
                <span className="text-white text-lg">{receiveAmount}</span>
                <span className="ml-2 text-xs text-gray-400">USDT</span>
              </div>
            </div>
          </div>

          {/* Wallet Address Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              USDT Address
            </label>
            <div
              className={`relative flex items-center py-3 h-[46px] bg-[#35353E] border ${getInputBorderColor(
                "walletAddress"
              )} rounded-[19px] px-4`}
            >
              <Input
                type="text"
                value={usdtAddress}
                onChange={handleUsdtAddressChange}
                placeholder="Paste your USDT address"
                className="w-full bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 focus:outline-none shadow-none p-0"
              />
              <button
                type="button"
                className="absolute right-4 text-[#1D8751] font-medium px-2 py-1 rounded hover:bg-[#1D8751]/10 transition"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setUsdtAddress(text);
                  } catch (e) {
                    showToast.error("Failed to paste from clipboard");
                  }
                }}
                style={{ top: "50%", transform: "translateY(-50%)" }}
              >
                Paste
              </button>
            </div>
            {getFieldError("walletAddress", errors) && (
              <span className="text-red-500 text-sm mt-1">
                {getFieldError("walletAddress", errors)}
              </span>
            )}
          </div>

          {/* Confirmation Checkbox */}
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
              borderColor="#788099"
              className="w-full sm:flex-1 "
              height={45}
              onClick={() => {
                setAmount("");
                setUsdtAddress("");
                setConfirmPayment(false);
                setErrors([]);
              }}
            >
              Cancel
            </Button>
            <Button
              borderRadius={18}
              type="submit"
              variant="secondary"
              className="w-full sm:flex-1"
              height={45}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Withdraw;
