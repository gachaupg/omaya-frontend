"use client";
import React, { useEffect, useState } from "react";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import { fetchAdminPaymentDetails } from "../../../exchange/slices/paymentSlice";
import { fetchAssets } from "../../../exchange/slices/exchangeSlice";
import { createDeposit } from "../../../exchange/slices/exchangeSlice";
import { validateWalletAddress } from "../../../../lib/addressValidaion";
import { showToast } from "../../../../lib/utils/toast";

interface DepositFormProps {
  onExchange?: (transactionData: {
    type: "deposit";
    amount: number;
    asset: any;
    paymentDetail: any;
    walletAddress: string;
    network: any;
  }) => void;
}

export default function DepositForm({ onExchange }: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { adminPaymentDetails, loading, error } = useSelector(
    (state: any) => state.payment
  );
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );
  const [payAmount, setPayAmount] = useState(10);
  const [payBank, setPayBank] = useState("");
  const [getAmount, setGetAmount] = useState(0.9);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchAdminPaymentDetails())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch admin payment details: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAssets())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch assets: ${error}`);
      });
  }, [dispatch]);

  // Calculate fees and amounts - Network fee is always 0 for BEP20
  const networkFee = 0;
  const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
    ? parseFloat(selectedAsset.range_commissions[0].commission)
    : 0;
  const commissionAmount = (payAmount * commissionRate) / 100;
  const totalFees = networkFee + commissionAmount;
  const calculatedGetAmount = payAmount - totalFees;

  // Debug logging
  console.log("Selected Asset:", selectedAsset);
  console.log("Commission Rate:", commissionRate);
  console.log("Commission Amount:", commissionAmount);
  console.log("Pay Amount:", payAmount);
  console.log("Calculated Get Amount:", calculatedGetAmount);

  // Update getAmount when payAmount changes (if calculating from pay)
  useEffect(() => {
    if (isCalculatingFromPay) {
      setGetAmount(calculatedGetAmount);
    }
  }, [payAmount, networkFee, commissionAmount, isCalculatingFromPay]);

  // Update payAmount when getAmount changes (if calculating from get)
  useEffect(() => {
    if (!isCalculatingFromPay) {
      const newPayAmount = getAmount + totalFees;
      setPayAmount(newPayAmount);
    }
  }, [getAmount, totalFees, isCalculatingFromPay]);

  // Re-validate wallet address when asset changes (always BEP20)
  useEffect(() => {
    if (walletAddress.trim() && selectedAsset) {
      const validation = validateWalletAddress(walletAddress, "BEP20");
      if (!validation.isValid) {
        setWalletError(validation.message || "Invalid wallet address format");
      } else {
        setWalletError(null);
      }
    }
  }, [selectedAsset, walletAddress]);

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];

    if (!payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (!selectedAsset) {
      errors.push("Please select an asset");
    }

    if (!selectedPaymentDetail) {
      errors.push("Please select a payment method");
    }

    if (!walletAddress.trim()) {
      errors.push("Please enter your wallet address");
    }

    if (walletError) {
      errors.push("Please fix the wallet address errors");
    }

    if (!selectedNetwork) {
      errors.push("Please select a network");
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Clear previous errors
    setValidationErrors([]);

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for API submission
      const depositPayload = new FormData();
      depositPayload.append("requested_amount", payAmount.toString());
      depositPayload.append("deposit_address", walletAddress);
      depositPayload.append(
        "payment_provider",
        selectedPaymentDetail.provider_name
      );
      depositPayload.append(
        "payment_method",
        selectedPaymentDetail.payment_method_type
      );
      depositPayload.append(
        "currency",
        selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol
      );
      depositPayload.append("network", selectedNetwork.network_id);
      depositPayload.append("asset", selectedAsset.asset_id);
      depositPayload.append(
        "additional_info",
        `Account: ${selectedPaymentDetail.account_name}, Account Number: ${selectedPaymentDetail.account_number}`
      );

      // Submit to API
      await dispatch(createDeposit({ payload: depositPayload })).unwrap();

      // Show success message
      showToast.success("Deposit request submitted successfully!");

      // Proceed to next page only after successful submission
      if (onExchange) {
        onExchange({
          type: "deposit",
          amount: payAmount,
          asset: selectedAsset,
          paymentDetail: selectedPaymentDetail,
          walletAddress: walletAddress,
          network: selectedNetwork,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to submit deposit request";
      showToast.error(errorMessage);
      setValidationErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center bg-[#18181f]">
      <h2 className="text-xl font-bold  mb-2 text-[#788099]">
        <span className="text-[#7e7e8f]">1-</span> Transaction Info
      </h2>
      <div className=" flex items-center justify-center ">
        <div className="bg-[#23232b] border-2 border-[#35353E]  rounded-2xl p-3 shadow-lg w-full max-w-4xl mx-auto text-white">
          {/* First Row - Amount and Asset */}
          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Amount
              </label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => {
                  setPayAmount(Number(e.target.value));
                  setIsCalculatingFromPay(true);
                }}
                onFocus={() => setIsCalculatingFromPay(true)}
                className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Asset
              </label>
              <select
                value={selectedAsset?.asset_id || ""}
                onChange={(e) => {
                  const asset = assets?.assets?.find(
                    (a: any) => a.asset_id === e.target.value
                  );
                  setSelectedAsset(asset || null);
                  // Auto-select BEP20 network when asset is selected
                  if (asset && asset.networks) {
                    const bep20Network = asset.networks.find(
                      (n: any) => n.network_type === "BEP20"
                    );
                    setSelectedNetwork(bep20Network || null);
                  }
                }}
                disabled={assetsLoading}
                className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none disabled:opacity-50"
              >
                <option value="">
                  {assetsLoading ? "Loading assets..." : "Select Asset"}
                </option>
                {assets?.assets?.map((asset: any) => (
                  <option key={asset.asset_id} value={asset.asset_id}>
                    {asset.symbol} - {asset.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Fee & Rate - Dynamic based on selected asset */}
          <div className="flex items-center rounded-2xl border border-[#39394a] bg-[#23232b] px-2 py-2 mb-3">
            <div className="flex flex-col gap-2 flex-1">
              <span className="flex items-center bg-[#F79330] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Network fee: $0 USD (BEP20)
              </span>

              <span className="flex items-center bg-[#1D8751] text-white rounded-full px-5 py-1 text-sm font-medium w-fit">
                <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block"></span>
                Commission: {commissionRate}% of ${payAmount} = $
                {commissionAmount.toFixed(2)}
              </span>
            </div>
            <span className="ml-auto flex items-center justify-center w-12 h-12 bg-[#23232b] rounded-2xl border border-[#39394a]">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png"
                alt=""
              />
            </span>
          </div>
          {/* Second Row - You Get Amount and Bank/Payment Method */}
          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                You Get
              </label>
              <input
                type="number"
                value={getAmount}
                onChange={(e) => {
                  setGetAmount(Number(e.target.value));
                  setIsCalculatingFromPay(false);
                }}
                onFocus={() => setIsCalculatingFromPay(false)}
                className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Bank/Payment Method
              </label>
              <select
                value={payBank}
                onChange={(e) => {
                  const selectedPayment = adminPaymentDetails?.find(
                    (payment: any) => payment.provider_name === e.target.value
                  );
                  setPayBank(e.target.value);
                  setSelectedPaymentDetail(selectedPayment || null);
                }}
                disabled={loading}
                className="w-full bg-[#1D1D23] rounded-2xl px-4 py-2 text-lg text-white focus:outline-none border border-[#39394a] appearance-none disabled:opacity-50"
              >
                <option value="">
                  {loading
                    ? "Loading payment methods..."
                    : "Select Payment Method"}
                </option>
                {adminPaymentDetails?.map((payment: any, index: number) => (
                  <option key={index} value={payment.provider_name}>
                    {payment.provider_name} - {payment.payment_method_type}
                  </option>
                ))}
              </select>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
          </div>

          {/* Show account details when payment method is selected */}
          {selectedPaymentDetail && (
            <div className="mt-3 flex flex-row gap-3">
              {/* Account Name Card */}
              <div className="flex-1 flex items-center justify-between p-3 h-12 bg-[#1D1D23] rounded-xl border border-[#39394a]">
                <div className="flex items-center gap-3">
                  <span className="text-[#7e7e8f] text-sm font-medium">
                    Account Name:
                  </span>
                  <span className="text-white text-sm font-medium">
                    {selectedPaymentDetail.account_name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      selectedPaymentDetail.account_name
                    );
                    showToast.success("copied!");
                  }}
                  className="text-[#1D8751] hover:text-white transition-colors p-1 rounded"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="8"
                      y="2"
                      width="8"
                      height="4"
                      rx="1"
                      ry="1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Account Number Card */}
              <div className="flex-1 flex items-center justify-between p-3 h-12 bg-[#1D1D23] rounded-xl border border-[#39394a]">
                <div className="flex items-center gap-3">
                  <span className="text-[#7e7e8f] text-sm font-medium">
                    Account Number:
                  </span>
                  <span className="text-white text-sm font-medium">
                    {selectedPaymentDetail.account_number}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      selectedPaymentDetail.account_number
                    );
                    showToast.success("copied!");
                  }}
                  className="text-[#1D8751] hover:text-white transition-colors p-1 rounded"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="8"
                      y="2"
                      width="8"
                      height="4"
                      rx="1"
                      ry="1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold  mb-2 text-[#788099]">
        <span className="text-[#7e7e8f]">2-</span> Wallet Address
      </h2>
      <div className="flex flex-col bg-[#23232b] border-2 border-[#35353E] rounded-2xl p-5 shadow-lg w-full max-w-4xl mx-auto text-white mb-6">
        {/* Wallet/Account Address Label */}
        <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
          Wallet/Account Address
        </label>
        {/* Input group */}
        <div className="flex items-center bg-[#23232b] border border-[#39394a] rounded-2xl px-4 py-2 mb-4">
          {/* Left icon */}
          <span className="mr-2 text-[#1D8751]">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path
                d="M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                stroke="#1D8751"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="3"
                width="12"
                height="12"
                rx="2"
                stroke="#1D8751"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => {
              const value = e.target.value;
              setWalletAddress(value);

              // Validate immediately as user types
              if (value.trim() === "") {
                setWalletError(null);
              } else if (!selectedAsset) {
                setWalletError("Please select an asset first");
              } else {
                const validation = validateWalletAddress(value, "BEP20");

                if (!validation.isValid) {
                  const errorMessage =
                    validation.message || "Invalid wallet address format";
                  setWalletError(errorMessage);
                  setForceUpdate((prev) => prev + 1);
                } else {
                  setWalletError(null);
                  setForceUpdate((prev) => prev + 1);
                }
              }
            }}
            placeholder="Paste here your Crypto address"
            className={`flex-1 bg-transparent border-none outline-none text-white placeholder-[#788099] text-base ${
              walletError
                ? "border-red-500"
                : walletAddress.trim() && !walletError
                ? "border-green-500"
                : ""
            }`}
          />
          {/* Bookmark icon */}
          <span className="mx-2 text-[#788099] cursor-pointer">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                stroke="#788099"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {/* Paste button */}
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                setWalletAddress(text);
              } catch (err) {
                console.error("Failed to read clipboard:", err);
                showToast.error("Failed to paste from clipboard");
              }
            }}
            className="flex items-center gap-1 bg-[#23232b] border border-[#1D8751] text-[#1D8751] rounded-full px-4 py-1 ml-2 font-semibold text-base hover:bg-[#1D8751] hover:text-white transition-colors"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Paste
          </button>
        </div>

        {/* Show validation messages below the wallet address input */}
        {walletError && (
          <p className="text-red-500 text-sm mt-2 font-medium">
            ❌ {walletError}
          </p>
        )}

        {walletAddress.trim() && !walletError && selectedAsset && (
          <p className="text-green-500 text-sm mt-2 font-medium">
            ✅ Valid BEP20 address
          </p>
        )}

        {/* Terms and Conditions Summary */}
        <div className="flex items-center mb-2">
          <span className="mr-2 text-[#1D8751]">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="2" />
              <line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
                stroke="#1D8751"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="#1D8751" />
            </svg>
          </span>
          <span className="text-base font-semibold text-[#7e7e8f]">
            Terms and Conditions Summary
          </span>
        </div>
        <div className="bg-[#23232b] border border-[#1D8751] rounded-xl p-4">
          <ul className="list-none space-y-2">
            <li className="flex items-start">
              <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
              <span className="text-white text-sm">
                Please send the money from your own account Only
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
              <span className="text-white text-sm">
                Put transaction ID in the description field of the bank
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
              <span className="text-white text-sm">
                Please note, If you do not follow above conditions, we will
                reject your transaction and send you back your money.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className="max-w-4xl mx-auto w-full px-2 mb-4">
          <div className="bg-red-500/10 border border-red-500 rounded-2xl p-4">
            <h3 className="text-red-500 font-semibold mb-2">
              Please fix the following errors:
            </h3>
            <ul className="list-disc list-inside text-red-400 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Disclaimer and Button outside the card */}
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
        <div className="flex items-center text-white text-[16px] font-semibold">
          <FaExclamationCircle className="mr-2 text-red-500" />
          <span>
            This is only an estimated price based on current market rates. The
            final price will be confirmed when we receive the funds.
          </span>
        </div>
        <button
          className={`w-full text-white text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
            isSubmitting
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-[#1D8751] hover:bg-[#166b3e]"
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            <span className="flex items-center justify-center">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
                alt=""
              />
              <img
                className="mt-2"
                src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                alt=""
              />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
