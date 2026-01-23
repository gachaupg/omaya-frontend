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
import { showToast } from "@/lib/utils/toast";
import { handleApiError } from "@/lib/utils/errorHandler";
import SuccessPage from "@/features/express/components/success";
import { SwapWidgetSkeleton } from "@/components/ui/Skeletons";

import { logger } from "@/lib/utils/logger";

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
          handleApiError(error);
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
        // User typed in "from" field, update "to" amount (normal flow)
        // Use toAmount from raw_response if available, otherwise fall back to estimated_amount
        const toAmount =
          estimate.raw_response?.toAmount ||
          estimate.toAmount ||
          estimate.estimated_amount;
        if (toAmount !== undefined) {
          dispatch(setToAmount(toAmount.toString()));
        }
      } else if (activeInputField === "to") {
        // User typed in "to" field, update "from" amount (reverse flow)
        // Since we swapped the currencies in the API call, the estimate.toAmount
        // now represents what the user should send (because we swapped from/to in the API call)
        const fromAmount =
          estimate.raw_response?.toAmount ||
          estimate.toAmount ||
          estimate.estimated_amount;
        if (fromAmount !== undefined) {
          dispatch(setFromAmount(fromAmount.toString()));
        }
      }
    }
  }, [estimate, estimateLoading, dispatch, activeInputField]);

  // Handle estimate errors
  useEffect(() => {
    if (estimateError) {
      console.error("Swap estimate error:", estimateError);
      logger.debug(
        "swap",
        "Active input field during error:",
        activeInputField
      );

      // Only show error toast for forward calculation errors
      // Reverse calculation errors might be expected (unsupported pairs)
      if (activeInputField === "from") {
        showToast.error("Estimate Error", estimateError);
      } else {
        console.warn(
          "Reverse calculation error (might be expected):",
          estimateError
        );

        // Try fallback calculation using last successful estimate
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

            // Check if both amounts are valid numbers before calculating rate
            if (
              toAmount !== undefined &&
              fromAmount !== undefined &&
              toAmount > 0 &&
              fromAmount > 0
            ) {
              const rate = toAmount / fromAmount;
              const calculatedFromAmount = parseFloat(debouncedToAmount) / rate;
              dispatch(setFromAmount(calculatedFromAmount.toString()));
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
    if (swapError) {
      console.error("Swap error:", swapError);
      showToast.error("Swap Error", swapError);
    }
  }, [swapError]);

  // Handle next step validation
  const handleNextStep = () => {
    // Validate that we have all required fields
    if (!fromAsset || !toAsset || !fromAmount || parseFloat(fromAmount) <= 0) {
      showToast.error(
        "Missing Required Fields",
        "Please select assets and enter a valid amount"
      );
      return;
    }

    if (!estimate) {
      showToast.error(
        "No Estimate Available",
        "Please wait for the swap estimate to load"
      );
      return;
    }

    // Show wallet address form below
    setShowWalletAddress(true);
  };

  const handleWalletAddressNext = () => {
    // Skip wallet address validation - proceed directly to swap creation
    if (!walletAddress.trim()) {
      setWalletValidationError("Wallet address is required");
      showToast.error(
        "Wallet Address Required",
        "Please enter a wallet address"
      );
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
      showToast.error("Invalid Amount", "Maximum 12 digits allowed before the decimal point.");
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

  const handleSubmit = async () => {
    logger.debug("swap", "handleSubmit called");
    if (!fromAsset || !toAsset || !walletAddress || !estimate) {
      console.error("Missing required fields");
      showToast.error(
        "Missing required fields",
        "Please fill in all required information"
      );
      return;
    }

    logger.debug("swap", "All fields present, creating swap...");

    try {
      dispatch(resetErrorToastFlag()); // Reset error toast flag before creating swap
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
      setCurrentStep("copy-address");
    } catch (error: any) {
      console.error("Failed to create swap:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Handle specific error cases
      if (error.response?.status === 500) {
        showToast.error(
          "Server Error",
          "The server encountered an error. Please try again later."
        );
      } else if (error.response?.status === 400) {
        showToast.error(
          "Invalid Request",
          error.response?.data?.message ||
            "Please check your input and try again"
        );
      } else if (error.response?.status === 401) {
        showToast.error("Authentication Required", "Please log in to continue");
      } else if (error.response?.status === 403) {
        showToast.error(
          "Access Denied",
          "You don't have permission to perform this action"
        );
      } else if (error.response?.status === 429) {
        showToast.error(
          "Too Many Requests",
          "Please wait a moment before trying again"
        );
      } else {
        // Use the general error handler for other cases
        handleApiError(error);
      }
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(swapResponse?.payinAddress || "");
      // Show success feedback
      setCopyMessage("Copied!");
      showToast.success("Address copied to clipboard");
      setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyMessage("Failed");
      showToast.error(
        "Failed to copy address",
        "Please copy the address manually"
      );
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

  const [skeletonTimeoutReached, setSkeletonTimeoutReached] = useState(false);

  useEffect(() => {
    if (loading && supportedAssets.length === 0) {
      const timer = setTimeout(() => setSkeletonTimeoutReached(true), 10000);
      return () => clearTimeout(timer);
    }
    setSkeletonTimeoutReached(false);
  }, [loading, supportedAssets.length]);

  // Detect stale loading state (e.g., persisted loading flag) and force refresh
  useEffect(() => {
    if (!loading || supportedAssets.length > 0) {
      return;
    }

    const staleLoadingTimer = setTimeout(() => {
      if (loading && supportedAssets.length === 0) {
        logger.warn(
          "swap",
          "SwapWidget detected stale loading state. Forcing supported assets refresh."
        );
        dispatch(fetchSupportedAssets(true));
      }
    }, 8000); // fallback after 8s

    return () => clearTimeout(staleLoadingTimer);
  }, [loading, supportedAssets.length, dispatch]);

  const handleSupportedAssetsRetry = useCallback(() => {
    setSkeletonTimeoutReached(false);
    dispatch(fetchSupportedAssets(true));
  }, [dispatch]);

  // Show skeleton while loading initial data (supported assets)
  if (loading && supportedAssets.length === 0) {
    if (!skeletonTimeoutReached) {
      return <SwapWidgetSkeleton />;
    }

    return (
      <div className="w-full sm:max-w-lg sm:mx-auto p-3 sm:p-4 md:p-6 bg-white dark:bg-[var(--card-color)] rounded-lg border dark:border-[#35353E] border-gray-200">
        <div className="flex flex-col items-center text-center gap-3">
          <SwapWidgetSkeleton />
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            This is taking longer than usual. Please refresh or try again.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 sm:px-4 py-2 bg-[#1D8751] hover:bg-[#1a6b3f] text-white rounded-md text-xs sm:text-sm"
            >
              Refresh
            </button>
            <button
              onClick={handleSupportedAssetsRetry}
              className="px-3 sm:px-4 py-2 border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751]/10 rounded-md text-xs sm:text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full dark:text-white text-gray-900">
        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3 sm:p-4">
          <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2 text-sm sm:text-base">
            Error Loading Swap
          </h3>
          <p className="text-red-500 dark:text-red-300 text-xs sm:text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 rounded-md text-white text-xs sm:text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col dark:text-white text-gray-900 w-full max-w-3xl mx-auto px-4 sm:px-6">
      <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 md:mb-6 text-gray-900 dark:text-white">
        Swap Crypto
      </h2>

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
          />
          {showWalletAddress && (
            <WalletAddressStep
              walletAddress={walletAddress}
              onWalletAddressChange={handleWalletAddressChange}
              onBack={() => {}}
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
    </div>
  );
};

export default SwapWidget;
