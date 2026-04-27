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
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { showToast } from "@/lib/utils/toast";
import type { SupportedAsset } from "@/features/swap/types";
import { getHighResAssetIcon } from "@/features/express/utils/imageHelpers";
import {
  sendPaymentDetailAddOtp,
  verifyPaymentDetailAddOtp,
} from "@/features/p2p/api";

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
  const { supportedAssets, loading: swapLoading } = useSelector(
    (s: RootState) => s.swap
  );
  const { assets: exchangeAssetsResponse } = useSelector(
    (s: RootState) => s.exchange
  );
  const { addresses: existingWalletAddresses } = useSelector(
    (s: RootState) => s.userWalletAddresses
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

  // Merge swap-supported assets with exchange assets (same list used by dashboard),
  // so assets like FXP/FXPRIMUS show in this dropdown too.
  const exchangeAssetsFlat: SupportedAsset[] = useMemo(() => {
    const rows = exchangeAssetsResponse?.assets;
    const assets = Array.isArray(rows) ? rows : [];
    const out: SupportedAsset[] = [];
    for (const a of assets as any[]) {
      const ticker = a?.ticker || a?.symbol || a?.name;
      const name = a?.name || a?.ticker || a?.symbol;
      const image =
        a?.image_url || a?.asset_image || a?.image || a?.icon_url || a?.icon;
      const networks = Array.isArray(a?.networks) ? a.networks : [];
      if (networks.length > 0) {
        for (const n of networks as any[]) {
          out.push({
            ticker,
            symbol: a?.symbol || ticker,
            name,
            network: n?.network_type || n?.network_id || n?.network || "",
            image_url: image,
            asset_image: image,
          } as any);
        }
      } else {
        out.push({
          ticker,
          symbol: a?.symbol || ticker,
          name,
          network: a?.network || "",
          image_url: image,
          asset_image: image,
        } as any);
      }
    }
    return out;
  }, [exchangeAssetsResponse]);

  const allAssets: SupportedAsset[] = useMemo(() => {
    const swap = supportedAssets ?? [];
    return [...swap, ...exchangeAssetsFlat];
  }, [supportedAssets, exchangeAssetsFlat]);

  // Deduplicate assets by ticker for the asset dropdown (networks shown separately)
  const uniqueAssets = useMemo(() => {
    const seen = new Map<string, SupportedAsset>();
    for (const a of allAssets) {
      const key = a.ticker?.toUpperCase();
      if (key && !seen.has(key)) {
        seen.set(key, a);
      }
    }
    return Array.from(seen.values());
  }, [allAssets]);

  // Get all network variations for the selected ticker
  const networksForAsset = useMemo(() => {
    if (!selectedAssetTicker) return [];
    return allAssets.filter(
      (a) => a.ticker?.toUpperCase() === selectedAssetTicker.toUpperCase()
    );
  }, [allAssets, selectedAssetTicker]);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetTicker || !selectedNetwork) return null;
    return (
      allAssets.find(
        (a) =>
          a.ticker?.toUpperCase() === selectedAssetTicker.toUpperCase() &&
          a.network?.toLowerCase() === selectedNetwork.toLowerCase()
      ) ?? null
    );
  }, [allAssets, selectedAssetTicker, selectedNetwork]);

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
    if (open && allAssets.length === 0 && !swapLoading) {
      setAssetLoadTimedOut(false);
      dispatch(fetchSupportedAssets(false) as any);
    }
  }, [open, allAssets.length, swapLoading, dispatch]);

  useEffect(() => {
    if (open) {
      dispatch(fetchAssets(false) as any);
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open) {
      dispatch(fetchUserWalletAddresses() as any);
    }
  }, [open, dispatch]);

  // Timeout: if loading for 8+ seconds with no assets, show retry
  useEffect(() => {
    if (!open || !swapLoading || allAssets.length > 0) {
      setAssetLoadTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setAssetLoadTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [open, swapLoading, allAssets.length]);

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
    setAddress(value);
    if (value.trim() && currencyForValidation) {
      validate(value, currencyForValidation, networkForValidation);
    } else {
      resetValidation();
    }
  };

  const handleSendOtp = async () => {
    if (sendOtpLoading || verifyOtpLoading) return;
    setOtpFeedback(null);
    setSendOtpLoading(true);
    try {
      await sendPaymentDetailAddOtp();
      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");
      setOtpFeedback({ type: "success", text: "OTP sent to your email." });
    } catch (err: any) {
      setOtpFeedback({
        type: "error",
        text: err?.message || "Failed to send OTP",
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
      setOtpFeedback({
        type: "error",
        text: err?.message || "Invalid OTP",
      });
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const addressIsValid = validationResult?.isValid === true;
  const addressIsInvalid =
    validationResult !== null && validationResult.isValid === false;

  const addressAlreadyExists = useMemo(() => {
    const v = address.trim().toLowerCase();
    if (!v) return false;
    const assetKey = selectedAssetTicker.trim().toUpperCase();
    const networkKey = selectedNetwork.trim().toLowerCase();
    return (existingWalletAddresses || []).some((a) => {
      const aAddr = String(a?.address || "").trim().toLowerCase();
      if (!aAddr || aAddr !== v) return false;
      // If user hasn't selected asset/network yet, treat it as duplicate anyway.
      if (!assetKey && !networkKey) return true;
      const aAsset = String(a?.asset || "").trim().toUpperCase();
      const aNet = String(a?.network || "").trim().toLowerCase();
      const assetMatches = assetKey ? aAsset === assetKey : true;
      const netMatches = networkKey ? aNet === networkKey : true;
      return assetMatches && netMatches;
    });
  }, [address, existingWalletAddresses, selectedAssetTicker, selectedNetwork]);

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

  if (!open) return null;

  const filteredAssets = uniqueAssets.filter((a) => {
    if (!assetSearch.trim()) return true;
    const q = assetSearch.toLowerCase();
    return (
      a.ticker?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.symbol?.toLowerCase().includes(q)
    );
  });

  const getAssetImage = (a: SupportedAsset) =>
    getHighResAssetIcon(
      { ticker: a.ticker || a.symbol || a.name, image_url: a.image_url, asset_image: a.asset_image, image: (a as any)?.image },
      72
    );

  // Popular assets for "Add Crypto Address" (ticker dropdown is deduped by ticker).
  // Keep FXP as a single entry (avoid FXP/FXPRIMUS duplicates).
  const POPULAR_TICKERS = ["USDT", "USDC", "FXP"];
  const normalizePopularTicker = (v: unknown) => {
    const t = String(v || "").trim().toUpperCase();
    if (!t) return "";
    if (t === "FXPRIMUS") return "FXP";
    return t;
  };
  const popularAssets = assetSearch.trim()
    ? []
    : filteredAssets.filter((a) =>
        POPULAR_TICKERS.includes(normalizePopularTicker(a.ticker || a.symbol))
      );
  const otherAssets = assetSearch.trim()
    ? filteredAssets
    : filteredAssets.filter(
        (a) =>
          !POPULAR_TICKERS.includes(normalizePopularTicker(a.ticker || a.symbol))
      );

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
                      const displayAsset = uniqueAssets.find(
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
                    className="fixed z-[9999] bg-white dark:bg-[var(--card-color)] border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl shadow-xl"
                    style={{
                      top: assetDropdownRect.top,
                      left: assetDropdownRect.left,
                      width: assetDropdownRect.width,
                      minWidth: 280,
                    }}
                  >
                    <div className="p-2 border-b border-[#E3E6F0] dark:border-[#2A2A35]">
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-gray-50 dark:bg-[#23232B] border border-[#E3E6F0] dark:border-[#2A2A35] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {swapLoading && filteredAssets.length === 0 && !assetLoadTimedOut ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          Loading tokens...
                        </div>
                      ) : assetLoadTimedOut && filteredAssets.length === 0 ? (
                        <div className="px-4 py-3 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Failed to load assets.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAssetLoadTimedOut(false);
                              dispatch(fetchSupportedAssets(true) as any);
                            }}
                            className="text-sm font-medium text-[#1D8751] hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : filteredAssets.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          {assetSearch.trim() ? "No matching assets" : "No assets available"}
                        </div>
                      ) : (
                        <>
                          {!assetSearch.trim() && popularAssets.length > 0 && (
                            <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
                              Popular
                            </div>
                          )}
                          {(assetSearch.trim() ? otherAssets : popularAssets).map((a, idx) => (
                            <div
                              key={`pop-${a.ticker}-${idx}`}
                              onClick={() => {
                                setSelectedAssetTicker(a.ticker);
                                setAssetDropdownOpen(false);
                                setAssetSearch("");
                              }}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors ${
                                selectedAssetTicker?.toUpperCase() ===
                                a.ticker?.toUpperCase()
                                  ? "bg-[#1D8751]/5"
                                  : ""
                              }`}
                            >
                              <img
                                src={getAssetImage(a)}
                                alt={a.ticker}
                                className="w-6 h-6 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/default-provider-logo.svg";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {a.ticker?.toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-[#8C8CA1] truncate block">
                                  {a.name}
                                </span>
                              </div>
                              {selectedAssetTicker?.toUpperCase() ===
                                a.ticker?.toUpperCase() && (
                                <div className="w-2 h-2 rounded-full bg-[#1D8751] flex-shrink-0" />
                              )}
                            </div>
                          ))}

                          {!assetSearch.trim() && otherAssets.length > 0 && (
                            <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
                              Others
                            </div>
                          )}
                          {!assetSearch.trim() &&
                            otherAssets.map((a, idx) => (
                              <div
                                key={`all-${a.ticker}-${idx}`}
                                onClick={() => {
                                  setSelectedAssetTicker(a.ticker);
                                  setAssetDropdownOpen(false);
                                  setAssetSearch("");
                                }}
                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors ${
                                  selectedAssetTicker?.toUpperCase() ===
                                  a.ticker?.toUpperCase()
                                    ? "bg-[#1D8751]/5"
                                    : ""
                                }`}
                              >
                                <img
                                  src={getAssetImage(a)}
                                  alt={a.ticker}
                                  className="w-6 h-6 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/default-provider-logo.svg";
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {a.ticker?.toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-[#8C8CA1] truncate block">
                                    {a.name}
                                  </span>
                                </div>
                                {selectedAssetTicker?.toUpperCase() ===
                                  a.ticker?.toUpperCase() && (
                                  <div className="w-2 h-2 rounded-full bg-[#1D8751] flex-shrink-0" />
                                )}
                              </div>
                            ))}
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
                      <span className="bg-[#1D8751] text-white text-xs px-2 py-0.5 rounded-full">
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
                      className="fixed z-[9999] bg-white dark:bg-[var(--card-color)] border border-[#E3E6F0] dark:border-[#2A2A35] rounded-xl shadow-xl max-h-60 overflow-y-auto py-1"
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
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#23232B] transition-colors ${
                          selectedNetwork?.toLowerCase() ===
                          n.network?.toLowerCase()
                            ? "bg-[#1D8751]/5"
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
                          <div className="w-2 h-2 rounded-full bg-[#1D8751] flex-shrink-0" />
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
                    We&apos;ll send a 6-digit OTP to your email.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendOtpLoading || verifyOtpLoading}
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
