/**
 * SwapWidget.tsx – Refactored to use smaller components
 */
"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
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
  setSwapResponse,
} from "../slices/swapSlice";
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
import InfoModal from "@/features/express/components/forms/info";

import { logger } from "@/lib/utils/logger";
import { useScrollAppToTopWhen } from "@/hooks/useScrollAppToTopWhen";
import { scrollAppToTop } from "@/lib/utils/scrollAppToTop";
import {
  normalizeSwapAmountOnChange,
  isPositiveSwapAmount,
  parseSwapAmountNumber,
  swapAmountToInputString,
} from "@/lib/utils/swapAmountInput";
import {
  isSameSwapAssetPair,
  resolveSwapCreateErrorMessage,
  SWAP_SAME_COIN_MESSAGE,
} from "@/lib/utils/swapAssetValidation";
import {
  setSwapLegalReturnState,
  peekSwapLegalReturnState,
  clearSwapLegalReturnState,
  finalizeSwapLegalReturnState,
  getSwapTransactionHandoff,
  clearSwapTransactionHandoff,
} from "@/lib/utils/authRedirect";

// Minimum swap value in USD/USDT - smaller amounts can disappear due to fees
const MIN_SWAP_USD = 1;

const findMatchingSwapAsset = (
  supportedAssets: SupportedAsset[],
  snapshot: Partial<SupportedAsset> | null | undefined
): SupportedAsset | undefined => {
  if (!snapshot || supportedAssets.length === 0) return undefined;

  return supportedAssets.find((asset: SupportedAsset) => {
    const snapshotTicker = (snapshot.ticker || "").toLowerCase().trim();
    const snapshotSymbol = (snapshot.symbol || "").toLowerCase().trim();
    const snapshotNetwork = (snapshot.network || "").toLowerCase().trim();

    const assetTicker = (asset.ticker || "").toLowerCase().trim();
    const assetSymbol = (asset.symbol || "").toLowerCase().trim();
    const assetNetwork = (asset.network || "").toLowerCase().trim();

    if (snapshotTicker && assetTicker && snapshotNetwork && assetNetwork) {
      if (snapshotTicker === assetTicker && snapshotNetwork === assetNetwork) {
        return true;
      }
    }

    if (snapshotSymbol && assetSymbol && snapshotNetwork && assetNetwork) {
      if (snapshotSymbol === assetSymbol && snapshotNetwork === assetNetwork) {
        return true;
      }
    }

    if (snapshotTicker && assetTicker && !snapshotNetwork) {
      if (snapshotTicker === assetTicker) {
        return true;
      }
    }

    return false;
  });
};

const meetsMinimumSwap = (
  fromAsset: SupportedAsset | null,
  toAsset: SupportedAsset | null,
  fromAmount: string,
  toAmount: string
): boolean => {
  if (!fromAsset || !toAsset) return false;
  const fromTicker = (fromAsset.ticker || "").toUpperCase();
  const toTicker = (toAsset.ticker || "").toUpperCase();
  const fromVal = parseSwapAmountNumber(fromAmount) || 0;
  const toVal = parseSwapAmountNumber(toAmount) || 0;

  if (fromTicker === "USDT" || fromTicker === "USD") {
    if (fromVal < MIN_SWAP_USD) return false;
  }
  if (toTicker === "USDT" || toTicker === "USD") {
    if (toVal < MIN_SWAP_USD) return false;
  }
  return true;
};

const SwapWidget = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // New state for the flow
  const [currentStep, setCurrentStep] =
    React.useState<SwapStep>("transaction-info");
  const [showWalletAddress, setShowWalletAddress] = React.useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = React.useState(false);
  const [legalReturnState, setLegalReturnState] =
    React.useState<Record<string, any> | null>(null);
  const hasStartedLegalRestore = React.useRef(false);
  const hasAppliedLegalReturn = React.useRef(false);
  const hasResumedSwapHandoff = React.useRef(false);
  useScrollAppToTopWhen(currentStep !== "transaction-info");
  useScrollAppToTopWhen(showWalletAddress);
  const [hasRestoredState, setHasRestoredState] = React.useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);
  const otcThresholdExceededRef = React.useRef(false);

  // Simple debounce implementation
  const [debouncedFromAmount, setDebouncedFromAmount] =
    React.useState(fromAmount);
  const [debouncedToAmount, setDebouncedToAmount] = React.useState(toAmount);

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
    const fromValue = parseSwapAmountNumber(fromAmount) || 0;
    const toValue = parseSwapAmountNumber(toAmount) || 0;
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
      if (!isPositiveSwapAmount(fromAmount)) {
        dispatch(clearEstimateError());
      }
    } else {
      if (!isPositiveSwapAmount(toAmount)) {
        dispatch(clearEstimateError());
      }
    }
  }, [fromAmount, toAmount, activeInputField, estimateError, dispatch]);

  useEffect(() => {
    dispatch(resetErrorToastFlag());
    // ✅ Data fetching moved to SwapDataProvider (parent component)
    // This eliminates duplicate API calls and improves performance
    // dispatch(fetchSupportedAssets(false)).catch((error) => {
    //   logger.error('swap', "Failed to fetch supported assets:", error);
    //   handleApiError(error);
    // });
  }, [dispatch]);

  React.useEffect(() => {
    if (hasStartedLegalRestore.current) return;
    hasStartedLegalRestore.current = true;
    const saved = peekSwapLegalReturnState();
    if (!saved) return;
    setLegalReturnState(saved);
    clearSwapLegalReturnState();
    window.setTimeout(() => finalizeSwapLegalReturnState(), 1000);
  }, []);

  const handleBeforeLegalNavigate = useCallback(() => {
    setSwapLegalReturnState({
      showWalletAddress,
      walletAddress,
      hasAcceptedTerms,
      expandedTerms: true,
      fromAmount,
      toAmount,
      fromAsset,
      toAsset,
      activeInputField,
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
    });
  }, [
    showWalletAddress,
    walletAddress,
    hasAcceptedTerms,
    fromAmount,
    toAmount,
    fromAsset,
    toAsset,
    activeInputField,
  ]);

  // Restore swap form when returning from legal pages (Terms, Privacy, etc.)
  useEffect(() => {
    if (!legalReturnState || hasAppliedLegalReturn.current) return;

    if (legalReturnState.walletAddress) {
      setWalletAddress(legalReturnState.walletAddress);
    }
    if (legalReturnState.hasAcceptedTerms) {
      setHasAcceptedTerms(Boolean(legalReturnState.hasAcceptedTerms));
    }
    if (legalReturnState.showWalletAddress) {
      setShowWalletAddress(true);
    }
    if (
      legalReturnState.activeInputField === "from" ||
      legalReturnState.activeInputField === "to"
    ) {
      setActiveInputField(legalReturnState.activeInputField);
    }
    if (legalReturnState.fromAmount) {
      dispatch(setFromAmount(legalReturnState.fromAmount));
    }
    if (legalReturnState.toAmount) {
      dispatch(setToAmount(legalReturnState.toAmount));
    }

    if (!supportedAssets || supportedAssets.length === 0 || loading) {
      return;
    }

    const matchingFromAsset = findMatchingSwapAsset(
      supportedAssets,
      legalReturnState.fromAsset
    );
    if (matchingFromAsset) {
      dispatch(setFromAsset(matchingFromAsset));
    }

    const matchingToAsset = findMatchingSwapAsset(
      supportedAssets,
      legalReturnState.toAsset
    );
    if (matchingToAsset) {
      dispatch(setToAsset(matchingToAsset));
    }

    hasAppliedLegalReturn.current = true;

    const savedScrollY = legalReturnState.scrollY;
    if (typeof savedScrollY === "number" && !Number.isNaN(savedScrollY)) {
      window.setTimeout(() => {
        window.scrollTo({ top: Math.max(0, savedScrollY), behavior: "auto" });
      }, 0);
    }
  }, [legalReturnState, supportedAssets, loading, dispatch]);

  // Home swap handoff: open copy-address / exchanging step on dashboard
  React.useEffect(() => {
    if (!searchParams || searchParams.get("resumeStatus") !== "1") return;
    if (hasResumedSwapHandoff.current) return;
    hasResumedSwapHandoff.current = true;

    const handoff = getSwapTransactionHandoff();
    if (handoff?.swapResponse) {
      dispatch(setSwapResponse(handoff.swapResponse as any));
    }
    if (typeof handoff?.walletAddress === "string") {
      setWalletAddress(handoff.walletAddress);
    }

    if (handoff?.swapResponse) {
      setCurrentStep("copy-address");
      scrollAppToTop();
    }

    router.replace("/dashboard/swap", { scroll: false });
  }, [searchParams, router, dispatch]);

  // Restore state from URL prefill parameter (after login redirect)
  useEffect(() => {
    if (hasRestoredState || !supportedAssets || supportedAssets.length === 0 || loading) {
      return;
    }

    const prefill = searchParams?.get("prefill");
    if (!prefill) {
      setHasRestoredState(true);
      return;
    }

    try {
      const initialState = JSON.parse(decodeURIComponent(prefill));
      
      // Restore wallet address
      if (initialState.walletAddress) {
        setWalletAddress(initialState.walletAddress);
      }

      // Restore amounts
      if (initialState.fromAmount) {
        dispatch(setFromAmount(initialState.fromAmount));
      }
      if (initialState.toAmount) {
        dispatch(setToAmount(initialState.toAmount));
      }

      // Restore fromAsset
      if (initialState.fromAsset && supportedAssets.length > 0) {
        const matchingFromAsset = supportedAssets.find((asset: SupportedAsset) => {
          const initialStateTicker = (initialState.fromAsset.ticker || "").toLowerCase().trim();
          const initialStateSymbol = (initialState.fromAsset.symbol || "").toLowerCase().trim();
          const initialStateNetwork = (initialState.fromAsset.network || "").toLowerCase().trim();
          
          const assetTicker = (asset.ticker || "").toLowerCase().trim();
          const assetSymbol = (asset.symbol || "").toLowerCase().trim();
          const assetNetwork = (asset.network || "").toLowerCase().trim();

          // Match by ticker + network (most specific)
          if (initialStateTicker && assetTicker && initialStateNetwork && assetNetwork) {
            if (initialStateTicker === assetTicker && initialStateNetwork === assetNetwork) {
              return true;
            }
          }

          // Match by symbol + network
          if (initialStateSymbol && assetSymbol && initialStateNetwork && assetNetwork) {
            if (initialStateSymbol === assetSymbol && initialStateNetwork === assetNetwork) {
              return true;
            }
          }

          // Fallback: ticker only (if no network specified)
          if (initialStateTicker && assetTicker && !initialStateNetwork) {
            if (initialStateTicker === assetTicker) {
              return true;
            }
          }

          return false;
        });

        if (matchingFromAsset) {
          dispatch(setFromAsset(matchingFromAsset));
        }
      }

      // Restore toAsset
      if (initialState.toAsset && supportedAssets.length > 0) {
        const matchingToAsset = supportedAssets.find((asset: SupportedAsset) => {
          const initialStateTicker = (initialState.toAsset.ticker || "").toLowerCase().trim();
          const initialStateSymbol = (initialState.toAsset.symbol || "").toLowerCase().trim();
          const initialStateNetwork = (initialState.toAsset.network || "").toLowerCase().trim();
          
          const assetTicker = (asset.ticker || "").toLowerCase().trim();
          const assetSymbol = (asset.symbol || "").toLowerCase().trim();
          const assetNetwork = (asset.network || "").toLowerCase().trim();

          // Match by ticker + network (most specific)
          if (initialStateTicker && assetTicker && initialStateNetwork && assetNetwork) {
            if (initialStateTicker === assetTicker && initialStateNetwork === assetNetwork) {
              return true;
            }
          }

          // Match by symbol + network
          if (initialStateSymbol && assetSymbol && initialStateNetwork && assetNetwork) {
            if (initialStateSymbol === assetSymbol && initialStateNetwork === assetNetwork) {
              return true;
            }
          }

          // Fallback: ticker only (if no network specified)
          if (initialStateTicker && assetTicker && !initialStateNetwork) {
            if (initialStateTicker === assetTicker) {
              return true;
            }
          }

          return false;
        });

        if (matchingToAsset) {
          dispatch(setToAsset(matchingToAsset));
        }
      }

      setHasRestoredState(true);

      // Set activeInputField to "from" to trigger estimate fetch
      if (initialState.fromAmount) {
        setActiveInputField("from");
      }

      // Auto-advance to wallet address step if wallet address is already provided
      if (initialState.walletAddress && initialState.fromAsset && initialState.toAsset && initialState.fromAmount) {
        // Small delay to ensure state is set
        setTimeout(() => {
          setShowWalletAddress(true);
        }, 500);
      }
    } catch (error) {
      console.warn("Failed to parse prefill state", error);
      setHasRestoredState(true);
    }
  }, [supportedAssets, loading, searchParams, dispatch, hasRestoredState]);

  // Auto-expand swap form when state is restored (show wallet address step)
  const [hasAutoExpanded, setHasAutoExpanded] = React.useState(false);
  
  useEffect(() => {
    // Only auto-expand if we have restored state from URL (prefill parameter exists)
    const prefill = searchParams?.get("prefill");
    if (!prefill || !hasRestoredState || hasAutoExpanded) {
      return;
    }

    // Wait for all required data to be available
    if (
      !fromAsset ||
      !toAsset ||
      !isPositiveSwapAmount(fromAmount) ||
      isSameSwapAssetPair(fromAsset, toAsset)
    ) {
      return;
    }

    // Wait for estimate to be available
    if (estimateLoading) {
      return;
    }

    if (!estimate) {
      return;
    }

    // Auto-expand: show wallet address step (same as clicking submit in TransactionInfoStep)
    const timer = setTimeout(() => {
      if (!hasAutoExpanded && fromAsset && toAsset && fromAmount && estimate) {
        console.log("🚀 AUTO-EXPANDING SWAP FORM:", { fromAsset: fromAsset.ticker, toAsset: toAsset.ticker, fromAmount });
        setShowWalletAddress(true);
        setHasAutoExpanded(true);
      }
    }, 3000); // Increased delay to ensure everything is ready

    return () => clearTimeout(timer);
  }, [
    hasRestoredState,
    fromAsset,
    toAsset,
    fromAmount,
    estimate,
    estimateLoading,
    searchParams,
    hasAutoExpanded,
  ]);

  const sameCoinPair = isSameSwapAssetPair(fromAsset, toAsset);

  useEffect(() => {
    if (sameCoinPair) {
      setLocalSwapError(SWAP_SAME_COIN_MESSAGE);
      dispatch(clearEstimate());
      dispatch(clearEstimateError());
      return;
    }
    setLocalSwapError((prev) =>
      prev === SWAP_SAME_COIN_MESSAGE ? "" : prev
    );
  }, [sameCoinPair, dispatch]);

  // Fetch swap estimate when assets or amount changes
  useEffect(() => {
    if (sameCoinPair) {
      dispatch(clearEstimate());
      return;
    }
    if (
      fromAsset &&
      toAsset &&
      ((activeInputField === "from" &&
        debouncedFromAmount &&
        isPositiveSwapAmount(debouncedFromAmount)) ||
        (activeInputField === "to" &&
          debouncedToAmount &&
          isPositiveSwapAmount(debouncedToAmount)))
    ) {
      dispatch(resetErrorToastFlag());
      const amount =
        activeInputField === "from"
          ? parseSwapAmountNumber(debouncedFromAmount)
          : parseSwapAmountNumber(debouncedToAmount);

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

      dispatch(fetchSwapEstimate(estimateParams)).catch((error) => {
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
    sameCoinPair,
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
        if (!isPositiveSwapAmount(fromAmount)) {
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
        if (!isPositiveSwapAmount(toAmount)) {
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

  // Handle estimate errors
  useEffect(() => {
    if (estimateError == null) return;

    // Stale/persisted state could hold an object ({}) — clear and skip noise
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
      /deposit_too_small|deposit_too_large|too small|too large|out of min amount|min amount|max amount/i.test(
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
            const calculatedFromAmount = parseSwapAmountNumber(debouncedToAmount) / rate;
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

  // Handle swap errors (inline only — no toasts)
  useEffect(() => {
    if (swapError) {
      console.error("Swap error:", swapError);
      setLocalSwapError(
        typeof swapError === "string" ? swapError : "Swap failed. Please try again."
      );
    }
  }, [swapError]);

  // Handle next step validation
  const handleNextStep = () => {
    setLocalSwapError("");
    if (!fromAsset || !toAsset || !isPositiveSwapAmount(fromAmount)) {
      setLocalSwapError("Please select assets and enter a valid amount.");
      return;
    }

    if (isSameSwapAssetPair(fromAsset, toAsset)) {
      setLocalSwapError(SWAP_SAME_COIN_MESSAGE);
      return;
    }

    if (!estimate) {
      setLocalSwapError("Please wait for the swap estimate to load.");
      return;
    }

    if (
      (parseSwapAmountNumber(fromAmount) || 0) > 15000 ||
      (parseSwapAmountNumber(toAmount) || 0) > 15000
    ) {
      setIsInfoModalOpen(true);
      return;
    }

    if (!meetsMinimumSwap(fromAsset, toAsset, fromAmount, toAmount)) {
      setLocalSwapError(
        `Minimum swap value is ${MIN_SWAP_USD} USD/USDT. Smaller amounts can disappear due to fees.`
      );
      return;
    }

    setShowWalletAddress(true);
  };

  const handleWalletAddressNext = () => {
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

  // Validate amount: max 12 digits before decimal point
  const validateAmount = (value: string): boolean => {
    if (value === "" || value === ".") return true;
    const parts = value.split(".");
    const integerPart = parts[0] || "";
    // Check if integer part has more than 12 digits
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
      // Validate max 12 digits before decimal
      if (!validateAmount(value)) return;
      setActiveInputField("from");
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
      // Validate max 12 digits before decimal
      if (!validateAmount(value)) return;
      setActiveInputField("to");
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
    logger.debug("swap", "handleSubmit called");
    if (!fromAsset || !toAsset || !walletAddress || !estimate) {
      console.error("Missing required fields");
      setLocalSwapError("Please fill in all required information.");
      return;
    }

    if (isSameSwapAssetPair(fromAsset, toAsset)) {
      setLocalSwapError(SWAP_SAME_COIN_MESSAGE);
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
      const sameCoinMsg = resolveSwapCreateErrorMessage(error);
      const msg =
        sameCoinMsg ||
        error?.response?.data?.message ||
        error?.message ||
        "Could not create swap. Please try again.";
      setLocalSwapError(
        typeof msg === "string" ? msg : "Could not create swap. Please try again."
      );
    }
  };

  const handleFromAssetSelect = (asset: SupportedAsset) => {
    if (toAsset && isSameSwapAssetPair(asset, toAsset)) {
      setLocalSwapError(SWAP_SAME_COIN_MESSAGE);
      return;
    }
    dispatch(setFromAsset(asset));
    dispatch(clearEstimate());
  };

  const handleToAssetSelect = (asset: SupportedAsset) => {
    if (fromAsset && isSameSwapAssetPair(fromAsset, asset)) {
      setLocalSwapError(SWAP_SAME_COIN_MESSAGE);
      return;
    }
    dispatch(setToAsset(asset));
    dispatch(clearEstimate());
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(swapResponse?.payinAddress || "");
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
    dispatch(clearEstimate());
    setLocalSwapError((prev) =>
      prev === SWAP_SAME_COIN_MESSAGE ? "" : prev
    );
  };

  const staleRefreshInFlightRef = React.useRef(false);

  // Detect stale loading state (e.g., persisted loading flag) and force refresh
  useEffect(() => {
    if (!loading || supportedAssets.length > 0) {
      staleRefreshInFlightRef.current = false;
      return;
    }
    if (staleRefreshInFlightRef.current) {
      return;
    }

    const staleLoadingTimer = setTimeout(() => {
      if (
        loading &&
        supportedAssets.length === 0 &&
        !staleRefreshInFlightRef.current
      ) {
        staleRefreshInFlightRef.current = true;
        logger.warn(
          "swap",
          "SwapWidget detected stale loading state. Forcing supported assets refresh."
        );
        dispatch(fetchSupportedAssets(true))
          .unwrap()
          .catch((error) => {
            logger.error(
              "swap",
              "Forced supported assets refresh failed in SwapWidget:",
              error
            );
          })
          .finally(() => {
            staleRefreshInFlightRef.current = false;
          });
      }
    }, 8000); // fallback after 8s

    return () => clearTimeout(staleLoadingTimer);
  }, [loading, supportedAssets.length, dispatch]);

  const handleSupportedAssetsRetry = useCallback(() => {
    dispatch(fetchSupportedAssets(true));
  }, [dispatch]);

  const isInitialAssetLoading = loading && supportedAssets.length === 0;

  return (
    <div className="flex flex-col dark:text-white text-gray-900 w-full max-w-5xl mx-auto px-4 sm:px-6">
      <h2 className="mb-4 sm:mb-6 flex items-center text-xl sm:text-2xl font-bold text-[#76777B] dark:text-white [.deem_&]:text-white uppercase">
        Swap Crypto
      </h2>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs sm:text-sm text-red-500 dark:text-red-300 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            onClick={handleSupportedAssetsRetry}
            className="px-3 py-1 border border-red-500/30 rounded-md text-xs"
          >
            Retry
          </button>
        </div>
      )}

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
            supportedAssets={supportedAssets}
            estimate={estimate}
            estimateLoading={estimateLoading}
            estimateError={estimateError}
            localSwapError={localSwapError}
            isFromAssetOpen={isFromAssetOpen}
            isToAssetOpen={isToAssetOpen}
            searchTerm={searchTerm}
            toSearchTerm={toSearchTerm}
            onFromAssetSelect={handleFromAssetSelect}
            onToAssetSelect={handleToAssetSelect}
            sameCoinPair={sameCoinPair}
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
            meetsMinimumAmount={meetsMinimumSwap(fromAsset, toAsset, fromAmount, toAmount)}
            minSwapUsd={MIN_SWAP_USD}
          />
          {showWalletAddress && (
            <WalletAddressStep
              walletAddress={walletAddress}
              onWalletAddressChange={handleWalletAddressChange}
              onBack={() => {}}
              onNext={handleWalletAddressNext}
              fromAsset={fromAsset}
              toAsset={toAsset}
              isLoading={swapLoading}
              hasAcceptedTerms={hasAcceptedTerms}
              onHasAcceptedTermsChange={setHasAcceptedTerms}
              onBeforeLegalNavigate={handleBeforeLegalNavigate}
              defaultExpandedTerms={Boolean(legalReturnState?.expandedTerms)}
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
