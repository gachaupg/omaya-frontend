/**
 * SwapWidget.tsx – Refactored to use smaller components
 */
"use client";
import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setFromAsset,
  setToAsset,
  setFromAmount,
  setToAmount,
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

const SwapWidget = () => {
  const dispatch = useDispatch<AppDispatch>();
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

  // New state for the flow
  const [currentStep, setCurrentStep] =
    React.useState<SwapStep>("transaction-info");

  // Simple debounce implementation
  const [debouncedFromAmount, setDebouncedFromAmount] =
    React.useState(fromAmount);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFromAmount(fromAmount);
    }, 500);

    return () => clearTimeout(timer);
  }, [fromAmount]);

  useEffect(() => {
    dispatch(resetErrorToastFlag());
    dispatch(fetchSupportedAssets()).catch((error) => {
      console.error("Failed to fetch supported assets:", error);
      handleApiError(error);
    });
  }, [dispatch]);

  // Fetch swap estimate when assets or amount changes
  useEffect(() => {
    if (
      fromAsset &&
      toAsset &&
      debouncedFromAmount &&
      parseFloat(debouncedFromAmount) > 0
    ) {
      dispatch(resetErrorToastFlag());
      dispatch(
        fetchSwapEstimate({
          fromCurrency: fromAsset.ticker,
          fromNetwork: fromAsset.network,
          toCurrency: toAsset.ticker,
          toNetwork: toAsset.network,
          amount: parseFloat(debouncedFromAmount),
        })
      ).catch((error) => {
        console.error("Failed to fetch swap estimate:", error);
        handleApiError(error);
      });
    } else {
      // Clear estimate if conditions are not met
      dispatch(clearEstimate());
    }
  }, [dispatch, fromAsset, toAsset, debouncedFromAmount]);

  // Update toAmount when estimate is received
  useEffect(() => {
    if (
      estimate &&
      !estimateLoading &&
      estimate.estimated_amount !== undefined
    ) {
      dispatch(setToAmount(estimate.estimated_amount.toString()));
    }
  }, [estimate, estimateLoading, dispatch]);

  // Handle estimate errors
  useEffect(() => {
    if (estimateError) {
      console.error("Swap estimate error:", estimateError);
      showToast.error("Estimate Error", estimateError);
    }
  }, [estimateError]);

  // Handle swap errors
  useEffect(() => {
    if (swapError) {
      console.error("Swap error:", swapError);
      showToast.error("Swap Error", swapError);
    }
  }, [swapError]);

  // Handle next step validation
  const handleNextStep = () => {
    if (currentStep === "transaction-info") {
      // Validate that we have all required fields
      if (
        !fromAsset ||
        !toAsset ||
        !fromAmount ||
        parseFloat(fromAmount) <= 0
      ) {
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

      // Move to wallet address step
      setCurrentStep("wallet-address");
    } else if (currentStep === "wallet-address") {
      // Validate wallet address
      if (!walletAddress.trim()) {
        setWalletValidationError("Wallet address is required");
        showToast.error(
          "Wallet Address Required",
          "Please enter a valid wallet address"
        );
        return;
      }

      // Import and use the validation function
      import("@/lib/addressValidaion").then(({ validateWalletAddress }) => {
        const normalizedNetwork = fromAsset?.network?.toUpperCase() || "ETH";
        const validationResult = validateWalletAddress(
          walletAddress,
          normalizedNetwork
        );

        if (!validationResult.isValid) {
          const errorMessage =
            validationResult.message ||
            `Invalid ${fromAsset?.network || "wallet"} address`;
          setWalletValidationError(errorMessage);
          showToast.error("Invalid Wallet Address", errorMessage);
          return;
        }

        // Clear any previous validation errors
        setWalletValidationError("");

        // All validation passed, create the swap
        handleSubmit();
      });
    }
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

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      dispatch(setFromAmount(value));
    }
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
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
    console.log("handleSubmit called");
    if (!fromAsset || !toAsset || !walletAddress || !estimate) {
      console.error("Missing required fields");
      showToast.error(
        "Missing required fields",
        "Please fill in all required information"
      );
      return;
    }

    console.log("All fields present, creating swap...");

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
      console.log("Swap created successfully");
      showToast.success(
        "Swap created successfully",
        "Please copy the address and send your funds"
      );
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

  if (error) {
    return (
      <div className="mx-auto dark:text-white text-[#0D0D0D]">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">
            Error Loading Swap
          </h3>
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-white text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showStatus && swapResponse?.id) {
    return (
      <SwapStatusComponent
        swapId={swapResponse.id}
        swapResponse={swapResponse}
        onBack={() => {
          setShowStatus(false);
          dispatch(clearSwapResponse());
          setCurrentStep("transaction-info");
        }}
      />
    );
  }

  // Show status page if we're on status step and have a swap response
  if (currentStep === "status" && swapResponse?.id) {
    return (
      <SwapStatusComponent
        swapId={swapResponse.id}
        swapResponse={swapResponse}
        onBack={() => {
          dispatch(clearSwapResponse());
          setCurrentStep("transaction-info");
        }}
      />
    );
  }

  return (
    <div className="mx-auto dark:text-white text-[#0D0D0D]">
      <h2 className="text-lg font-semibold mb-6">Swap Crypto</h2>

      {/* Step Indicator */}
      {/* <StepIndicator currentStep={currentStep} /> */}

      {/* Step 1: Transaction Info */}
      {currentStep === "transaction-info" && (
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
          onSubmit={handleNextStep}
          swapLoading={swapLoading}
        />
      )}

      {/* Step 2: Wallet Address */}
      {currentStep === "wallet-address" && (
        <WalletAddressStep
          walletAddress={walletAddress}
          onWalletAddressChange={handleWalletAddressChange}
          walletValidationError={walletValidationError}
          onBack={handleBackStep}
          onNext={handleNextStep}
          fromAsset={fromAsset}
        />
      )}

      {/* Step 3: Copy Address */}
      {currentStep === "copy-address" && (
        <CopyAddressStep
          swapResponse={swapResponse}
          copyMessage={copyMessage}
          onCopyAddress={handleCopyAddress}
          onBack={handleCopyAddressStepBack}
          onNext={handleCopyAddressStepNext}
        />
      )}
    </div>
  );
};

export default SwapWidget;
