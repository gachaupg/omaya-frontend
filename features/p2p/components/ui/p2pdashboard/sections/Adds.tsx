// src/features/p2p/components/ui/p2pdashboard/sections/Adds.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Button from "../../../Common/Button";
import Card from "../../../Common/Card";
import Loader from "../../../Common/Loader";
import { postP2POrderThunk } from "../../../../slices/adSlice";
import {
  fetchUserPaymentDetails,
  fetchAdminPaymentMethods,
} from "../../../../slices/paymentMethodsSlice";
import { showToast } from "@/lib/utils/toast";
import { RootState } from "@/store/rootReducer";

import { validateP2PAd } from "@/lib/utils/validators";
import PaymentMethodsModal from "./PaymentMethodsModal";
import UserPaymentSelector, { UserPaymentDetail } from "./UserPaymentSelector";

interface AddsProps {
  filterType: "buy" | "sell";
}

interface ValidationErrors {
  amount?: string;
  orderMin?: string;
  orderMax?: string;
  commission?: string;
  timeLimit?: string;
  paymentMethod?: string;
  provider?: string;
  terms?: string;
  autoReply?: string;
}

const COLORS = {
  buy: "#1D8751",
  sell: "#E23D3A",
};

const paymentMethods = [
  { label: "Bank Transfer", value: "bank" },
  { label: "Mobile Money", value: "mobile" },
  { label: "Merchant", value: "merchant" },
];

const providers = [
  { label: "Salam Bank", value: "salam" },
  // Add more providers as needed
];

const timeLimits = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
];

const Adds: React.FC<AddsProps> = ({ filterType }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector((state: RootState) => state.p2pAds);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const {
    userPaymentDetails,
    userDetailsLoading,
    adminMethods,
    loading: adminLoading,
  } = useSelector((state: RootState) => state.paymentMethods);
  const { postOrderLoading, postOrderError, postOrderSuccess } = useSelector(
    (state: RootState) => state.p2pAds
  );

  const [type, setType] = useState(filterType);
  const [asset] = useState("Tether USDT TRC20");
  const [commission, setCommission] = useState(0.1);
  const [amount, setAmount] = useState("");
  const [orderMin, setOrderMin] = useState("");
  const [orderMax, setOrderMax] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [provider, setProvider] = useState(providers[0].value);
  const [timeLimit, setTimeLimit] = useState(timeLimits[0].value);
  const [terms, setTerms] = useState("");
  const [autoReply, setAutoReply] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<
    UserPaymentDetail[]
  >([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails() as any);
      dispatch(fetchAdminPaymentMethods() as any);
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedPaymentDetails.length > 0) {
      console.log("Selected Payment Details:", selectedPaymentDetails);
    }
  }, [selectedPaymentDetails]);

  useEffect(() => {
    if (error) {
      showToast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (postOrderError) {
      showToast.error(postOrderError);
    }
    if (postOrderSuccess) {
      showToast.success("Ad created successfully");
      router.push("/dashboard/p2p/");
      dispatch({ type: "p2pAds/clearPostOrderStatus" });
    }
  }, [postOrderError, postOrderSuccess, router, dispatch]);

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    const amountError = validateP2PAd.amount(amount);
    if (amountError) {
      newErrors.amount = amountError;
      isValid = false;
    }

    const minOrderError = validateP2PAd.minOrderAmount(orderMin);
    if (minOrderError) {
      newErrors.orderMin = minOrderError;
      isValid = false;
    }

    const maxOrderError = validateP2PAd.maxOrderAmount(orderMax, orderMin);
    if (maxOrderError) {
      newErrors.orderMax = maxOrderError;
      isValid = false;
    }

    const commissionError = validateP2PAd.commission(commission);
    if (commissionError) {
      newErrors.commission = commissionError;
      isValid = false;
    }

    const timeLimitError = validateP2PAd.timeLimit(timeLimit);
    if (timeLimitError) {
      newErrors.timeLimit = timeLimitError;
      isValid = false;
    }

    const paymentMethodError = validateP2PAd.paymentMethod(paymentMethod);
    if (paymentMethodError) {
      newErrors.paymentMethod = paymentMethodError;
      isValid = false;
    }

    const providerError = validateP2PAd.provider(provider);
    if (providerError) {
      newErrors.provider = providerError;
      isValid = false;
    }

    const termsError = validateP2PAd.terms(terms);
    if (termsError) {
      newErrors.terms = termsError;
      isValid = false;
    }

    const autoReplyError = validateP2PAd.autoReply(autoReply);
    if (autoReplyError) {
      newErrors.autoReply = autoReplyError;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (selectedPaymentDetails.length === 0) {
      setErrors((prev) => ({
        ...prev,
        paymentMethod: "Select at least one payment method",
      }));
      return;
    }
    const adData = {
      order_type: type,
      currency: "USDT",
      amount,
      min_order_amount: orderMin,
      max_order_amount: orderMax,
      commission_rate: commission.toString(),
      exchange_rate: "0.3",
      payment_method_name: selectedPaymentDetails[0]?.payment_method_name || "",
      payment_provider_name:
        selectedPaymentDetails[0]?.payment_provider_name || "",
      account_number: "",
      account_name: "",
      limit: timeLimit.toString(),
      completion_time: timeLimit.toString(),
      completion_rate: "",
      asset: "TRON",
      advertiser_name: {
        id: 1,
        username: "dennis",
        email: "denixxdenixx64@gmail.com",
      },
      auto_reply: autoReply,
      terms_and_conditions: terms,
      payment_details_ids: selectedPaymentDetails.map((d) => d.id),
    };
    dispatch(postP2POrderThunk(adData) as any);
  };

  const handleSelectPaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) =>
      prev.some((d) => d.id === detail.id) ? prev : [...prev, detail]
    );
  };

  const handleRemovePaymentDetail = (detail: UserPaymentDetail) => {
    setSelectedPaymentDetails((prev) => prev.filter((d) => d.id !== detail.id));
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full p-0 sm:p-4 min-h-screen flex flex-col items-center justify-start bg-white dark:bg-[#0A0A0A]">
      {loading && <Loader />}
      {/* Title and Buy/Sell Switch */}
      <div className="mb-1 w-full md:max-w-4xl md:mx-auto px-0 sm:px-0">
        <div className="text-gray-900 dark:text-white text-lg mb-1">
          Post Ad
        </div>
        <div
          className={`flex w-fit border-2 rounded-[8px] overflow-hidden ${
            type === "buy" ? "border-[#1D8751]" : "border-[#E23D3A]"
          }`}
        >
          <button
            className={`px-2 py-1 text-sm transition rounded-l-[6px] ${
              type === "buy"
                ? "bg-[#1D8751] text-white"
                : "bg-transparent text-white"
            }`}
            onClick={() => setType("buy")}
            type="button"
          >
            Buy
          </button>
          <button
            className={`px-4 py-1 text-sm transition rounded-r-[6px] ${
              type === "sell"
                ? "bg-[#E23D3A] text-white"
                : "bg-transparent text-white"
            }`}
            onClick={() => setType("sell")}
            type="button"
          >
            Sell
          </button>
        </div>
      </div>

      {/* Type & Price */}
      <div className="w-full md:max-w-4xl md:mx-auto px-0 sm:px-2 md:px-0">
        <div className="text-sm text-gray-600 dark:text-[#788099] mb-2 mt-3">
          Type & Price
        </div>
        <Card className="w-full mb-2 px-2 py-2 sm:px-2 sm:py-2 bg-gray-50 dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] rounded-[24px]">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end w-full">
            {/* Asset */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs text-gray-600 dark:text-[#788099] mb-2">
                Asset
              </span>
              <div
                className="flex w-full items-center
               bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[19px] px-2 py-2 min-h-[40px]"
              >
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                  alt="USDT"
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-gray-900 dark:text-white text-base ml-2">
                  {asset}
                </span>
              </div>
            </div>

            {/* Commission */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs text-gray-600 dark:text-[#788099] mb-2">
                Commission
              </span>
              <div
                className={`flex w-full items-center justify-between bg-white dark:bg-[#18181D] border ${
                  errors.commission
                    ? "border-red-500"
                    : "border-gray-200 dark:border-[#35353E]"
                } rounded-[19px] min-h-[40px]`}
              >
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-[#1D8751] mr-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 9V7a5 5 0 00-10 0v2" />
                    <path d="M12 17v2a2 2 0 002 2h4a2 2 0 002-2v-2" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="text-gray-900 dark:text-white text-base mr-4">
                    {commission}%
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    className="text-[#1D8751] text-xl w-8 h-8 rounded-full hover:bg-[#1D8751]/10 flex items-center justify-center transition mr-2"
                    onClick={() => {
                      setCommission((c) =>
                        Math.min(1, Number((c + 0.1).toFixed(1)))
                      );
                      setErrors((prev) => ({ ...prev, commission: undefined }));
                    }}
                  >
                    +
                  </button>
                  <button
                    className="text-[#1D8751] text-xl w-8 h-8 rounded-full hover:bg-[#1D8751]/10 flex items-center justify-center transition"
                    onClick={() => {
                      setCommission((c) =>
                        Math.max(0, Number((c - 0.1).toFixed(1)))
                      );
                      setErrors((prev) => ({ ...prev, commission: undefined }));
                    }}
                  >
                    –
                  </button>
                </div>
              </div>
              {errors.commission && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.commission}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Amount & Payment Method */}
        <div className="text-sm text-gray-600 dark:text-[#788099] mb-2 mt-3">
          Amount & Payment Method
        </div>
        <Card className="w-full mb-4 px-2 py-2 sm:px-2 sm:py-2 bg-gray-50 dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] rounded-[24px]">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* I want to Buy */}
            <div className="flex-1 flex flex-col">
              <label className="text-xs text-gray-600 dark:text-[#788099] mb-1">
                I want to {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
              <div className="flex items-center bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[19px] px-2 py-2 min-h-[40px]">
                <img
                  src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                  alt="USDT"
                  className="w-6 h-6 rounded-full"
                />
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }}
                  className={`w-full bg-transparent border-none text-gray-900 dark:text-white text-base focus:outline-none ${
                    errors.amount
                      ? "border-2 border-red-500 rounded-[19px]"
                      : ""
                  }`}
                  placeholder="0.000"
                />
                <span className="text-gray-500 dark:text-[#788099] text-base ml-2">
                  USDT
                </span>
              </div>
              {errors.amount && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.amount}
                </span>
              )}
            </div>

            {/* Order Min */}
            <div className="flex-1 flex flex-col">
              <label className="text-xs text-gray-600 dark:text-[#788099] mb-1">
                Order Min.
              </label>
              <div className="flex items-center bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[19px] px-2 py-2 min-h-[40px]">
                <span className="text-[#1D8751] text-lg mr-1">$</span>
                <input
                  type="text"
                  value={orderMin}
                  onChange={(e) => {
                    setOrderMin(e.target.value);
                    setErrors((prev) => ({ ...prev, orderMin: undefined }));
                  }}
                  className="w-full bg-transparent border-none text-gray-900 dark:text-white text-base focus:outline-none"
                  placeholder="20.00"
                />
                <span className="text-gray-500 dark:text-[#788099] text-base ml-2">
                  USD
                </span>
              </div>
              {errors.orderMin && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.orderMin}
                </span>
              )}
            </div>

            {/* Order Max */}
            <div className="flex-1 flex flex-col">
              <label className="text-xs text-gray-600 dark:text-[#788099] mb-1">
                Order Max
              </label>
              <div className="flex items-center bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] rounded-[19px] px-2 py-2 min-h-[40px]">
                <span className="text-[#1D8751] text-lg mr-1">$</span>
                <input
                  type="text"
                  value={orderMax}
                  onChange={(e) => {
                    setOrderMax(e.target.value);
                    setErrors((prev) => ({ ...prev, orderMax: undefined }));
                  }}
                  className="w-full bg-transparent border-none text-gray-900 dark:text-white text-base focus:outline-none"
                  placeholder="200.00"
                />
                <span className="text-gray-500 dark:text-[#788099] text-base ml-2">
                  USD
                </span>
              </div>
              {errors.orderMax && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.orderMax}
                </span>
              )}
            </div>
          </div>

          {/* Replace old payment method/provider dropdowns with UserPaymentSelector */}
          {isClient && (
            <div className="my-6  gap-10 flex flex-row">
              <UserPaymentSelector
                userPaymentDetails={userPaymentDetails || []}
                onSelect={handleSelectPaymentDetail}
                onRemove={handleRemovePaymentDetail}
                selectedDetails={selectedPaymentDetails}
              />
              {/* Time Limit */}
              <div className="flex  flex-col md:flex-row gap-4 mb-4">
                {/* Time Limit */}
                <div className="flex-1 flex flex-col">
                  <label className="text-sm text-gray-600 dark:text-[#788099] mb-1">
                    Time Limit
                  </label>
                  <select
                    className={`bg-white dark:bg-[#18181D] border ${
                      errors.timeLimit
                        ? "border-red-500"
                        : "border-gray-200 dark:border-[#35353E]"
                    } rounded-[20px] px-4 py-3 text-gray-900 dark:text-white text-base focus:outline-none`}
                    value={timeLimit}
                    onChange={(e) => {
                      setTimeLimit(Number(e.target.value));
                      setErrors((prev) => ({ ...prev, timeLimit: undefined }));
                    }}
                  >
                    {timeLimits.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.timeLimit && (
                    <span className="text-red-500 text-sm mt-1">
                      {errors.timeLimit}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            borderRadius={24}
            className="w-fit bg-[#1D8751] h-10 text-white hover:bg-[#1D8751]/90"
            onClick={() => setShowPaymentModal(true)}
          >
            Add Payment Method
          </Button>
        </Card>
        <PaymentMethodsModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onAdd={() => {
            setShowPaymentModal(false);
          }}
        />
        {/* Terms & Auto Reply */}
        <div className="text-2xl text-gray-600 dark:text-[#788099] mb-2 mt-6">
          Terms & Auto Reply
        </div>
        <Card className="w-full mb-4 px-2 py-2 sm:px-4 sm:py-4 bg-gray-50 dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] rounded-[24px]">
          <div>
            <label className="text-lg text-gray-600 dark:text-[#788099] mb-2 block">
              Terms (Optional)
            </label>
            <textarea
              className={`w-full bg-white dark:bg-[#18181D] border ${
                errors.terms
                  ? "border-red-500"
                  : "border-gray-200 dark:border-[#35353E]"
              } rounded-[24px] px-6 py-5 text-gray-600 dark:text-[#788099] min-h-[120px] mb-6 resize-none`}
              placeholder="Enter terms..."
              value={terms}
              onChange={(e) => {
                setTerms(e.target.value);
                setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
            />
            {errors.terms && (
              <span className="text-red-500 text-sm mt-1">{errors.terms}</span>
            )}
          </div>
          <div>
            <label className="text-lg text-gray-600 dark:text-[#788099] mb-2 block">
              Auto Reply (Optional)
            </label>
            <textarea
              className={`w-full bg-white dark:bg-[#18181D] border ${
                errors.autoReply
                  ? "border-red-500"
                  : "border-gray-200 dark:border-[#35353E]"
              } rounded-[24px] px-6 py-5 text-gray-600 dark:text-[#788099] min-h-[120px] mb-6 resize-none`}
              placeholder="Enter auto-reply..."
              value={autoReply}
              onChange={(e) => {
                setAutoReply(e.target.value);
                setErrors((prev) => ({ ...prev, autoReply: undefined }));
              }}
            />
            {errors.autoReply && (
              <span className="text-red-500 text-sm mt-1">
                {errors.autoReply}
              </span>
            )}
          </div>
          <div className="flex gap-6 mt-6">
            <Button
              borderRadius={24}
              className="flex-1 rounded-[24px] border-1 border-[#1D8751] text-white bg-transparent text-base py-2 hover:bg-[#23232B] transition"
              variant="outline"
              onClick={() => {
                setAmount("");
                setOrderMin("");
                setOrderMax("");
                setCommission(0.1);
                setPaymentMethod(paymentMethods[0].value);
                setProvider(providers[0].value);
                setTimeLimit(timeLimits[0].value);
                setTerms("");
                setAutoReply("");
                setErrors({});
              }}
            >
              Cancel Post
            </Button>
            <Button
              borderRadius={24}
              className={`flex-1 rounded-[24px] border-1 text-white text-base py-2 ${
                type === "buy"
                  ? "bg-[#1D8751] border-[#1D8751]"
                  : "bg-[#E23D3A] border-[#E23D3A]"
              }`}
              onClick={handleSubmit}
              disabled={postOrderLoading}
            >
              {postOrderLoading ? <Loader size="sm" /> : "Post Ad"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Adds;
