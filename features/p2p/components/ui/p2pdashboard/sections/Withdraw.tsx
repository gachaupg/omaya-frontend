import React, { useState, useEffect } from "react";
import Card from "../../../Common/Card";
import Loader from "../../../Common/Loader";
import Button from "../../../Common/Button";
import Input from "../../../Common/Input";
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
  type Network,
  type AssetNetwork,
} from "@/features/p2p/types";
import Select from "../../../Common/Select";
import { fetchAssets } from "@/features/p2p/slices/assetsSlice";
import { showToast } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/rootReducer";
import { FinancialCalculator } from "@/lib/utils/financial";
import { useTransactionValidation } from "@/features/p2p/hooks/useTransactionValidation";
import OTPModal from "./otpModal";
import { Copy, HelpCircle } from "lucide-react";
import { useAvailableBalance, usePendingTotal } from "@/utils/pending";

const Withdraw: React.FC = () => {
  /* --------------------------------------------------------------------- */
  /*                             Redux + hooks                             */
  /* --------------------------------------------------------------------- */
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading: isSubmitting } = useSelector(
    (state: RootState) => state.withdrawals
  );
  const { data: assetsData, loading: assetsLoading } = useSelector(
    (state: RootState) => state.assets
  );
  const { validateTransaction } = useTransactionValidation();
  
  // Get available balance, wallet balance, and locked amounts (all exportable from pending utility)
  const { total: pendingTotal, balance: walletBalance, availableBalance, totalLocked } = usePendingTotal();

  /* --------------------------------------------------------------------- */
  /*                               Component state                         */
  /* --------------------------------------------------------------------- */
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedNetworkId, setSelectedNetworkId] = useState("");
  const [amount, setAmount] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState("");
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);

  /* --------------------------------------------------------------------- */
  /*                                Effects                                */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    if (!assetsData && !assetsLoading) dispatch(fetchAssets());
  }, [assetsData, assetsLoading, dispatch]);

  /* --------------------------------------------------------------------- */
  /*                           Derived select data                         */
  /* --------------------------------------------------------------------- */
  const assetOptions =
    assetsData?.assets
      .filter((a: { symbol: string }) => a.symbol === "USDT Tether")
      .map((a: { asset_id: string; symbol: string }) => ({
        value: a.asset_id,
        label: a.symbol,
      })) || [];

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

  /* --------------------------------------------------------------------- */
  /*                        Fee + “receive amount” calc                     */
  /* --------------------------------------------------------------------- */
  const withdrawalFee = selectedNetwork ? selectedNetwork.withdrawal_fee : "0";
  const { netAmount } = FinancialCalculator.calculateWithdrawalAmount(
    amount || "0",
    withdrawalFee
  );
  const receiveAmount = amount ? netAmount.toFixed(2) : "0.00";

  /* --------------------------------------------------------------------- */
  /*                            Helper & handlers                          */
  /* --------------------------------------------------------------------- */
  const border = (field: string) =>
    getFieldError(field, errors)
      ? "border-red-500"
      : "border-gray-300 dark:border-[#23232B]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: WithdrawalFormData = {
      amount,
      file: null,
      confirmPayment,
      walletAddress: usdtAddress,
    };

    const validationErrors = validateWithdrawalForm(
      formData,
      selectedNetwork?.network_type,
      "USDT",
      validateTransaction
    );

    // Additional validation: Check if withdrawal amount exceeds available balance
    if (amount && Number(amount) >( availableBalance - totalLocked)) {
      validationErrors.push({
        field: "amount",
        message: `Insufficient balance. Available: ${(availableBalance - totalLocked).toFixed(3)} USDT`,
      });
      showToast.error(`Insufficient balance. Available: ${availableBalance.toFixed(3)} USDT`);
    }

    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }

    try {
      const payload: CreateP2PWithdrawRequest = {
        amount: FinancialCalculator.toNumber(amount),
        currency: "USDT",
        network: selectedNetwork?.network_type as Network,
        wallet_type: "withdraw",
        receiver_wallet: usdtAddress,
      };

      const res = await dispatch(createWithdrawal(payload));
      if (createWithdrawal.rejected.match(res)) {
        throw new Error(res.error.message || "Failed to submit withdrawal");
      }

      showToast.success("Withdrawal request submitted successfully!");
      if ((res.payload as any).withdrawal_id) {
        setWithdrawalId((res.payload as any).withdrawal_id);
        setShowOTPModal(true);
      }

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

  /* --------------------------------------------------------------------- */
  /*                                 JSX                                   */
  /* --------------------------------------------------------------------- */
  return (
    <div className="flex justify-center items-center min-h-screen w-full pt-2">
      <Card
        className="w-full h-full min-h-screen sm:min-h-[calc(100vh-2rem)]
                       bg-white dark:bg-[#1D1D23]
                       border border-gray-200 dark:border-[#35353E]
                       shadow-xl rounded-[24px]
                       px-4 sm:px-8 md:px-12 pt-4"
      >
        <form onSubmit={handleSubmit}>
          {/* ----------------------------------------------------------------- */}
          {/*                       BALANCE INFO SECTION                         */}
          {/* ----------------------------------------------------------------- */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-[#35353E] rounded-lg border border-blue-200 dark:border-[#1D8751]">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Wallet Balance:</span>
                <p className="font-semibold text-sm">{walletBalance.toFixed(3)} USDT</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Locked:</span>
                <p className="font-semibold text-sm text-orange-600">-{totalLocked.toFixed(3)} USDT</p>
                <p className="text-[9px] text-gray-500 mt-0.5">
                  (Exchange + Sell Orders + P2P)
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Available:</span>
                <p className="font-semibold text-sm text-[#1D8751]">{availableBalance.toFixed(3)} USDT</p>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/*                       ASSET & NETWORK SELECTORS                    */}
          {/* ----------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Asset */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Asset
              </label>
              <div className="relative w-full">
                {selectedAsset?.asset_image && (
                  <img
                    src={selectedAsset.asset_image}
                    alt={selectedAsset.symbol}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
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
                  className="w-full h-[46px] pl-10 rounded-[19px] pr-10"
                  style={{ minHeight: 46, appearance: "none", background: "transparent" }}
                />
                {/* Custom filled arrow */}
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                  <svg width="20" height="20" fill="#ACACAC" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Network */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Network
              </label>
              <div className="relative w-full">
                <Select
                options={networkOptions}
                value={selectedNetworkId}
                onChange={(e) => setSelectedNetworkId(e.target.value)}
                placeholder="Select Network"
                className="w-full h-[46px] rounded-[19px] pr-10"
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

          {/* Wallet-type badge */}
          <div className="mb-2">
            <div className="flex items-center border border-[#1D8751] rounded-[12px] px-3 py-2 w-fit bg-gray-50 dark:bg-transparent">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                alt="USDT"
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="font-medium">USDT Wallet Address</span>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/*                      AMOUNT & RECEIVE SECTION                       */}
          {/* ----------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Amount input */}
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                I want to withdraw
              </label>
              <div
                className={`flex items-center h-[46px]
                            bg-gray-100 dark:bg-[#35353E]
                            border ${border("amount")}
                            rounded-[19px] px-4`}
              >
                <span className="text-[#1D8751] font-semibold mr-1">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors(errors.filter((er) => er.field !== "amount"));
                  }}
                  placeholder="0"
                  className="w-full bg-transparent border-none focus:outline-none"
                  min="0"
                  disabled={!selectedAssetId || !selectedNetworkId}
                />
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center gap-1">
                  <span 
                    className="text-[#1D8751] cursor-pointer hover:underline"
                    onClick={() => setAmount(availableBalance.toString())}
                    title={`Wallet: ${walletBalance.toFixed(3)} USDT\nLocked: ${totalLocked.toFixed(3)} USDT\nAvailable: ${availableBalance.toFixed(3)} USDT`}
                  >
                    Max.
                  </span> 
                  <span className="font-semibold text-[#1D8751]">{availableBalance.toFixed(3)} USDT</span>
                  <span className="text-[10px] text-gray-400">(Available)</span>
                </span>
              </div>
              {getFieldError("amount", errors) && (
                <span className="text-red-500 text-sm mt-1">
                  {getFieldError("amount", errors)}
                </span>
              )}
            </div>

            {/* Receive calculation */}
            <div className="flex-1 flex flex-col">
              <label className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                I will receive
                {selectedNetwork && (
                  <span className="ml-4 text-[#F79330]">
                    Fee: {selectedNetwork.withdrawal_fee} USDT
                  </span>
                )}
              </label>
                <div
                className="flex items-center h-[46px]
                        bg-gray-100 dark:bg-[#35353E]
                        border border-gray-300 dark:border-[#23232B]
                        rounded-[19px] px-4 justify-between relative"
                >
                <div className="relative">
                  <span className="text-[#1D8751] font-semibold mr-1">$</span>
                  <span>{receiveAmount}</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  USDT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                  e.preventDefault();
                  setShowInfoDropdown(!showInfoDropdown);
                  }}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <HelpCircle className="w-4 h-4 text-[#98A2B3] cursor-pointer" />
                </button>
                {showInfoDropdown && (
                  <div className="absolute bg-white dark:bg-[#35353E] border
                  border-gray-300 dark:border-[#1D8751] rounded-lg p-4 mt-1 shadow-lg z-30  right-2  top-12"
                  >
                  <p className="text-xs text-gray-600 dark:text-white">
                    A network fee will be deducted from withdrawals covering the cost of blockchain transaction.
                  </p>
                  </div>
                )}
                </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/*                      USDT ADDRESS INPUT                            */}
          {/* ----------------------------------------------------------------- */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
              USDT Address
            </label>
            <div
              className={"relative flex items-center gap-4"}
            >
              <div
                className={` w-full h-[46px] bg-gray-100 dark:bg-[#35353E]  border ${border("walletAddress")} rounded-[19px] px-4`}
              >
                <Input
                  type="text"
                  value={usdtAddress}
                onChange={(e) => {
                  setUsdtAddress(e.target.value);
                  setErrors(
                    errors.filter((er) => er.field !== "walletAddress")
                  );
                }}
                placeholder="Paste your USDT address"
                className="w-4/5 bg-transparent border-none focus:outline-none placeholder:text-gray-600 dark:placeholder:text-gray-400"
              />
              </div>
              <button
                type="button"
                className="h-full px-2 py-2 text-[#1D8751] bg-gray-100 dark:bg-[#35353E] font-medium rounded-[19px] flex items-center gap-2"
                onClick={async () => {
                  try {
                    const txt = await navigator.clipboard.readText();
                    setUsdtAddress(txt);
                  } catch {
                    showToast.error("Failed to paste from clipboard");
                  }
                }}
              >
                Paste 
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {getFieldError("walletAddress", errors) && (
              <span className="text-red-500 text-sm mt-1">
                {getFieldError("walletAddress", errors)}
              </span>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/*                         CONFIRM CHECKBOX                           */}
          {/* ----------------------------------------------------------------- */}
          <div className="flex items-center mb-8 gap-2">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmPayment}
              onChange={(e) => {
                setConfirmPayment(e.target.checked);
                setErrors(errors.filter((er) => er.field !== "confirmPayment"));
              }}
              className={`w-5 h-5 border-2 rounded
                          ${
                            confirmPayment
                              ? "bg-[#1D8751] border-[#1D8751]"
                              : "bg-transparent border-[#1D8751]"
                          }
                          ${
                            getFieldError("confirmPayment", errors)
                              ? "border-red-500"
                              : ""
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

          {/* General submit error */}
          {getFieldError("submit", errors) && (
            <div className="text-red-500 text-sm mb-4">
              {getFieldError("submit", errors)}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/*                           ACTION BUTTONS                           */}
          {/* ----------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button
              borderRadius={18}
              type="button"
              variant="outline"
              borderColor="#788099"
              className="w-full sm:flex-1"
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
                  Processing…
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/*                             OTP MODAL                               */}
      {/* ------------------------------------------------------------------- */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        withdrawalId={withdrawalId}
        amount={amount}
        onSuccess={() =>
          showToast.success("Withdrawal completed successfully!")
        }
      />
    </div>
  );
};

export default Withdraw;
