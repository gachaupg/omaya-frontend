"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { createUserWalletAddress } from "@/features/settings/slices/userWalletAddressesSlice";
import { fetchUserWalletAddresses } from "@/features/settings/slices/userWalletAddressesSlice";
import { fetchAssets } from "@/features/exchange/slices/exchangeSlice";
import { fetchSupportedAssets } from "@/features/swap/slices/swapSlice";
import { withTimeout } from "@/features/express/utils/fetchWithTimeout";
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { showToast } from "@/lib/utils/toast";
import type { SupportedAsset } from "@/features/swap/types";
import { getHighResAssetIcon } from "@/features/express/utils/imageHelpers";
import { fetchP2PDepositAddresses } from "@/features/p2p/slices/p2pDepositAddressesSlice";
import {
  sendPaymentDetailAddOtp,
  verifyPaymentDetailAddOtp,
} from "@/features/p2p/api";
import { useAssetsDisplay } from "@/features/express/hooks/useDataDisplay";
import { isForexPrimusAsset } from "@/features/express/api";

/** Same network resolution as Express deposit (`deposit.tsx`). */
const getAssetNetwork = (asset: any): string => {
  if (asset?.network) return asset.network;
  if (asset?.networks?.length > 0) {
    return (
      asset.networks[0].network_type ||
      asset.networks[0].network_id ||
      ""
    );
  }
  return "";
};

const assetRowKey = (a: any) =>
  `${(a?.ticker || a?.symbol || a?.name || "").toString().toLowerCase()}|${(a?.network || getAssetNetwork(a) || "").toString().toLowerCase()}`;

interface AddWalletAddressModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddWalletAddressModal = ({
  open,
  onClose,
  onSuccess,
}: AddWalletAddressModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    supportedAssets,
    loading: swapLoading,
    error: swapError,
  } = useSelector((s: RootState) => s.swap);
  const {
    assets: exchangeAssetsResponse,
    loading: exchangeAssetsLoading,
    error: exchangeError,
  } = useSelector((s: RootState) => s.exchange);
  const assetsListLoading = swapLoading || exchangeAssetsLoading;

  const assetsDisplay = useAssetsDisplay(
    exchangeAssetsResponse?.assets,
    supportedAssets,
    exchangeAssetsLoading,
    swapLoading,
    exchangeError,
    swapError
  );
  const { addresses: existingWalletAddresses } = useSelector(
    (s: RootState) => s.userWalletAddresses
  );
  const { addresses: p2pDepositAddresses } = useSelector(
    (s: RootState) => (s as any).p2pDepositAddresses || { addresses: [] }
  );

  const [selectedAssetTicker, setSelectedAssetTicker] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [otpFeedback, setOtpFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const assetTriggerRef = useRef<HTMLButtonElement>(null);
  const assetPortalRef = useRef<HTMLDivElement>(null);
  const networkDropdownRef = useRef<HTMLDivElement>(null);
  const networkTriggerRef = useRef<HTMLButtonElement>(null);
  const networkPortalRef = useRef<HTMLDivElement>(null);

  const [assetDropdownRect, setAssetDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [networkDropdownRect, setNetworkDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [assetLoadTimedOut, setAssetLoadTimedOut] = useState(false);
  const assetsBootstrapForOpenRef = useRef(false);

  /** Same merged + cached list as Express deposit (`useAssetsDisplay`). */
  const expressAssetRows = assetsDisplay.displayData || [];

  /** Same ordering as Express deposit asset dropdown (`sortedSwapAssets`). */
  const sortedExpressAssets = useMemo(() => {
    return [...expressAssetRows].sort((a, b) => {
      const tickerA = (a?.ticker || a?.symbol || a?.name || "")
        .toString()
        .toLowerCase();
      const tickerB = (b?.ticker || b?.symbol || b?.name || "")
        .toString()
        .toLowerCase();
      const networkA = (a?.network || getAssetNetwork(a) || "")
        .toString()
        .toLowerCase();
      const networkB = (b?.network || getAssetNetwork(b) || "")
        .toString()
        .toLowerCase();

      if (
        tickerA === "usdt" &&
        networkA === "bsc" &&
        !(tickerB === "usdt" && networkB === "bsc")
      ) {
        return -1;
      }
      if (
        tickerB === "usdt" &&
        networkB === "bsc" &&
        !(tickerA === "usdt" && networkA === "bsc")
      ) {
        return 1;
      }

      if (
        tickerA === "usdc" &&
        networkA === "bsc" &&
        !(tickerB === "usdc" && networkB === "bsc")
      ) {
        return -1;
      }
      if (
        tickerB === "usdc" &&
        networkB === "bsc" &&
        !(tickerA === "usdc" && networkA === "bsc")
      ) {
        return 1;
      }

      const isFxpA = tickerA === "fxp" || tickerA === "fxprimus";
      const isFxpB = tickerB === "fxp" || tickerB === "fxprimus";
      if (isFxpA && !isFxpB) return -1;
      if (isFxpB && !isFxpA) return 1;

      return 0;
    });
  }, [expressAssetRows]);

  const sortedFilteredBySearch = useMemo(() => {
    const q = assetSearch.trim().toUpperCase();
    if (!q) return sortedExpressAssets;
    return sortedExpressAssets.filter((a) => {
      const ticker = a?.ticker?.toUpperCase() || "";
      const name = a?.name?.toUpperCase() || "";
      const symbol = a?.symbol?.toUpperCase() || "";
      const net = (a?.network || getAssetNetwork(a) || "").toUpperCase();
      return (
        ticker.includes(q) ||
        name.includes(q) ||
        symbol.includes(q) ||
        net.includes(q)
      );
    });
  }, [sortedExpressAssets, assetSearch]);

  const popularAssets = useMemo(() => {
    const normalize = (asset: any) =>
      (asset?.ticker || asset?.symbol || asset?.name || "")
        .toString()
        .toLowerCase();
    const network = (asset: any) =>
      (asset?.network || getAssetNetwork(asset) || "")
        .toString()
        .toLowerCase();
    const usdtBsc = sortedExpressAssets.find(
      (a) => normalize(a) === "usdt" && network(a) === "bsc"
    );
    const usdcBsc = sortedExpressAssets.find(
      (a) => normalize(a) === "usdc" && network(a) === "bsc"
    );
    const fxp = sortedExpressAssets.find((a) => isForexPrimusAsset(a));
    return [usdtBsc, usdcBsc, fxp].filter(Boolean) as SupportedAsset[];
  }, [sortedExpressAssets]);

  const popularKeySet = useMemo(
    () => new Set(popularAssets.map((a) => assetRowKey(a))),
    [popularAssets]
  );

  const otherAssets = useMemo(() => {
    if (assetSearch.trim()) return sortedFilteredBySearch;
    return sortedFilteredBySearch.filter((a) => !popularKeySet.has(assetRowKey(a)));
  }, [sortedFilteredBySearch, assetSearch, popularKeySet]);

  const networksForAsset = useMemo(() => {
    if (!selectedAssetTicker) return [];
    const tickerU = selectedAssetTicker.toUpperCase();
    const byNetwork = new Map<string, SupportedAsset>();
    for (const a of sortedExpressAssets) {
      if (a.ticker?.toUpperCase() !== tickerU) continue;
      const net = String(a.network ?? getAssetNetwork(a) ?? "").trim();
      if (!net) continue;
      const key = net.toLowerCase();
      if (!byNetwork.has(key)) {
        byNetwork.set(key, a);
      }
    }
    return Array.from(byNetwork.values()).sort((x, y) =>
      String(x.network).localeCompare(String(y.network), undefined, {
        sensitivity: "base",
      })
    );
  }, [sortedExpressAssets, selectedAssetTicker]);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetTicker || !selectedNetwork) return null;
    const net = selectedNetwork.toLowerCase();
    return (
      sortedExpressAssets.find(
        (a) =>
          a.ticker?.toUpperCase() === selectedAssetTicker.toUpperCase() &&
          (a.network || getAssetNetwork(a) || "").toLowerCase() === net
      ) ?? null
    );
  }, [sortedExpressAssets, selectedAssetTicker, selectedNetwork]);

  const currencyForValidation = selectedAssetTicker?.toLowerCase() || "";
  const networkForValidation = selectedNetwork?.toLowerCase() || "";

  const {
    result: validationResult,
    isValidating,
    validate,
    reset: resetValidation,
  } = useValidateAddress({
    currency: currencyForValidation,
    network: networkForValidation,
    debounceMs: 400,
    minLength: 10,
  });

  useEffect(() => {
    if (!open) {
      assetsBootstrapForOpenRef.current = false;
      setAssetLoadTimedOut(false);
      return;
    }
    if (assetsBootstrapForOpenRef.current) return;
    assetsBootstrapForOpenRef.current = true;

    // Same asset APIs as Express deposit (dashboard): exchange `fetchAssets` + swap `fetchSupportedAssets` with feature "exchange"
    void withTimeout(dispatch(fetchAssets(false)).unwrap(), 15_000)
      .then((data) => {
        if (!data?.assets || data.assets.length === 0) {
          return withTimeout(dispatch(fetchAssets(true)).unwrap(), 15_000);
        }
        return data;
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "";
        if (
          message.includes("Aborted due to condition callback returning false") ||
          message.includes("ConditionError")
        ) {
          return;
        }
        return withTimeout(dispatch(fetchAssets(true)).unwrap(), 15_000).catch(() => {});
      });

    void withTimeout(
      dispatch(
        fetchSupportedAssets({ forceRefresh: false, feature: "exchange" })
      ).unwrap(),
      35_000
    )
      .then((data) => {
        if (!data || data.length === 0) {
          return withTimeout(
            dispatch(
              fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
            ).unwrap(),
            35_000
          );
        }
        return data;
      })
      .catch((error: unknown) => {
        return withTimeout(
          dispatch(
            fetchSupportedAssets({ forceRefresh: true, feature: "exchange" })
          ).unwrap(),
          35_000
        ).catch(() => {});
      });
  }, [open, dispatch]);

  useEffect(() => {
    if (open) {
      dispatch(fetchUserWalletAddresses() as any);
    }
  }, [open, dispatch]);

  // Load P2P deposit addresses (includes defaults) so duplicate detection
  // can block adding the same address again.
  useEffect(() => {
    if (!open) return;
    const n = Array.isArray(p2pDepositAddresses) ? p2pDepositAddresses.length : 0;
    if (n > 0) return;
    dispatch(fetchP2PDepositAddresses() as any);
  }, [open, dispatch, p2pDepositAddresses]);

  // Timeout: if loading with no assets in dropdown, show retry
  useEffect(() => {
    if (
      !open ||
      !assetDropdownOpen ||
      !assetsListLoading ||
      sortedExpressAssets.length > 0
    ) {
      setAssetLoadTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setAssetLoadTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [open, assetDropdownOpen, assetsListLoading, sortedExpressAssets.length]);

  useEffect(() => {
    setSelectedNetwork("");
    setAddress("");
    resetValidation();
  }, [selectedAssetTicker]);

  useEffect(() => {
    resetValidation();
  }, [selectedNetwork]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inAsset =
        assetDropdownRef.current?.contains(target) ||
        assetPortalRef.current?.contains(target);
      if (!inAsset) setAssetDropdownOpen(false);
      const inNetwork =
        networkDropdownRef.current?.contains(target) ||
        networkPortalRef.current?.contains(target);
      if (!inNetwork) setNetworkDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (assetDropdownOpen && assetTriggerRef.current) {
      const rect = assetTriggerRef.current.getBoundingClientRect();
      setAssetDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setAssetDropdownRect(null);
    }
  }, [assetDropdownOpen]);

  useEffect(() => {
    if (networkDropdownOpen && networkTriggerRef.current) {
      const rect = networkTriggerRef.current.getBoundingClientRect();
      setNetworkDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setNetworkDropdownRect(null);
    }
  }, [networkDropdownOpen]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const duplicateNow = isDuplicateAddress(
      value,
      selectedAssetTicker,
      selectedNetwork
    );
    setAddress(value);
    if (duplicateNow) {
      // Skip validate API if we already have this address saved.
      resetValidation();
      const normalized = value.trim().toLowerCase();
      if (normalized && lastDuplicateToastRef.current !== normalized) {
        lastDuplicateToastRef.current = normalized;
        showToast.error("This wallet address is already saved.");
      }
      return;
    }

    // Reset duplicate toast guard when user changes input.
    const normalized = value.trim().toLowerCase();
    if (lastDuplicateToastRef.current && lastDuplicateToastRef.current !== normalized) {
      lastDuplicateToastRef.current = "";
    }

    if (value.trim() && currencyForValidation) {
      validate(value, currencyForValidation, networkForValidation);
    } else {
      resetValidation();
    }
  };

  const handleSendOtp = async () => {
    if (sendOtpLoading || verifyOtpLoading) return;
    // Restriction: user must provide a valid address before requesting OTP
    if (!selectedAssetTicker || !selectedNetwork) {
      setOtpFeedback({ type: "error", text: "Please select an asset and network first." });
      return;
    }
    if (!address.trim()) {
      setOtpFeedback({ type: "error", text: "Please enter a wallet address first." });
      return;
    }
    if (addressAlreadyExists) {
      setOtpFeedback({ type: "error", text: "This wallet address is already saved." });
      return;
    }
    if (isValidating) {
      setOtpFeedback({ type: "error", text: "Please wait for address validation to complete." });
      return;
    }
    if (!addressIsValid) {
      setOtpFeedback({
        type: "error",
        text: validationResult?.message || "Please enter a valid wallet address before requesting OTP.",
      });
      return;
    }
    setOtpFeedback(null);
    setSendOtpLoading(true);
    try {
      await sendPaymentDetailAddOtp();
      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");
      setOtpFeedback({ type: "success", text: "OTP sent to your email." });
    } catch (err: any) {
      const data = err?.response?.data;
      const message =
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.detail === "string" && data.detail) ||
        err?.message ||
        "Failed to send OTP";
      setOtpFeedback({
        type: "error",
        text: message,
      });
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (sendOtpLoading || verifyOtpLoading) return;
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setOtpFeedback({ type: "error", text: "Enter a 6-digit OTP." });
      return;
    }
    setOtpFeedback(null);
    setVerifyOtpLoading(true);
    try {
      await verifyPaymentDetailAddOtp(code);
      setOtpVerified(true);
      setOtpFeedback({ type: "success", text: "OTP verified." });
    } catch (err: any) {
      setOtpVerified(false);
      const data = err?.response?.data;
      const message =
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.detail === "string" && data.detail) ||
        err?.message ||
        "Invalid OTP ,Try again later";
      setOtpFeedback({
        type: "error",
        text: message,
      });
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const addressIsValid = validationResult?.isValid === true;
  const addressIsInvalid =
    validationResult !== null && validationResult.isValid === false;

  const lastDuplicateToastRef = useRef<string>("");

  const addressAlreadyExists = useMemo(() => {
    const v = address.trim().toLowerCase();
    if (!v) return false;
    const inUserWallets = (existingWalletAddresses || []).some((a) => {
      const aAddr = String(a?.address || "").trim().toLowerCase();
      if (!aAddr || aAddr !== v) return false;
      // If the address matches any saved wallet, block it (regardless of asset/network),
      // because the user is trying to add a duplicate saved address.
      return true;
    });
    if (inUserWallets) return true;

    // Also block addresses that already exist as P2P deposit addresses (including defaults).
    const inP2PDefaults = (Array.isArray(p2pDepositAddresses) ? p2pDepositAddresses : []).some(
      (a: any) => String(a?.address || "").trim().toLowerCase() === v
    );
    return inP2PDefaults;
  }, [address, existingWalletAddresses, selectedAssetTicker, selectedNetwork]);

  const isDuplicateAddress = (
    rawAddress: string,
    assetTicker: string,
    network: string
  ) => {
    const v = String(rawAddress || "").trim().toLowerCase();
    if (!v) return false;
    const inUserWallets = (existingWalletAddresses || []).some((a) => {
      const aAddr = String(a?.address || "").trim().toLowerCase();
      if (!aAddr || aAddr !== v) return false;
      return true;
    });
    if (inUserWallets) return true;

    return (Array.isArray(p2pDepositAddresses) ? p2pDepositAddresses : []).some(
      (a: any) => String(a?.address || "").trim().toLowerCase() === v
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssetTicker) {
      showToast.error("Please select an asset");
      return;
    }
    if (!selectedNetwork) {
      showToast.error("Please select a network");
      return;
    }
    if (!address.trim()) {
      showToast.error("Wallet address is required");
      return;
    }
    if (addressAlreadyExists) {
      showToast.error("This wallet address is already saved.");
      return;
    }
    if (address.trim().length >= 10 && !addressIsValid && !isValidating) {
      showToast.error("Please wait for address validation to complete");
      return;
    }
    if (addressIsInvalid) {
      showToast.error(validationResult?.message || "Invalid wallet address");
      return;
    }
    if (!accountName.trim()) {
      showToast.error("Account name is required");
      return;
    }

    if (!otpVerified) {
      showToast.error("Please verify the OTP sent to your email");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        createUserWalletAddress({
          address: address.trim(),
          account_name: accountName.trim(),
          label: "OMAYA Wallets",
          asset: selectedAssetTicker.toUpperCase(),
          network: selectedNetwork,
        }) as any
      );

      if (createUserWalletAddress.fulfilled.match(result)) {
        showToast.success("Wallet address added successfully!");
        handleClose();
        onSuccess?.();
      } else if (createUserWalletAddress.rejected.match(result)) {
        showToast.error(result.payload || "Failed to create wallet address");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedAssetTicker("");
    setSelectedNetwork("");
    setAddress("");
    setAccountName("");
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setOtpFeedback(null);
    setAssetSearch("");
    setAssetDropdownOpen(false);
    setNetworkDropdownOpen(false);
    resetValidation();
    onClose();
  };

  const getAssetImage = (a: SupportedAsset) =>
    getHighResAssetIcon(
      { ticker: a.ticker || a.symbol || a.name, image_url: a.image_url, asset_image: a.asset_image, image: (a as any)?.image },
      72
    );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Add Wallet Address
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2D33] text-gray-500 dark:text-[#8B90A5] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Asset dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
              Asset
            </label>
            <div className="relative" ref={assetDropdownRef}>
              <button
                ref={assetTriggerRef}
                type="button"
                onClick={() => {
                  setAssetDropdownOpen(!assetDropdownOpen);
                  setNetworkDropdownOpen(false);
                }}
                className="w-full cursor-pointer flex items-center justify-between dark:bg-[var(--card-color)] bg-white border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl px-4 py-3 text-left"
              >
                {selectedAssetTicker ? (
                  <div className="flex items-center gap-3">
                    {(() => {
                      const displayAsset =
                        selectedAsset ||
                        sortedExpressAssets.find(
                          (a) =>
                            a.ticker?.toUpperCase() ===
                            selectedAssetTicker.toUpperCase()
                        );
                      return displayAsset ? (
                        <>
                          <img
                            src={getAssetImage(displayAsset)}
                            alt={displayAsset.ticker}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/default-provider-logo.svg";
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {displayAsset.ticker?.toUpperCase()}
                              {selectedNetwork ? (
                                <span className="text-gray-500 dark:text-[#8C8CA1] font-normal">
                                  {" "}
                                  · {selectedNetwork}
                                </span>
                              ) : null}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">
                              {displayAsset.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedAssetTicker.toUpperCase()}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-[#5C6175]">
                    Select Asset
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-500 dark:text-[#8C8CA1] transition-transform ${
                    assetDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {assetDropdownOpen &&
                assetDropdownRect &&
                typeof document !== "undefined" &&
                createPortal(
                  <div
                    ref={assetPortalRef}
                    className="fixed z-[9999] bg-white dark:bg-[#18181D] border border-[#E3E6F0] dark:border-[#35353E] rounded-xl shadow-xl"
                    style={{
                      top: assetDropdownRect.top,
                      left: assetDropdownRect.left,
                      width: assetDropdownRect.width,
                      minWidth: 280,
                    }}
                  >
                    <div className="p-2 border-b border-[#E3E6F0] dark:border-[#35353E]">
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-gray-50 dark:bg-[#14141B] border border-[#E3E6F0] dark:border-[#35353E] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6E7081] outline-none focus:outline-none focus:ring-2 focus:ring-[#1D8751]/40"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {assetsListLoading && sortedExpressAssets.length === 0 && !assetLoadTimedOut ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          Loading tokens...
                        </div>
                      ) : assetLoadTimedOut && sortedExpressAssets.length === 0 ? (
                        <div className="px-4 py-3 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Failed to load assets.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAssetLoadTimedOut(false);
                              void withTimeout(dispatch(fetchAssets(true)).unwrap(), 15_000).catch(
                                () => {}
                              );
                              void withTimeout(
                                dispatch(
                                  fetchSupportedAssets({
                                    forceRefresh: true,
                                    feature: "exchange",
                                  })
                                ).unwrap(),
                                35_000
                              ).catch(() => {});
                            }}
                            className="text-sm font-medium text-[#1D8751] hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (assetSearch.trim() ? sortedFilteredBySearch : sortedExpressAssets)
                          .length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          {assetSearch.trim() ? "No matching assets" : "No assets available"}
                        </div>
                      ) : (
                        <>
                          {assetSearch.trim() ? (
                            sortedFilteredBySearch.map((a, idx) => {
                              const net = (a.network || getAssetNetwork(a) || "").trim();
                              const tick = (a.ticker || a.symbol || "").trim();
                              const rowSelected =
                                selectedAssetTicker?.toUpperCase() === tick.toUpperCase() &&
                                selectedNetwork?.toLowerCase() === net.toLowerCase();
                              return (
                                <div
                                  key={`search-${assetRowKey(a)}-${idx}`}
                                  onClick={() => {
                                    setSelectedAssetTicker(tick);
                                    setSelectedNetwork(net);
                                    setAssetDropdownOpen(false);
                                    setAssetSearch("");
                                  }}
                                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors ${
                                    rowSelected ? "bg-gray-200 dark:bg-[#23232B]" : ""
                                  }`}
                                >
                                  <img
                                    src={getAssetImage(a)}
                                    alt={tick}
                                    className="w-6 h-6 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/default-provider-logo.svg";
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {tick.toUpperCase()}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-[#8C8CA1] uppercase">
                                        {net}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-[#8C8CA1] truncate block">
                                      {a.name}
                                    </span>
                                  </div>
                                  {rowSelected ? (
                                    <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-[#8C8CA1] flex-shrink-0" />
                                  ) : null}
                                </div>
                              );
                            })
                          ) : (
                            <>
                              {popularAssets.length > 0 && (
                                <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
                                  Popular
                                </div>
                              )}
                              {popularAssets.map((a, idx) => {
                                const net = (a.network || getAssetNetwork(a) || "").trim();
                                const tick = (a.ticker || a.symbol || "").trim();
                                const rowSelected =
                                  selectedAssetTicker?.toUpperCase() === tick.toUpperCase() &&
                                  selectedNetwork?.toLowerCase() === net.toLowerCase();
                                return (
                                  <div
                                    key={`pop-${assetRowKey(a)}-${idx}`}
                                    onClick={() => {
                                      setSelectedAssetTicker(tick);
                                      setSelectedNetwork(net);
                                      setAssetDropdownOpen(false);
                                      setAssetSearch("");
                                    }}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors ${
                                      rowSelected ? "bg-gray-200 dark:bg-[#23232B]" : ""
                                    }`}
                                  >
                                    <img
                                      src={getAssetImage(a)}
                                      alt={tick}
                                      className="w-6 h-6 rounded-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "/default-provider-logo.svg";
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {tick.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-[#8C8CA1] uppercase">
                                          {net}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-[#8C8CA1] truncate block">
                                        {a.name}
                                      </span>
                                    </div>
                                    {rowSelected ? (
                                      <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-[#8C8CA1] flex-shrink-0" />
                                    ) : null}
                                  </div>
                                );
                              })}

                              {otherAssets.length > 0 && (
                                <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
                                  Others
                                </div>
                              )}
                              {otherAssets.map((a, idx) => {
                                const net = (a.network || getAssetNetwork(a) || "").trim();
                                const tick = (a.ticker || a.symbol || "").trim();
                                const rowSelected =
                                  selectedAssetTicker?.toUpperCase() === tick.toUpperCase() &&
                                  selectedNetwork?.toLowerCase() === net.toLowerCase();
                                return (
                                  <div
                                    key={`oth-${assetRowKey(a)}-${idx}`}
                                    onClick={() => {
                                      setSelectedAssetTicker(tick);
                                      setSelectedNetwork(net);
                                      setAssetDropdownOpen(false);
                                      setAssetSearch("");
                                    }}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors ${
                                      rowSelected ? "bg-gray-200 dark:bg-[#23232B]" : ""
                                    }`}
                                  >
                                    <img
                                      src={getAssetImage(a)}
                                      alt={tick}
                                      className="w-6 h-6 rounded-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "/default-provider-logo.svg";
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {tick.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-[#8C8CA1] uppercase">
                                          {net}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-[#8C8CA1] truncate block">
                                        {a.name}
                                      </span>
                                    </div>
                                    {rowSelected ? (
                                      <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-[#8C8CA1] flex-shrink-0" />
                                    ) : null}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </div>

          {/* 2. Network dropdown */}
          {selectedAssetTicker && networksForAsset.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
                Network
              </label>
              <div className="relative" ref={networkDropdownRef}>
                <button
                  ref={networkTriggerRef}
                  type="button"
                  onClick={() => {
                    setNetworkDropdownOpen(!networkDropdownOpen);
                    setAssetDropdownOpen(false);
                  }}
                  className="w-full cursor-pointer flex items-center justify-between dark:bg-[var(--card-color)] bg-white border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl px-4 py-3 text-left"
                >
                  {selectedNetwork ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-200 text-gray-900 dark:bg-[#23232B] dark:text-white text-xs px-2 py-0.5 rounded-full">
                        {selectedNetwork}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-[#5C6175]">
                      Select Network
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-500 dark:text-[#8C8CA1] transition-transform ${
                      networkDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {networkDropdownOpen &&
                  networkDropdownRect &&
                  typeof document !== "undefined" &&
                  createPortal(
                    <div
                      ref={networkPortalRef}
                      className="fixed z-[9999] bg-white dark:bg-[#18181D] border border-[#E3E6F0] dark:border-[#35353E] rounded-xl shadow-xl max-h-60 overflow-y-auto py-1"
                      style={{
                        top: networkDropdownRect.top,
                        left: networkDropdownRect.left,
                        width: networkDropdownRect.width,
                        minWidth: 280,
                      }}
                    >
                      {networksForAsset.map((n, idx) => (
                      <div
                        key={`${n.network}-${idx}`}
                        onClick={() => {
                          setSelectedNetwork(n.network);
                          setNetworkDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#14141B] transition-colors ${
                          selectedNetwork?.toLowerCase() ===
                          n.network?.toLowerCase()
                            ? "bg-gray-200 dark:bg-[#23232B]"
                            : ""
                        }`}
                      >
                        <img
                          src={getAssetImage(n)}
                          alt={n.network}
                          className="w-5 h-5 rounded-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/default-provider-logo.svg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {n.network}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-[#8C8CA1] ml-2">
                            {n.name}
                          </span>
                        </div>
                        {selectedNetwork?.toLowerCase() ===
                          n.network?.toLowerCase() && (
                          <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-[#8C8CA1] flex-shrink-0" />
                        )}
                      </div>
                    ))}
                    </div>,
                    document.body
                  )}
              </div>
            </div>
          )}

          {/* 3. Wallet address with live validation */}
          {selectedAsset && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
                Wallet Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Enter wallet address"
                  className={`w-full rounded-xl border pr-10 ${
                    addressAlreadyExists
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500/50"
                      : addressIsInvalid
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500/50"
                      : addressIsValid
                        ? "border-[#1D8751] dark:border-[#1D8751] focus:ring-[#1D8751]/50"
                        : "border-[#E3E6F0] dark:border-[#2A2A35] focus:ring-[#1D8751]/50"
                  } bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none focus:ring-2`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isValidating && (
                    <svg className="animate-spin h-4 w-4 text-[#1D8751]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {!isValidating && addressIsValid && (
                    <svg className="w-5 h-5 text-[#1D8751]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!isValidating && addressIsInvalid && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddress("");
                        resetValidation();
                      }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Clear address"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {addressIsInvalid && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                  {validationResult?.message || "Invalid wallet address"}
                </p>
              )}
              {addressAlreadyExists && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                  This wallet address is already saved.
                </p>
              )}
              {addressIsValid && (
                <p className="mt-1.5 text-xs text-[#1D8751]">
                  Address is valid
                </p>
              )}
            </div>
          )}

          {/* 4. Account name */}
          {selectedAsset && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#8B90A5] mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="My Main Wallet"
                className="w-full rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50"
                required
              />
            </div>
          )}

          {/* 5. Email OTP (required) */}
          {selectedAsset && (
            <div className="rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-gray-50/40 dark:bg-[#23232B]/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Email verification
                  </div>
                  <div className="text-xs text-gray-600 dark:text-[#8B90A5]">
                    We have send a 6-digit OTP to your email.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={
                    sendOtpLoading ||
                    verifyOtpLoading ||
                    !selectedAssetTicker ||
                    !selectedNetwork ||
                    !address.trim() ||
                    addressAlreadyExists ||
                    isValidating ||
                    !addressIsValid
                  }
                  className="shrink-0 px-3 py-2 rounded-lg border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751]/10 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendOtpLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtpVerified(false);
                    setOtpFeedback(null);
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  placeholder="Enter OTP"
                  className="flex-1 rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none focus:ring-2 focus:ring-[#1D8751]/50"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!otpSent || verifyOtpLoading || sendOtpLoading || otp.trim().length !== 6}
                  className="px-3 py-3 rounded-xl bg-[#1D8751] text-white font-semibold hover:bg-[#0f8f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyOtpLoading ? "Verifying..." : otpVerified ? "Verified" : "Verify"}
                </button>
              </div>

              {otpFeedback && (
                <div
                  className={`mt-2 text-xs font-medium ${
                    otpFeedback.type === "success"
                      ? "text-[#1D8751]"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {otpFeedback.text}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] text-gray-700 dark:text-[#8B90A5] font-medium hover:bg-gray-50 dark:hover:bg-[#2D2D33] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedAssetTicker ||
                !selectedNetwork ||
                !address.trim() ||
                addressAlreadyExists ||
                addressIsInvalid ||
                isValidating ||
                (address.trim().length >= 10 && !addressIsValid) ||
                !otpVerified
              }
              className="flex-1 px-4 py-3 rounded-xl bg-[#1D8751] text-white font-medium hover:bg-[#0f8f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Adding...
                </>
              ) : (
                "Add Address"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWalletAddressModal;
