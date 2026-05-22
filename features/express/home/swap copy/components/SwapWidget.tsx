/**
 * SwapWidget.tsx – Refactored to use smaller components
 */
"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setFromAsset,
  setToAsset,
  setFromAmount,
  setToAmount,
  swapAssets,
  fetchSupportedAssets,
  fetchSwapEstimate,
  clearEstimate,
  clearEstimateError,
  createSwapTransaction,
  clearSwapResponse,
  resetErrorToastFlag,
} from "@/features/swap/slices/swapSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import SwapStatusComponent from "./SwapStatus";
import StepIndicator from "./StepIndicator";
import TransactionInfoStep from "./TransactionInfoStep";
import WalletAddressStep from "./WalletAddressStep";
import CopyAddressStep from "./CopyAddressStep";
import { SwapStep } from "./types";
import { SupportedAsset, SwapEstimate } from "../types";
import SuccessPage from "@/features/express/components/success";
import { SwapWidgetSkeleton } from "@/components/ui/Skeletons";
import { useChangeNowAssets } from "../../hooks/useChangeNowAssets";
import { useRouter } from "next/navigation";
import InfoModal from "@/features/express/components/forms/info";
import { logger } from "@/lib/utils/logger";
import { useScrollAppToTopWhen } from "@/hooks/useScrollAppToTopWhen";
import {
  buildSwapRedirectPath,
  setAuthRedirectPath,
} from "@/lib/utils/authRedirect";
import { openKYCModal, checkKYCStatus } from "@/features/auth/slices/authSlice";
import {
  normalizeSwapAmountOnChange,
  swapAmountToInputString,
  isBadPersistedSwapSendAmount,
} from "@/lib/utils/swapAmountInput";

interface SwapWidgetProps {
  usePublicApi?: boolean;
}

const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";
const SWAP_LEGAL_RETURN_STATE_KEY = "omaya_swap_legal_return_state";

const SwapWidget: React.FC<SwapWidgetProps> = ({ usePublicApi = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);
  const {
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    supportedAssets,
    loading,
    error,
    estimate,
    estimateLoading,
    estimateError,
    swapResponse,
    swapLoading,
    swapError,
  } = useSelector((state: RootState) => state.swap);

  const [walletAddress, setWalletAddress] = React.useState("");
  const [isFromAssetOpen, setIsFromAssetOpen] = React.useState(false);
  const [isToAssetOpen, setIsToAssetOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [toSearchTerm, setToSearchTerm] = React.useState("");
  const [showStatus, setShowStatus] = React.useState(false);
  const [walletValidationError, setWalletValidationError] = React.useState("");
  const [copyMessage, setCopyMessage] = React.useState("");
  const [localSwapError, setLocalSwapError] = React.useState("");
  const [activeInputField, setActiveInputField] = React.useState<"from" | "to">(
    "from"
  );
  const [lastSuccessfulEstimate, setLastSuccessfulEstimate] =
    React.useState<SwapEstimate | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);

  // New state for the flow
  const [currentStep, setCurrentStep] =
    React.useState<SwapStep>("transaction-info");
  const [showWalletAddress, setShowWalletAddress] = React.useState(false);
  useScrollAppToTopWhen(currentStep !== "transaction-info");
  useScrollAppToTopWhen(showWalletAddress);
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);
  const otcThresholdExceededRef = React.useRef(false);

  // When coming back from Terms in swap flow, reopen wallet step instead of initial page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const returning = sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY);
      const hasSwapLegalState = sessionStorage.getItem(SWAP_LEGAL_RETURN_STATE_KEY);
      if (returning && hasSwapLegalState) {
        setShowWalletAddress(true);
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  // Simple debounce implementation
  const [debouncedFromAmount, setDebouncedFromAmount] =
    React.useState(fromAmount);
  const [debouncedToAmount, setDebouncedToAmount] = React.useState(toAmount);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { assets: homeSwapAssets, loading: homeAssetsLoading } =
    useChangeNowAssets(true, { feature: "swap", source: "public" });
  const combinedAssets =
    homeSwapAssets && homeSwapAssets.length > 0
      ? homeSwapAssets
      : supportedAssets;
  const assetsLoadingState =
    homeSwapAssets && homeSwapAssets.length > 0 ? homeAssetsLoading : loading;

  // Auto-select first and second assets when combinedAssets loads (always)
  useEffect(() => {
    if (combinedAssets.length >= 2) {
      const first = combinedAssets[0];
      const second = combinedAssets[1];
      if (!fromAsset || !toAsset) {
        if (!fromAsset) {
          dispatch(setFromAsset(first));
        }
        if (!toAsset) {
          dispatch(setToAsset(second));
        }
      }
    }
  }, [combinedAssets, fromAsset, toAsset, dispatch]);

  // Close asset dropdowns when the user scrolls the page,
  // but NOT when scrolling inside the dropdown lists themselves
  useEffect(() => {
    const handleWindowScroll = (event: Event) => {
      const target = event.target;
      const elementTarget =
        target instanceof Element ? target : null;
      const isPageScrollTarget =
        target === document ||
        target === document.documentElement ||
        target === document.body;

      // If the scroll originated from inside an asset dropdown, ignore it
      if (
        elementTarget &&
        elementTarget.closest("[data-asset-dropdown='true']")
      ) {
        return;
      }
      // Only close on whole-page scroll.
      if (!isPageScrollTarget) {
        return;
      }

      setIsFromAssetOpen(false);
      setIsToAssetOpen(false);
    };

    window.addEventListener("scroll", handleWindowScroll, true);
    document.addEventListener("scroll", handleWindowScroll, true);

    return () => {
      window.removeEventListener("scroll", handleWindowScroll, true);
      document.removeEventListener("scroll", handleWindowScroll, true);
    };
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFromAmount(fromAmount);
    }, 500);

    return () => clearTimeout(timer);
  }, [fromAmount]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedToAmount(toAmount);
    }, 500);

    return () => clearTimeout(timer);
  }, [toAmount]);

  useEffect(() => {
    const fromValue = parseFloat(fromAmount) || 0;
    const toValue = parseFloat(toAmount) || 0;
    const exceeded = fromValue > 15000 || toValue > 15000;
    if (exceeded && !otcThresholdExceededRef.current) {
      setIsInfoModalOpen(true);
    }
    otcThresholdExceededRef.current = exceeded;
  }, [fromAmount, toAmount]);

  // Clear stale estimate errors when user clears the active field or enters 0 (avoids race with in-flight requests)
  useEffect(() => {
    if (estimateError == null || estimateError === "") return;
    if (typeof estimateError !== "string") return;
    if (activeInputField === "from") {
      const n = parseFloat(fromAmount);
      if (fromAmount === "" || Number.isNaN(n) || n <= 0) {
        dispatch(clearEstimateError());
      }
    } else {
      const n = parseFloat(toAmount);
      if (toAmount === "" || Number.isNaN(n) || n <= 0) {
        dispatch(clearEstimateError());
      }
    }
  }, [fromAmount, toAmount, activeInputField, estimateError, dispatch]);

  // Reload / rehydrate can leave "0.0" or 0 in You Send — reset until user touches the form
  useEffect(() => {
    if (hasUserInteracted) return;
    if (!isBadPersistedSwapSendAmount(fromAmount)) return;
    dispatch(setFromAmount("0.01"));
    dispatch(setToAmount("0"));
    dispatch(clearEstimate());
  }, [fromAmount, hasUserInteracted, dispatch]);

  useEffect(() => {
    dispatch(resetErrorToastFlag());
    // ✅ Data fetching moved to SwapDataProvider (parent component)
    // This eliminates duplicate API calls and improves performance
    // dispatch(fetchSupportedAssets(false)).catch((error) => {
    //   logger.error('swap', "Failed to fetch supported assets:", error);
    //   handleApiError(error);
    // });
  }, [dispatch]);

  // Fetch swap estimate when assets or amount changes (runs on load for default amount — no need to wait for user tap)
  useEffect(() => {
    if (!isAuthenticated && !usePublicApi) {
      return;
    }

    if (
      fromAsset &&
      toAsset &&
      ((activeInputField === "from" &&
        debouncedFromAmount &&
        parseFloat(debouncedFromAmount) > 0) ||
        (activeInputField === "to" &&
          debouncedToAmount &&
          parseFloat(debouncedToAmount) > 0))
    ) {
      dispatch(resetErrorToastFlag());
      const amount =
        activeInputField === "from"
          ? parseFloat(debouncedFromAmount)
          : parseFloat(debouncedToAmount);

      // For reverse calculation (when user types in "to" field), swap the currencies
      const estimateParams =
        activeInputField === "to"
          ? {
              fromCurrency: toAsset.ticker,
              fromNetwork: toAsset.network,
              toCurrency: fromAsset.ticker,
              toNetwork: fromAsset.network,
              amount: amount,
            }
          : {
              fromCurrency: fromAsset.ticker,
              fromNetwork: fromAsset.network,
              toCurrency: toAsset.ticker,
              toNetwork: toAsset.network,
              amount: amount,
            };

      dispatch(
        fetchSwapEstimate({
          ...estimateParams,
          usePublicApi: !!usePublicApi,
        })
      ).catch((error) => {
        logger.error("swap", "Failed to fetch swap estimate:", error);
        logger.debug("swap", "Estimate params:", estimateParams);
        logger.debug("swap", "Active input field:", activeInputField);
        // Don't show error toast for reverse calculation failures
        // as they might be expected (unsupported pairs, etc.)
        if (activeInputField === "from") {
          logger.error("swap", "Swap estimate request failed:", error);
        } else {
          console.warn(
            "Reverse calculation failed, this might be expected:",
            error
          );
        }
      });
    } else {
      // Clear estimate if conditions are not met
      dispatch(clearEstimate());
    }
  }, [
    dispatch,
    fromAsset,
    toAsset,
    debouncedFromAmount,
    debouncedToAmount,
    activeInputField,
    isAuthenticated,
    usePublicApi,
  ]);

  // Update amounts when estimate is received
  useEffect(() => {
    if (
      estimate &&
      !estimateLoading &&
      (estimate.toAmount !== undefined ||
        estimate.estimated_amount !== undefined) &&
      (estimate.fromAmount !== undefined || estimate.user_amount !== undefined)
    ) {
      // Store successful estimate for potential fallback calculations
      setLastSuccessfulEstimate(estimate);

      if (activeInputField === "from") {
        // Don't apply stale fulfilled estimates while You Send is empty / zero (user typing "0")
        const p = parseFloat(fromAmount);
        if (fromAmount === "" || Number.isNaN(p) || p <= 0) {
          return;
        }
        // User typed in "from" field, update "to" amount (normal flow)
        // Use toAmount from raw_response if available, otherwise fall back to estimated_amount
        const toAmount =
          estimate.raw_response?.toAmount ||
          estimate.toAmount ||
          estimate.estimated_amount;
        if (toAmount !== undefined) {
          dispatch(setToAmount(swapAmountToInputString(toAmount)));
        }
      } else if (activeInputField === "to") {
        const p = parseFloat(toAmount);
        if (toAmount === "" || Number.isNaN(p) || p <= 0) {
          return;
        }
        // User typed in "to" field, update "from" amount (reverse flow)
        // Since we swapped the currencies in the API call, the estimate.toAmount
        // now represents what the user should send (because we swapped from/to in the API call)
        const fromAmt =
          estimate.raw_response?.toAmount ||
          estimate.toAmount ||
          estimate.estimated_amount;
        if (fromAmt !== undefined) {
          dispatch(setFromAmount(swapAmountToInputString(fromAmt)));
        }
      }
    }
  }, [estimate, estimateLoading, dispatch, activeInputField, fromAmount, toAmount]);

  // Handle estimate errors (align with main SwapWidget — never pass objects to toast)
  useEffect(() => {
    if (estimateError == null) return;

    if (typeof estimateError === "object") {
      dispatch(clearEstimateError());
      return;
    }

    if (typeof estimateError !== "string" || !estimateError.trim()) {
      dispatch(clearEstimateError());
      return;
    }

    const errMsg = estimateError.trim();
    const isValidationError =
      /deposit_too_small|deposit_too_large|too small|too large|min amount|max amount/i.test(
        errMsg
      );

    if (!isValidationError) {
      console.error("Swap estimate error:", errMsg);
    }
    logger.debug(
      "swap",
      "Active input field during error:",
      activeInputField
    );

    if (activeInputField !== "from" && !isValidationError) {
      console.warn(
        "Reverse calculation error (might be expected):",
        errMsg
      );

      if (lastSuccessfulEstimate && debouncedToAmount) {
        try {
          const toAmount =
            lastSuccessfulEstimate.raw_response?.toAmount ||
            lastSuccessfulEstimate.toAmount ||
            lastSuccessfulEstimate.estimated_amount;
          const fromAmount =
            lastSuccessfulEstimate.raw_response?.fromAmount ||
            lastSuccessfulEstimate.fromAmount ||
            lastSuccessfulEstimate.user_amount;

          if (
            toAmount !== undefined &&
            fromAmount !== undefined &&
            toAmount > 0 &&
            fromAmount > 0
          ) {
            const rate = toAmount / fromAmount;
            const calculatedFromAmount = parseFloat(debouncedToAmount) / rate;
            dispatch(
              setFromAmount(swapAmountToInputString(calculatedFromAmount))
            );
            logger.debug("swap", "Fallback calculation successful:", {
              rate,
              calculatedFromAmount,
              toAmount,
              fromAmount,
            });
          } else {
            console.warn("Fallback calculation skipped: invalid amounts", {
              toAmount,
              fromAmount,
            });
          }
        } catch (fallbackError) {
          console.error("Fallback calculation failed:", fallbackError);
        }
      }
    }
  }, [
    estimateError,
    activeInputField,
    lastSuccessfulEstimate,
    debouncedToAmount,
    dispatch,
  ]);

  // Handle swap errors
  useEffect(() => {
    if (!swapError) return;
    const desc =
      typeof swapError === "string"
        ? swapError
        : (swapError as { message?: string })?.message != null
          ? String((swapError as { message?: string }).message)
          : "Swap failed";
    console.error("Swap error:", desc);
    setLocalSwapError(desc);
  }, [swapError]);

  // Handle next step validation - first button
  const handleNextStep = async () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    setLocalSwapError("");
    if (!fromAsset || !toAsset || !fromAmount || parseFloat(fromAmount) <= 0) {
      setLocalSwapError("Please select assets and enter a valid amount.");
      return;
    }

    if (!estimate) {
      setLocalSwapError("Please wait for the swap estimate to load.");
      return;
    }

    if ((parseFloat(fromAmount) || 0) > 15000 || (parseFloat(toAmount) || 0) > 15000) {
      setIsInfoModalOpen(true);
      return;
    }

    // Block unverified users at the first button and open KYC modal.
    if (isAuthenticated && user) {
      try {
        const kycResult = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = kycResult as any;
        if (kycStatus && kycStatus.is_verified === false) {
          dispatch(openKYCModal());
          return;
        }
      } catch (error) {
        if (user.is_verified === false) {
          dispatch(openKYCModal());
          return;
        }
      }
    }

    // Show wallet address form below
    setShowWalletAddress(true);
  };

  const handleWalletAddressNext = () => {
    if (!isAuthenticated) {
      // Save current swap state before redirecting
      const swapState = {
        fromAsset: fromAsset ? {
          ticker: fromAsset.ticker,
          symbol: fromAsset.symbol,
          name: fromAsset.name,
          network: fromAsset.network,
        } : null,
        toAsset: toAsset ? {
          ticker: toAsset.ticker,
          symbol: toAsset.symbol,
          name: toAsset.name,
          network: toAsset.network,
        } : null,
        fromAmount: fromAmount,
        toAmount: toAmount,
        walletAddress: walletAddress,
      };
      setAuthRedirectPath(buildSwapRedirectPath(swapState));
      router.push("/auth/login");
      return;
    }

    // Skip wallet address validation - proceed directly to swap creation
    if (!walletAddress.trim()) {
      setWalletValidationError("Wallet address is required");
      return;
    }

    // Clear any previous validation errors
    setWalletValidationError("");

    // Create the swap without validation
    handleSubmit();
  };

  // Handle back step
  const handleBackStep = () => {
    if (currentStep === "wallet-address") {
      setCurrentStep("transaction-info");
    } else if (currentStep === "copy-address") {
      setCurrentStep("wallet-address");
    } else if (currentStep === "status") {
      setCurrentStep("copy-address");
    }
  };

  // Validate amount: max 12 digits before decimal point (keep consistent with dashboard swap)
  const validateAmount = (value: string): boolean => {
    if (value === "" || value === ".") return true;
    const parts = value.split(".");
    const integerPart = parts[0] || "";
    if (integerPart.length > 12) {
      setLocalSwapError("Maximum 12 digits allowed before the decimal point.");
      return false;
    }
    return true;
  };

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Only allow numbers and decimals
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      const value = raw === "" ? "" : normalizeSwapAmountOnChange(raw);
      if (!validateAmount(value)) return;
      setActiveInputField("from");
      setHasUserInteracted(true);
      if (value === "") {
        dispatch(setFromAmount(""));
        dispatch(setToAmount(""));
        dispatch(clearEstimate());
        dispatch(clearEstimateError());
        setLocalSwapError("");
        return;
      }
      dispatch(setFromAmount(value));
    }
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Only allow numbers and decimals
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      const value = raw === "" ? "" : normalizeSwapAmountOnChange(raw);
      if (!validateAmount(value)) return;
      setActiveInputField("to");
      setHasUserInteracted(true);
      if (value === "") {
        dispatch(setFromAmount(""));
        dispatch(setToAmount(""));
        dispatch(clearEstimate());
        dispatch(clearEstimateError());
        setLocalSwapError("");
        return;
      }
      dispatch(setToAmount(value));
    }
  };

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWalletAddress(e.target.value);
    setWalletValidationError(""); // Clear error when user types
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      // Save current swap state before redirecting
      const swapState = {
        fromAsset: fromAsset ? {
          ticker: fromAsset.ticker,
          symbol: fromAsset.symbol,
          name: fromAsset.name,
          network: fromAsset.network,
        } : null,
        toAsset: toAsset ? {
          ticker: toAsset.ticker,
          symbol: toAsset.symbol,
          name: toAsset.name,
          network: toAsset.network,
        } : null,
        fromAmount: fromAmount,
        toAmount: toAmount,
        walletAddress: walletAddress,
      };
      setAuthRedirectPath(buildSwapRedirectPath(swapState));
      router.push("/auth/login");
      return;
    }

    // Check if user is verified (KYC check) - verify with API
    if (isAuthenticated && user) {
      // Check KYC status from API to get the latest status
      try {
        const kycResult = await dispatch(checkKYCStatus()).unwrap();
        const kycStatus = kycResult as any;
        
        // Only open modal if API confirms user is NOT verified
        if (kycStatus && kycStatus.is_verified === false) {
          dispatch(openKYCModal());
          return;
        }
        // If verified (is_verified === true), continue with the flow
      } catch (error) {
        // If API check fails, fallback to user.is_verified
        // But only open modal if explicitly false (not undefined/null)
        if (user.is_verified === false) {
          dispatch(openKYCModal());
          return;
        }
        // If verification status is unknown, allow the action to proceed
        console.warn("KYC status check failed, proceeding with caution:", error);
      }
    }

    logger.debug("swap", "handleSubmit called");
    if (!fromAsset || !toAsset || !walletAddress || !estimate) {
      console.error("Missing required fields");
      setLocalSwapError("Please fill in all required information.");
      return;
    }

    logger.debug("swap", "All fields present, creating swap...");

    try {
      setLocalSwapError("");
      dispatch(resetErrorToastFlag());
      await dispatch(
        createSwapTransaction({
          from_currency: fromAsset.ticker,
          from_network: fromAsset.network,
          to_currency: toAsset.ticker,
          to_network: toAsset.network,
          amount: fromAmount,
          address: walletAddress,
        })
      ).unwrap();
      logger.debug("swap", "Swap created successfully");
      setLocalSwapError("");
      setCurrentStep("copy-address");
    } catch (error: any) {
      console.error("Failed to create swap:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Could not create swap. Please try again.";
      setLocalSwapError(
        typeof msg === "string" ? msg : "Could not create swap. Please try again."
      );
    }
  };

  const handleCopyAddress = async () => {
    try {
      const addr = swapResponse ? (swapResponse as any).payin_address || swapResponse.payinAddress : "";
      await navigator.clipboard.writeText(addr || "");
      // Show success feedback
      setCopyMessage("Copied!");
      setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyMessage("Failed — copy manually");
      setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    }
  };

  const handleCopyAddressStepNext = () => {
    setCurrentStep("status");
  };

  const handleCopyAddressStepBack = () => {
    setCurrentStep("wallet-address");
  };

  const handleSwapAssets = () => {
    dispatch(swapAssets());
    // Clear the estimate when swapping assets
    dispatch(clearEstimate());
    setHasUserInteracted(true);

    // Trigger re-estimate after swap
    setTimeout(() => {
      if (
        fromAsset &&
        toAsset &&
        fromAmount &&
        parseFloat(fromAmount) > 0
      ) {
        dispatch(
          fetchSwapEstimate({
            fromCurrency: toAsset.ticker,
            fromNetwork: toAsset.network,
            toCurrency: fromAsset.ticker,
            toNetwork: fromAsset.network,
            amount: parseFloat(toAmount),
            usePublicApi: !!usePublicApi,
          })
        );
      }
    }, 0);
  };

  // Add timeout to prevent skeleton from getting stuck
  useEffect(() => {
    const assetsLength = combinedAssets.length;

    if (assetsLoadingState && assetsLength === 0) {
      const timeout = setTimeout(() => {
        setSkeletonTimeout(true);
      }, 2000); // Reduced to 2 seconds for faster UX

      return () => clearTimeout(timeout);
    } else {
      setSkeletonTimeout(false);
    }
  }, [
    assetsLoadingState,
    combinedAssets.length,
  ]);

  // Force timeout after 5 seconds regardless of loading state
  useEffect(() => {
    const forceTimeout = setTimeout(() => {
      setSkeletonTimeout(true);
    }, 5000);

    return () => clearTimeout(forceTimeout);
  }, []);

  // Show skeleton while loading initial data (supported assets)
  // But not if timeout has been reached OR if we have some assets
  if (assetsLoadingState && combinedAssets.length === 0 && !skeletonTimeout) {
    return <SwapWidgetSkeleton />;
  }

  // If timeout reached but still loading, show a fallback instead of skeleton
  if (assetsLoadingState && combinedAssets.length === 0 && skeletonTimeout) {
    return (
      <div className="w-full max-w-lg mx-auto p-6 bg-white dark:bg-[#1D1D23] rounded-lg border dark:border-[#35353E] border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751] mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading swap data...
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-[#1D8751] hover:bg-[#1a6b3f] text-white rounded-md text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto dark:text-white text-gray-900">
        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-4">
          <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2">
            Error Loading Swap
          </h3>
          <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 rounded-md text-white text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto dark:text-white text-gray-900 pt-0 mt-0 mb-0">
      {/* Step Indicator */}
      {/* <StepIndicator currentStep={currentStep} /> */}

      {/* Only render CopyAddressStep as a new page when currentStep is 'copy-address' */}
      {currentStep === "copy-address" ? (
        <CopyAddressStep
          swapResponse={swapResponse}
          copyMessage={copyMessage}
          onCopyAddress={handleCopyAddress}
          onBack={handleCopyAddressStepBack}
          onNext={handleCopyAddressStepNext}
        />
      ) : (
        <>
          <TransactionInfoStep
            fromAsset={fromAsset}
            toAsset={toAsset}
            fromAmount={fromAmount}
            toAmount={toAmount}
            supportedAssets={combinedAssets}
            estimate={estimate}
            estimateLoading={estimateLoading}
            estimateError={estimateError}
            localSwapError={localSwapError}
            isFromAssetOpen={isFromAssetOpen}
            isToAssetOpen={isToAssetOpen}
            searchTerm={searchTerm}
            toSearchTerm={toSearchTerm}
          onFromAssetSelect={(asset) => {
            setHasUserInteracted(true);
            dispatch(setFromAsset(asset));
          }}
          onToAssetSelect={(asset) => {
            setHasUserInteracted(true);
            dispatch(setToAsset(asset));
          }}
            onFromAmountChange={handleFromAmountChange}
            onToAmountChange={handleToAmountChange}
            onFromAssetToggle={() => setIsFromAssetOpen(!isFromAssetOpen)}
            onToAssetToggle={() => setIsToAssetOpen(!isToAssetOpen)}
            onSearchTermChange={setSearchTerm}
            onToSearchTermChange={setToSearchTerm}
            onSubmit={showWalletAddress ? () => {} : handleNextStep}
            swapLoading={swapLoading}
            hideContinueButton={showWalletAddress}
            onSwapAssets={handleSwapAssets}
            activeInputField={activeInputField}
          />
          {showWalletAddress && (
            <WalletAddressStep
              walletAddress={walletAddress}
              onWalletAddressChange={handleWalletAddressChange}
              onBack={() => setShowWalletAddress(false)}
              onNext={handleWalletAddressNext}
              fromAsset={fromAsset}
              toAsset={toAsset}
              // Pass loading state to disable button
              isLoading={swapLoading}
            />
          )}
        </>
      )}
      {/* <SwapStatusComponent transactionId={""} date={""} paidAmount={""} paidCurrency={""} receivedAmount={""} receivedCurrency={""}        */}
      {/* /> */}
      {/* <SuccessPage /> */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onContactUs={() => {
          setIsInfoModalOpen(false);
          router.push("/contactUs");
        }}
      />
    </div>
  );
};

export default SwapWidget;
