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
} from "../slices/swapSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import SwapStatusComponent from "./SwapStatus";
import StepIndicator from "./StepIndicator";
import TransactionInfoStep from "./TransactionInfoStep";
import CopyAddressStep from "./CopyAddressStep";
import { SwapStep } from "./types";

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
    dispatch(fetchSupportedAssets());
  }, [dispatch]);

  // Fetch swap estimate when assets or amount changes
  useEffect(() => {
    if (
      fromAsset &&
      toAsset &&
      debouncedFromAmount &&
      parseFloat(debouncedFromAmount) > 0
    ) {
      dispatch(
        fetchSwapEstimate({
          fromCurrency: fromAsset.ticker,
          fromNetwork: fromAsset.network,
          toCurrency: toAsset.ticker,
          toNetwork: toAsset.network,
          amount: parseFloat(debouncedFromAmount),
        })
      );
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
        return;
      }

      if (!estimate) {
        return;
      }

      // Validate wallet address
      if (!walletAddress.trim()) {
        setWalletValidationError("Wallet address is required");
        return;
      }

      // Import and use the validation function
      import("@/lib/addressValidaion").then(({ validateWalletAddress }) => {
        const normalizedNetwork = fromAsset?.network?.toUpperCase();
        const validationResult = validateWalletAddress(
          walletAddress,
          normalizedNetwork
        );

        if (!validationResult.isValid) {
          setWalletValidationError(
            validationResult.message ||
              `Invalid ${fromAsset?.network || "wallet"} address`
          );
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
    if (currentStep === "copy-address") {
      setCurrentStep("transaction-info");
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
      return;
    }

    console.log("All fields present, creating swap...");

    try {
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
      setCurrentStep("copy-address");
    } catch (error: any) {
      console.error("Failed to create swap:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
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
      setCopyMessage("Failed");
      setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    }
  };

  const handleCopyAddressStepNext = () => {
    setCurrentStep("status");
  };

  const handleCopyAddressStepBack = () => {
    setCurrentStep("transaction-info");
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
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
    <div className="mx-auto text-white">
      <h2 className="text-lg font-semibold mb-6">Swap Crypto</h2>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: Transaction Info */}
      {currentStep === "transaction-info" && (
        <TransactionInfoStep
          fromAsset={fromAsset}
          toAsset={toAsset}
          fromAmount={fromAmount}
          toAmount={toAmount}
          walletAddress={walletAddress}
          supportedAssets={supportedAssets}
          estimate={estimate}
          estimateLoading={estimateLoading}
          estimateError={estimateError}
          localSwapError={localSwapError}
          walletValidationError={walletValidationError}
          isFromAssetOpen={isFromAssetOpen}
          isToAssetOpen={isToAssetOpen}
          searchTerm={searchTerm}
          toSearchTerm={toSearchTerm}
          onFromAssetSelect={(asset) => dispatch(setFromAsset(asset))}
          onToAssetSelect={(asset) => dispatch(setToAsset(asset))}
          onFromAmountChange={handleFromAmountChange}
          onToAmountChange={handleToAmountChange}
          onWalletAddressChange={handleWalletAddressChange}
          onFromAssetToggle={() => setIsFromAssetOpen(!isFromAssetOpen)}
          onToAssetToggle={() => setIsToAssetOpen(!isToAssetOpen)}
          onSearchTermChange={setSearchTerm}
          onToSearchTermChange={setToSearchTerm}
          onSubmit={handleNextStep}
          swapLoading={swapLoading}
        />
      )}

      {/* Step 2: Copy Address */}
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
