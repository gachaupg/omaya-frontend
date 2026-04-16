/**
 * SwapWidget.tsx – Refactored to use smaller components
 */
"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
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

import { logger } from "@/lib/utils/logger";
import { swapAmountToInputString } from "@/lib/utils/swapAmountInput";

// Minimum swap value in USD/USDT - smaller amounts can disappear due to fees
const MIN_SWAP_USD = 30;
const RETURNING_FROM_LEGAL_KEY = "omaya_returning_from_legal";
const SWAP_LEGAL_RETURN_STATE_KEY = "omaya_swap_legal_return_state";

const meetsMinimumSwap = (
  fromAsset: SupportedAsset | null,
  toAsset: SupportedAsset | null,
  fromAmount: string,
  toAmount: string
): boolean => {
  if (!fromAsset || !toAsset) return false;
  const fromTicker = (fromAsset.ticker || "").toUpperCase();
  const toTicker = (toAsset.ticker || "").toUpperCase();
  const fromVal = parseFloat(fromAmount) || 0;
  const toVal = parseFloat(toAmount) || 0;

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
  const [hasAcceptedTerms, setHasAcceptedTerms] = React.useState(false);
  const [activeInputField, setActiveInputField] = React.useState<"from" | "to">(
    "from"
  );
  const [lastSuccessfulEstimate, setLastSuccessfulEstimate] =
    React.useState<SwapEstimate | null>(null);

  // New state for the flow
  const [currentStep, setCurrentStep] =
    React.useState<SwapStep>("transaction-info");
  const [showWalletAddress, setShowWalletAddress] = React.useState(false);
  const [hasRestoredState, setHasRestoredState] = React.useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const returning = sessionStorage.getItem(RETURNING_FROM_LEGAL_KEY);
      if (!returning) {
        sessionStorage.removeItem(SWAP_LEGAL_RETURN_STATE_KEY);
        return;
      }

      const saved = sessionStorage.getItem(SWAP_LEGAL_RETURN_STATE_KEY);
      if (!saved) {
        sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
        return;
      }

      const state = JSON.parse(saved) as {
        walletAddress?: string;
        showWalletAddress?: boolean;
        hasAcceptedTerms?: boolean;
        scrollY?: number;
      };

      if (typeof state.walletAddress === "string") {
        setWalletAddress(state.walletAddress);
      }
      if (typeof state.showWalletAddress === "boolean") {
        setShowWalletAddress(state.showWalletAddress);
      }
      if (typeof state.hasAcceptedTerms === "boolean") {
        setHasAcceptedTerms(state.hasAcceptedTerms);
      }

      if (typeof state.scrollY === "number" && !Number.isNaN(state.scrollY)) {
        window.setTimeout(() => {
          window.scrollTo({ top: Math.max(0, state.scrollY || 0), behavior: "auto" });
        }, 0);
      }

      sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
      sessionStorage.removeItem(SWAP_LEGAL_RETURN_STATE_KEY);
    } catch {
      sessionStorage.removeItem(RETURNING_FROM_LEGAL_KEY);
      sessionStorage.removeItem(SWAP_LEGAL_RETURN_STATE_KEY);
    }
  }, []);

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

  useEffect(() => {
    dispatch(resetErrorToastFlag());
    // ✅ Data fetching moved to SwapDataProvider (parent component)
    // This eliminates duplicate API calls and improves performance
    // dispatch(fetchSupportedAssets(false)).catch((error) => {
    //   logger.error('swap', "Failed to fetch supported assets:", error);
    //   handleApiError(error);
    // });
  }, [dispatch]);

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
    if (!fromAsset || !toAsset || !fromAmount || parseFloat(fromAmount) <= 0) {
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

  // Fetch swap estimate when assets or amount changes
  useEffect(() => {
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
    if (!fromAsset || !toAsset || !fromAmount || parseFloat(fromAmount) <= 0) {
      setLocalSwapError("Please select assets and enter a valid amount.");
      return;
    }

    if (!estimate) {
      setLocalSwapError("Please wait for the swap estimate to load.");
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
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Validate max 12 digits before decimal
      if (!validateAmount(value)) return;
      setActiveInputField("from");
      dispatch(setFromAmount(value));
    }
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Validate max 12 digits before decimal
      if (!validateAmount(value)) return;
      setActiveInputField("to");
      dispatch(setToAmount(value));
    }
  };

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWalletAddress(e.target.value);
    setWalletValidationError(""); // Clear error when user types
  };

  const handleBeforeLegalNavigate = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      sessionStorage.setItem(
        SWAP_LEGAL_RETURN_STATE_KEY,
        JSON.stringify({
          walletAddress,
          showWalletAddress,
          hasAcceptedTerms,
          scrollY: window.scrollY,
        })
      );
      sessionStorage.setItem(RETURNING_FROM_LEGAL_KEY, "1");
    } catch {
      // Ignore storage errors and let navigation continue.
    }
  }, [walletAddress, showWalletAddress, hasAcceptedTerms]);

  const handleSubmit = async () => {
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
    // Clear the estimate when swapping assets
    dispatch(clearEstimate());
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
      <h2 className="text-base sm:text-lg font-semibold   text-gray-900 dark:text-white">
        Swap Crypto
      </h2>
      {isInitialAssetLoading && (
        <div className="mb-3 rounded-lg border border-[#1D8751]/30 bg-[#1D8751]/10 px-3 py-2 text-xs sm:text-sm text-[#1D8751]">
          Loading assets in background... you can already view the swap UI.
        </div>
      )}
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
            onFromAssetSelect={(asset) => dispatch(setFromAsset(asset))}
            onToAssetSelect={(asset) => dispatch(setToAsset(asset))}
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
              hasAcceptedTerms={hasAcceptedTerms}
              onHasAcceptedTermsChange={setHasAcceptedTerms}
              onBeforeLegalNavigate={handleBeforeLegalNavigate}
              // Pass loading state to disable button
              isLoading={swapLoading}
            />
          )}
        </>
      )}
      {/* <SwapStatusComponent transactionId={""} date={""} paidAmount={""} paidCurrency={""} receivedAmount={""} receivedCurrency={""}        */}
      {/* /> */}
      {/* <SuccessPage /> */}
    </div>
  );
};

export default SwapWidget;
