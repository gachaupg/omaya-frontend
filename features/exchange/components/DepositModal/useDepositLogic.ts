import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../../store";
import {
  fetchPaymentMethods,
  fetchPaymentProviders,
  fetchAdminPaymentDetails,
} from "../../slices/paymentSlice";
import { createDeposit, fetchAssets } from "../../slices/exchangeSlice";
import { validateWalletAddress } from "../utils/validation/walletValidation";
import { calculateCommission } from "../utils/calculations/commissionCalculator";
import {
  calculateNetworkFee,
  calculateTotalFees,
} from "../utils/calculations/feeCalculator";
import toast from "react-hot-toast";
import { Asset, Network, PaymentMethod, PaymentProvider } from "../../types";

import { logger } from '@/lib/utils/logger';

export function useDepositLogic(
  asset: Asset,
  assetType: "Crypto" | "Forex",
  onClose: () => void
) {
  const dispatch = useDispatch<AppDispatch>();
  const { paymentMethods, paymentProviders, loading, adminPaymentDetails } =
    useSelector((state: any) => state.payment);
  const { assets } = useSelector((state: any) => state.exchange);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(
    asset.networks[0] || null
  );
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    adminPaymentDetails: currentAdminPaymentDetails,
    paymentMethods: currentPaymentMethods,
    paymentProviders: currentPaymentProviders,
  } = useSelector((state: any) => state.payment);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(asset);
  const [currentAssetType, setCurrentAssetType] = useState<"Crypto" | "Forex">(
    assetType
  );

  useEffect(() => {
    let error: string | null = null;
    if (currentAssetType === "Crypto" && currentAsset?.symbol === "USDT") {
      error = validateWalletAddress(
        walletAddress,
        selectedNetwork?.network_type,
        currentAsset?.symbol
      );
    } else if (walletAddress.trim() !== "") {
      error = null;
    }
    setWalletError(error);
  }, [walletAddress, selectedNetwork, currentAsset?.symbol, currentAssetType]);

  useEffect(() => {
    dispatch(fetchPaymentMethods())
      .unwrap()
      .catch((error: unknown) => {
        toast.error(`Failed to fetch payment methods: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    if (selectedMethod) {
      dispatch(fetchPaymentProviders(selectedMethod.name))
        .unwrap()
        .catch((error: unknown) => {
          toast.error(`Failed to fetch payment providers: ${error}`);
        });
    }
  }, [dispatch, selectedMethod]);

  useEffect(() => {
    if (selectedMethod && selectedProvider) {
      dispatch(fetchAdminPaymentDetails())
        .unwrap()
        .catch((error: unknown) => {
          // Silent - no error display
        });
    }
  }, [dispatch, selectedMethod, selectedProvider]);

  useEffect(() => {
    dispatch(fetchAssets());
  }, [dispatch]);

  useEffect(() => {
    if (assets?.assets && assets.assets.length > 0) {
      const CRYPTO_ASSETS = [
        "USDT Tether",
        "BTC",
        "ETH",
        "BNB",
        "DOGE",
        "ADA",
        "SOL",
        "XRP",
        "USD",
      ];
      const filteredAssets = assets.assets.filter((a: Asset) =>
        currentAssetType === "Crypto"
          ? CRYPTO_ASSETS.includes(a.symbol)
          : !CRYPTO_ASSETS.includes(a.symbol)
      );
      if (filteredAssets.length > 0) {
        const firstAsset = filteredAssets[0];
        setCurrentAsset(firstAsset);
        if (currentAssetType === "Crypto" && firstAsset.networks?.length > 0) {
          setSelectedNetwork(firstAsset.networks[0]);
        } else {
          setSelectedNetwork(null);
        }
      } else {
        setCurrentAsset(null);
        setSelectedNetwork(null);
      }
    }
  }, [assets, currentAssetType]);

  const amountNum = parseFloat(amount) || 0;
  const { commission, commissionRate } = currentAsset
    ? calculateCommission(currentAsset, amountNum)
    : { commission: 0, commissionRate: 0 };
  const networkFee = calculateNetworkFee(
    currentAssetType,
    selectedNetwork,
    amountNum
  );
  const totalFees = calculateTotalFees(commission, networkFee);
  const assetAmount = amountNum + totalFees;

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWalletAddress(e.target.value);
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWalletAddress(text);
    } catch (err) {
      logger.error('exchange', "Failed to read clipboard:", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setFileError("Invalid file type. Please upload an image or PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File too large. Maximum size is 5MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    setSubmitError(null);
    if (!walletAddress) {
      setSubmitError("Wallet address is required");
      return;
    }
    if (walletError) {
      setSubmitError("Please fix the wallet address errors");
      return;
    }
    if (!confirmAddress) {
      setSubmitError("Please confirm the wallet address");
      return;
    }
    if (!confirmPayment) {
      setSubmitError("Please confirm that you sent the payment");
      return;
    }
    if (!acceptTerms) {
      setSubmitError("Please accept the terms and conditions");
      return;
    }
    if (!selectedFile) {
      setSubmitError("Please upload a payment screenshot");
      return;
    }
    if (!selectedMethod) {
      setSubmitError("Please select a payment method");
      return;
    }
    if (!selectedProvider) {
      setSubmitError("Please select a payment provider");
      return;
    }
    const depositPayload = new FormData();
    depositPayload.append("requested_amount", amountNum.toString());
    depositPayload.append("deposit_address", walletAddress);
    depositPayload.append("payment_provider", selectedProvider.provider_name);
    depositPayload.append("payment_method", selectedMethod.name);
    depositPayload.append(
      "currency",
      currentAsset?.symbol === "USDT Tether"
        ? "USDT"
        : currentAsset?.symbol || ""
    );
    if (
      currentAssetType === "Crypto" &&
      selectedNetwork &&
      selectedNetwork.network_id
    ) {
      depositPayload.append("network", selectedNetwork.network_id);
    }
    if (currentAsset?.asset_id) {
      depositPayload.append("asset", currentAsset.asset_id);
    }
    if (notes) {
      depositPayload.append("additional_info", notes);
    }
    if (selectedFile) {
      depositPayload.append("screenshot", selectedFile);
    }
    const config = selectedFile
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;
    dispatch(createDeposit({ payload: depositPayload, config }))
      .unwrap()
      .then(() => {
        toast.success("Deposit request submitted successfully!");
        onClose();
      })
      .catch((error: unknown) => {
        toast.error(`Deposit submission failed: ${error}`);
      });
  };

  return {
    paymentMethods,
    paymentProviders,
    loading,
    adminPaymentDetails,
    assets,
    selectedNetwork,
    setSelectedNetwork,
    amount,
    setAmount,
    walletAddress,
    setWalletAddress,
    notes,
    setNotes,
    confirmPayment,
    setConfirmPayment,
    acceptTerms,
    setAcceptTerms,
    showWithdraw,
    setShowWithdraw,
    selectedMethod,
    setSelectedMethod,
    selectedProvider,
    setSelectedProvider,
    walletError,
    setWalletError,
    confirmAddress,
    setConfirmAddress,
    submitError,
    setSubmitError,
    selectedFile,
    setSelectedFile,
    fileError,
    setFileError,
    fileInputRef,
    currentAdminPaymentDetails,
    currentPaymentMethods,
    currentPaymentProviders,
    currentAsset,
    setCurrentAsset,
    currentAssetType,
    setCurrentAssetType,
    amountNum,
    commission,
    commissionRate,
    networkFee,
    totalFees,
    assetAmount,
    handleWalletAddressChange,
    handlePasteClick,
    handleFileUpload,
    handleUploadClick,
    handleSubmit,
  };
}
