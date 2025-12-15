// src/features/p2p/components/ui/p2pdashboard/sections/Adds.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
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
import { usePendingTotal } from "@/utils/pending";

import { logger } from '@/lib/utils/logger';
import { MdCheckCircle } from "react-icons/md";

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

  // Get available balance from pending hook
  const { availableBalance } = usePendingTotal();

  const searchParams = useSearchParams();
  const queryType = searchParams ? (searchParams.get("type") as "buy" | "sell" | null) : null;


  const [type, setType] = useState<"buy" | "sell">(queryType || filterType);
  const [asset] = useState("Tether USDT TRC20");
  const [commission, setCommission] = useState("1.00");
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
  const prevTypeRef = useRef<"buy" | "sell">(type);

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
      logger.debug('p2p', "Selected Payment Details:", selectedPaymentDetails);
    }
  }, [selectedPaymentDetails]);

  useEffect(() => {
    if (error) {
      showToast.error(error);
    }
  }, [error]);

  const [openSuccess, setOpenSuccess] = useState(false);
  useEffect(() => {
    if (postOrderError) {
      showToast.error(postOrderError);
    }
    if (postOrderSuccess) {
      setOpenSuccess(true);
    }
  }, [postOrderError, postOrderSuccess, router, dispatch]);

  useEffect(() => {
    if (queryType && queryType !== type) {
      setType(queryType);
    }
  }, [queryType]);

  // Clear form fields when switching between buy and sell
  useEffect(() => {
    // Only clear if type actually changed (not on initial mount)
    if (prevTypeRef.current !== type && prevTypeRef.current !== undefined) {
      setAmount("");
      setOrderMin("");
      setOrderMax("");
      setCommission("1.00");
      setPaymentMethod(paymentMethods[0].value);
      setProvider(providers[0].value);
      setTimeLimit(timeLimits[0].value);
      setTerms("");
      setAutoReply("");
      setSelectedPaymentDetails([]);
      setErrors({});
    }
    prevTypeRef.current = type;
  }, [type]);

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    const amountError = validateP2PAd.amount(amount);
    if (amountError) {
      newErrors.amount = amountError;
      isValid = false;
    }

    // Additional validation: check minimum 10 USDT for both buy and sell
    if (amount) {
      const amountNum = Number(amount);
      if (!isNaN(amountNum) && amountNum < 10) {
        newErrors.amount = "Minimum amount is 10 USDT ";
        isValid = false;
      }
    }

    // Additional validation for sell ads: check available balance
    if (type === "sell" && amount) {
      const amountNum = Number(amount);
      if (!isNaN(amountNum) && amountNum > availableBalance) {
        newErrors.amount = `Amount cannot exceed available balance (${availableBalance.toFixed(2)} USDT)`;
        isValid = false;
      }
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

    const commissionError = validateP2PAd.commission(parseFloat(commission) || 0);
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

  const handleClose = () => {
    setOpenSuccess(false);
    router.push("/dashboard/p2p/?tab=market");
    dispatch({ type: "p2pAds/clearPostOrderStatus" });
  };


  function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-[#111319] rounded-xl px-8 py-10 w-[90%] max-w-sm shadow-xl">
          <div className="flex flex-col items-center space-y-6">
            {/* Icon */}
            <MdCheckCircle className="text-secondary" size={70} />

            {/* Text */}
            <p className="text-white text-lg font-medium text-center">
              Successfully Published
            </p>

            {/* Button */}
            <button
              onClick={onClose}
              className="w-full bg-secondary text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition"
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <SuccessModal open={openSuccess} onClose={handleClose} />
      <div className="w-full p-0 sm:p-4 min-h-screen flex flex-col items-center justify-start bg-app">
        {loading && <Loader />}
        {/* Title and Buy/Sell Switch */}
        <div className="mb-1 w-full md:max-w-6xl md:mx-auto px-0 sm:px-0">
          <div className="text-gray-900 dark:text-white text-lg mb-1">
            Post Ad
          </div>
          <div
            className={`flex w-fit border-2 rounded-[8px] overflow-hidden ${type === "buy" ? "border-[#1D8751]" : "border-[#E23D3A]"
              }`}
          >
            <button
              className={`px-2 py-1.5 text-sm transition rounded-l-[6px] ${type === "buy"
                  ? "bg-[#1D8751] text-white"
                  : "bg-transparent text-[#051015] dark:text-white"
                }`}
              onClick={() => setType("buy")}
              type="button"
            >
              Buy
            </button>
            <button
              className={`px-4 py-1.5 text-sm transition rounded-r-[6px] ${type === "sell"
                  ? "bg-[#E23D3A] text-white"
                  : "bg-transparent text-[#051015] dark:text-white"
                }`}
              onClick={() => setType("sell")}
              type="button"
            >
              Sell
            </button>
          </div>
        </div>

        {/* Type & Price */}
        <div className="w-full md:max-w-6xl md:mx-auto px-0 sm:px-2 md:px-0">
          <div className="text-sm text-gray-600 dark:text-[#788099] mb-2 mt-3">
            Type & Price
          </div>
          <Card className="w-full mb-2 p-9 sm:px-2 sm:py-2 bg-card border border-gray-200 dark:border-[#35353E] rounded-[24px]">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end w-full">
              {/* Asset */}
              <div className="flex-1 flex flex-col">
                <span className="text-xs text-gray-600 dark:text-[#788099] mb-2">
                  Asset
                </span>
                <div
                  className="flex w-full items-center
               bg-card border border-gray-200 dark:border-[#35353E] rounded-[19px] px-2 py-2 min-h-[40px]"
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
                  Rate
                </span>
                <div
                  className={`flex w-full items-center justify-between bg-card border ${errors.commission
                      ? "border-red-500"
                      : "border-gray-200 dark:border-[#35353E]"
                    } rounded-[19px] min-h-[40px]`}
                >
                  <div className="flex items-center flex-1">
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
                    <input
                      type="text"
                      value={commission}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers and decimals
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setCommission(value);
                          setErrors((prev) => ({ ...prev, commission: undefined }));
                        }
                      }}
                      className="bg-transparent border-none text-gray-900 dark:text-white text-base focus:outline-none w-16"
                      placeholder="1.00"
                    />
                  </div>
                  <div className="flex items-center">
                    <button
                      className="text-[#1D8751] text-xl w-8 h-8 rounded-full hover:bg-[#1D8751]/10 flex items-center justify-center transition mr-2"
                      onClick={() => {
                        setCommission((c) => {
                          const current = parseFloat(c) || 0;
                          return Number((current + 0.1).toFixed(1)).toString();
                        });
                        setErrors((prev) => ({ ...prev, commission: undefined }));
                      }}
                    >
                      +
                    </button>
                    <button
                      className="text-[#1D8751] text-xl w-8 h-8 rounded-full hover:bg-[#1D8751]/10 flex items-center justify-center transition"
                      onClick={() => {
                        setCommission((c) => {
                          const current = parseFloat(c) || 0;
                          return Math.max(0, Number((current - 0.1).toFixed(1))).toString();
                        });
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
          <Card className="w-full mb-4 px-2 py-2 sm:px-2 sm:py-2 bg-card border border-gray-200 dark:border-[#35353E] rounded-[24px]">
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-2">
              {/* I want to Buy */}
              <div className="flex-1 flex flex-col">
                <label className="text-xs text-gray-600 dark:text-[#788099] mb-1 flex justify-between items-center">
                  <span>I want to {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  {type === "sell" && (
                    <span className="text-xs text-[#1D8751] dark:text-[#1D8751]">
                      Available: {availableBalance.toFixed(2)} USDT
                    </span>
                  )}
                </label>
                <div className="flex items-center bg-card border border-gray-200 dark:border-[#35353E] rounded-[19px] px-2 py-2 min-h-[40px]">
                  <img
                    src="https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                    alt="USDT"
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const newAmount = e.target.value;
                      setAmount(newAmount);

                      // Real-time validation
                      if (newAmount) {
                        const amountNum = Number(newAmount);

                        // Check if it's a valid number
                        if (isNaN(amountNum)) {
                          setErrors((prev) => ({
                            ...prev,
                            amount: "Amount must be a number"
                          }));
                        }
                        // Check minimum 10 USDT for both buy and sell
                        else if (amountNum < 10) {
                          setErrors((prev) => ({
                            ...prev,
                            amount: "Minimum amount is 10 USDT"
                          }));
                        }
                        // Additional check for sell ads - cannot exceed available balance
                        else if (type === "sell" && amountNum > availableBalance) {
                          setErrors((prev) => ({
                            ...prev,
                            amount: `Amount cannot exceed available balance (${availableBalance.toFixed(2)} USDT)`
                          }));
                        }
                        // Check if orderMin is greater than amount
                        else if (orderMin && !isNaN(Number(orderMin)) && Number(orderMin) > amountNum) {
                          setErrors((prev) => ({
                            ...prev,
                            amount: "Amount must be greater than or equal to minimum order amount"
                          }));
                        }
                        // Check if orderMax is greater than amount
                        else if (orderMax && !isNaN(Number(orderMax)) && Number(orderMax) > amountNum) {
                          setErrors((prev) => ({
                            ...prev,
                            amount: "Amount must be greater than or equal to maximum order amount"
                          }));
                        }
                        // Valid - clear error
                        else {
                          setErrors((prev) => ({ ...prev, amount: undefined }));
                          // Re-validate orderMin and orderMax if they exist
                          if (orderMin) {
                            const minNum = Number(orderMin);
                            if (!isNaN(minNum) && minNum > amountNum) {
                              setErrors((prev) => ({
                                ...prev,
                                orderMin: "Minimum order amount cannot be greater than amount"
                              }));
                            }
                          }
                          if (orderMax) {
                            const maxNum = Number(orderMax);
                            if (!isNaN(maxNum) && maxNum > amountNum) {
                              setErrors((prev) => ({
                                ...prev,
                                orderMax: "Maximum order amount cannot be greater than amount"
                              }));
                            }
                          }
                        }
                      } else {
                        setErrors((prev) => ({ ...prev, amount: undefined }));
                      }
                    }}
                    className={`w-full bg-transparent border-none text-gray-900 dark:text-white text-base focus:outline-none ${errors.amount
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
                <div className={`flex items-center bg-card border ${errors.orderMin
                    ? "border-red-500"
                    : "border-gray-200 dark:border-[#35353E]"
                  } rounded-[19px] px-2 py-2 min-h-[40px]`}>
                  <span className="text-[#1D8751] text-lg mr-1">$</span>
                  <input
                    type="text"
                    value={orderMin}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setOrderMin(newValue);

                      // Real-time validation
                      if (newValue) {
                        const valueNum = Number(newValue);

                        // Check if it's a valid number
                        if (isNaN(valueNum)) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMin: "Minimum order amount must be a number"
                          }));
                        }
                        // Check if it's less than 10
                        else if (valueNum < 10) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMin: "Minimum order amount must be at least 10"
                          }));
                        }
                        // Check if it's greater than amount (if amount is set)
                        else if (amount && !isNaN(Number(amount)) && valueNum > Number(amount)) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMin: "Minimum order amount cannot be greater than amount"
                          }));
                        }
                        // Check if it's greater than or equal to max order amount (if max is set)
                        else if (orderMax && !isNaN(Number(orderMax)) && valueNum >= Number(orderMax)) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMin: "Minimum order amount must be less than maximum order amount"
                          }));
                        }
                        // Valid - clear error
                        else {
                          setErrors((prev) => ({ ...prev, orderMin: undefined }));
                          // Also re-validate orderMax if it exists
                          if (orderMax && !isNaN(Number(orderMax))) {
                            const maxNum = Number(orderMax);
                            if (maxNum <= valueNum) {
                              setErrors((prev) => ({
                                ...prev,
                                orderMax: "Maximum order amount must be greater than minimum order amount"
                              }));
                            } else if (errors.orderMax && errors.orderMax.includes("greater than minimum")) {
                              setErrors((prev) => ({ ...prev, orderMax: undefined }));
                            }
                          }
                        }
                      } else {
                        // Empty - clear error
                        setErrors((prev) => ({ ...prev, orderMin: undefined }));
                      }
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
                <div className={`flex items-center bg-card border ${errors.orderMax
                    ? "border-red-500"
                    : "border-gray-200 dark:border-[#35353E]"
                  } rounded-[19px] px-2 py-2 min-h-[40px]`}>
                  <span className="text-[#1D8751] text-lg mr-1">$</span>
                  <input
                    type="text"
                    value={orderMax}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setOrderMax(newValue);

                      // Real-time validation
                      if (newValue) {
                        const valueNum = Number(newValue);

                        // Check if it's a valid number
                        if (isNaN(valueNum)) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMax: "Maximum order amount must be a number"
                          }));
                        }
                        // Check if it's 0 or less
                        else if (valueNum <= 0) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMax: "Maximum order amount must be greater than 0"
                          }));
                        }
                        // Check if it's less than 10
                        else if (valueNum < 10) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMax: "Maximum order amount must be at least 10"
                          }));
                        }
                        // Check if it's less than or equal to min order amount
                        else if (orderMin && !isNaN(Number(orderMin)) && valueNum <= Number(orderMin)) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMax: "Maximum order amount must be greater than minimum order amount"
                          }));
                        }
                        // Check if it's greater than amount (if amount is set)
                        else if (amount && !isNaN(Number(amount)) && valueNum > Number(amount)) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMax: "Maximum order amount cannot be greater than amount"
                          }));
                        }
                        // Check if it exceeds maximum
                        else if (valueNum > 1000000) {
                          setErrors((prev) => ({
                            ...prev,
                            orderMax: "Maximum order amount cannot exceed 1,000,000"
                          }));
                        }
                        // Valid - clear error
                        else {
                          setErrors((prev) => ({ ...prev, orderMax: undefined }));
                          // Re-validate orderMin if it exists
                          if (orderMin && !isNaN(Number(orderMin))) {
                            const minNum = Number(orderMin);
                            if (minNum >= valueNum) {
                              setErrors((prev) => ({
                                ...prev,
                                orderMin: "Minimum order amount must be less than maximum order amount"
                              }));
                            } else if (errors.orderMin && errors.orderMin.includes("less than maximum")) {
                              setErrors((prev) => ({ ...prev, orderMin: undefined }));
                            }
                          }
                        }
                      } else {
                        // Empty - clear error
                        setErrors((prev) => ({ ...prev, orderMax: undefined }));
                      }
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
              <div className="my-6 gap-10 flex flex-col lg:flex-row p-2">
                <div className="flex-1">
                  <UserPaymentSelector
                    userPaymentDetails={userPaymentDetails || []}
                    onSelect={handleSelectPaymentDetail}
                    onRemove={handleRemovePaymentDetail}
                    selectedDetails={selectedPaymentDetails}
                  />

                  {/* Display Selected Payment Methods */}
                  {selectedPaymentDetails.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-600 dark:text-[#788099] mb-2 block">
                        Selected Payment Methods ({selectedPaymentDetails.length})
                      </label>
                      <div className="space-y-3">
                        {selectedPaymentDetails.map((detail) => {
                          // Get logo URL with priority: logo_url > logo > provider_logo
                          const logoUrl = detail.logo_url || detail.logo || detail.provider_logo || "/default-provider-logo.svg";

                          return (
                            <div
                              key={detail.id}
                              className="flex items-center justify-between p-4 rounded-[16px] bg-[#1D8751]/10 dark:bg-[#1D8751]/20 border border-[#1D8751]/30"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                  <img
                                    src={logoUrl}
                                    alt={`${detail.payment_provider_name} logo`}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-card"
                                    onError={(e) => {
                                      e.currentTarget.src = "/default-provider-logo.svg";
                                    }}
                                  />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-xs font-semibold text-[#1D8751] dark:text-[#1D8751] uppercase bg-white dark:bg-card px-2 py-1 rounded">
                                      {detail.payment_method_name}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-[#788099]">
                                      •
                                    </span>
                                    <span className="text-xs text-gray-900 dark:text-white font-medium">
                                      {detail.payment_provider_name}
                                    </span>
                                  </div>

                                  {/* Account Name - Prominent Display */}
                                  <div className="mb-1">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {detail.account_name || 'N/A'}
                                    </span>
                                  </div>

                                  {/* Account Number */}
                                  <div>
                                    <span className="text-xs text-gray-500 dark:text-[#788099]">
                                      •••• {detail.account_number?.slice(-4) || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Remove Button */}
                              <button
                                className="ml-3 flex-shrink-0 p-2 text-[#E23D3A] hover:bg-[#E23D3A]/10 rounded-full transition"
                                onClick={() => handleRemovePaymentDetail(detail)}
                                title="Remove payment method"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#788099] mt-2">
                        💡 You can add multiple payment methods from different types (Bank, Mobile Money, etc.)
                      </p>
                    </div>
                  )}
                </div>

                {/* Time Limit */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  {/* Time Limit */}
                  <div className="flex-1 flex flex-col">
                    <label className="text-sm text-gray-600 dark:text-[#788099] mb-1">
                      Time Limit
                    </label>
                    <select
                      className={`bg-card border ${errors.timeLimit
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
              dispatch(fetchUserPaymentDetails() as any);
            }}
          />
          {/* Terms & Auto Reply */}
          <div className="text-2xl text-gray-600 dark:text-[#788099] mb-2 mt-6">
            Terms & Auto Reply
          </div>
          <Card className="w-full mb-4 px-2 py-2 sm:px-4 sm:py-4 bg-card border border-gray-200 dark:border-[#35353E] rounded-[24px]">
            <div>
              <label className="text-lg text-gray-600 dark:text-[#788099] mb-2 block">
                Terms (Optional)
              </label>
              <textarea
                className={`w-full bg-card border ${errors.terms
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
                className={`w-full bg-card border ${errors.autoReply
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
                className="flex-1 rounded-[24px] border-1 border-[#1D8751]
              dark:text-white text-black bg-transparent text-base py-2 hover:bg-[#23232B] transition"
                variant="outline"
                onClick={() => {
                  setAmount("");
                  setOrderMin("");
                  setOrderMax("");
                  setCommission("1.00");
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
                className={`flex-1 rounded-[24px] border-1 text-white text-base py-2 ${type === "buy"
                    ? "bg-[#1D8751] border-[#1D8751]"
                    : "bg-[#E23D3A] border-[#E23D3A]"
                  } ${postOrderLoading ||
                    Object.values(errors).some(error => error !== undefined) ||
                    !amount.trim() ||
                    !orderMin.trim() ||
                    !orderMax.trim() ||
                    selectedPaymentDetails.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
                onClick={handleSubmit}
                disabled={
                  postOrderLoading ||
                  Object.values(errors).some(error => error !== undefined) ||
                  !amount.trim() ||
                  !orderMin.trim() ||
                  !orderMax.trim() ||
                  selectedPaymentDetails.length === 0
                }
              >
                {postOrderLoading ? <Loader size="sm" /> : "Post Ad"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Adds;
