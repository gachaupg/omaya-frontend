"use client";
import React, { useEffect, useState } from "react";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import { fetchUserPaymentDetails } from "../../../exchange/slices/paymentSlice";
import {
  fetchAssets,
  createWithdrawal,
} from "../../../exchange/slices/exchangeSlice";
import { fetchAdminPaymentMethods } from "../../../p2p/slices/paymentMethodsSlice";
import { fetchWithdrawalAddresses } from "../../../p2p/slices/orderSlice";
import { WithdrawalAddress } from "../../../p2p/types";
import { validateWalletAddress } from "../../../../lib/addressValidaion";
import { showToast } from "../../../../lib/utils/toast";
import UserPaymentSelector, {
  UserPaymentDetail,
} from "../../../p2p/components/ui/p2pdashboard/sections/UserPaymentSelector";

interface DepositFormProps {
  onExchange?: (transactionData: {
    type: "withdrawal";
    amount: number;
    asset: any;
    paymentDetails: any[];
    walletAddress: string;
    network: any;
  }) => void;
}

export default function DepositForm({ onExchange }: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { userPaymentDetails, loading, error } = useSelector(
    (state: any) => state.payment
  );
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );
  const { adminMethods, loading: adminLoading } = useSelector(
    (state: any) => state.paymentMethods
  );
  const { getWithdrawalAddresses, getWithdrawalAddressesLoading } = useSelector(
    (state: any) => state.p2pMarket
  );

  const [payAmount, setPayAmount] = useState(10);
  const [getAmount, setGetAmount] = useState(0.9);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedBscAddress, setSelectedBscAddress] = useState<string>("");

  // Payment selection state - same as Adds page
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<
    UserPaymentDetail[]
  >([]);

  useEffect(() => {
    dispatch(fetchUserPaymentDetails())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch user payment details: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAssets())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch assets: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAdminPaymentMethods())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch admin payment methods: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchWithdrawalAddresses())
      .unwrap()
      .then((addresses) => {
        console.log("Withdrawal Addresses:", addresses);
        console.log("Addresses Data:", addresses?.data);
        console.log("Debug Info:", addresses?.debug);

        // Auto-select the first BSC address if available
        if (addresses?.data && addresses.data.length > 0) {
          const bscAddress = addresses.data.find(
            (address: WithdrawalAddress) => address.chain === "BSC"
          );
          if (bscAddress) {
            setSelectedBscAddress(bscAddress.address);
            setWalletAddress(bscAddress.address);
          }
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch withdrawal addresses:", error);
        showToast.error(`Failed to fetch withdrawal addresses: ${error}`);
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

  // Payment selection handlers - same as Adds page
  const handleSelectPaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) =>
      prev.some((d) => d.id === detail.id) ? prev : [...prev, detail]
    );
  };

  const handleRemovePaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) => prev.filter((d) => d.id !== detail.id));
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];

    if (!payAmount || payAmount <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (!selectedAsset) {
      errors.push("Please select an asset");
    }

    if (selectedPaymentDetails.length === 0) {
      errors.push("Please select at least one payment method");
    }

    if (!selectedBscAddress.trim()) {
      errors.push("No BSC withdrawal address available");
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
      const withdrawalPayload = new FormData();
      withdrawalPayload.append("requested_amount", payAmount.toString());
      withdrawalPayload.append("withdrawal_address", selectedBscAddress);
      withdrawalPayload.append(
        "currency",
        selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol
      );
      withdrawalPayload.append("network", selectedNetwork.network_id);
      withdrawalPayload.append("asset", selectedAsset.asset_id);

      // Add payment methods info
      const paymentMethodsInfo = selectedPaymentDetails
        .map(
          (detail) =>
            `${detail.payment_provider_name}: ${detail.account_name} (${detail.account_number})`
        )
        .join(", ");
      withdrawalPayload.append("additional_info", paymentMethodsInfo);

      // Add user payment detail IDs
      const paymentDetailIds = selectedPaymentDetails.map(
        (detail) => detail.id
      );
      withdrawalPayload.append(
        "user_payment_detail_id",
        paymentDetailIds.join(",")
      );

      // Submit to API
      await dispatch(createWithdrawal({ payload: withdrawalPayload })).unwrap();

      // Show success message
      showToast.success("Withdrawal request submitted successfully!");

      // Proceed to next page only after successful submission
      if (onExchange) {
        onExchange({
          type: "withdrawal",
          amount: payAmount,
          asset: selectedAsset,
          paymentDetails: selectedPaymentDetails,
          walletAddress: selectedBscAddress,
          network: selectedNetwork,
        });
      }
    } catch (error: any) {
      let errorMessage = "Failed to submit withdrawal request";

      // Handle different error response formats
      if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

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
          {/* Second Row - You Get Amount and Payment Method Selection */}
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
          </div>

          {/* Payment Method Selection - Using UserPaymentSelector like Adds page */}
          <div className="mt-6">
            <UserPaymentSelector
              userPaymentDetails={userPaymentDetails || []}
              onSelect={handleSelectPaymentDetail}
              onRemove={handleRemovePaymentDetail}
              selectedDetails={selectedPaymentDetails}
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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

        {/* BSC Address Display */}
        {getWithdrawalAddresses?.data &&
          getWithdrawalAddresses.data.length > 0 && (
            <div className="mb-4">
              {getWithdrawalAddresses.data
                .filter((address: WithdrawalAddress) => address.chain === "BSC")
                .map((address: WithdrawalAddress) => (
                  <div
                    key={address.id}
                    className={`bg-[#1D1D23] border rounded-xl p-4 ${
                      selectedBscAddress === address.address
                        ? "border-[#1D8751] bg-[#1D8751]/10"
                        : "border-[#39394a]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        BSC Address{" "}
                        {selectedBscAddress === address.address && "(Selected)"}
                      </span>
                      <div className="flex gap-2">
                        {selectedBscAddress !== address.address && (
                          <button
                            onClick={() => {
                              setSelectedBscAddress(address.address);
                              setWalletAddress(address.address);
                            }}
                            className="bg-[#1D8751] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#166b3e] transition-colors"
                          >
                            Select
                          </button>
                        )}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(address.address);
                            showToast.success(
                              "BSC address copied to clipboard!"
                            );
                          }}
                          className="bg-[#39394a] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#4a4a5a] transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-[#788099] text-sm font-mono break-all">
                      {address.address}
                    </p>
                  </div>
                ))}
            </div>
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
