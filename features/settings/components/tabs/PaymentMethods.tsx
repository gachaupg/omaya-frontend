import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { consumePaymentModalPrefill } from "@/lib/utils/authRedirect";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchAdminPaymentMethods,
  fetchUserPaymentDetails,
  deleteUserPaymentDetail,
} from "@/features/p2p/slices/paymentMethodsSlice";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CreditCard, Wallet } from "lucide-react";
import {
  fetchP2PDepositAddresses,
  createP2PDepositAddress,
  clearCreateStatus,
} from "@/features/p2p/slices/p2pDepositAddressesSlice";
import {
  fetchUserWalletAddresses,
  deleteUserWalletAddress,
  clearCreateStatus as clearUserWalletCreateStatus,
} from "@/features/settings/slices/userWalletAddressesSlice";
import type { UserWalletAddress } from "@/features/settings/slices/userWalletAddressesSlice";
import { UserPaymentDetail } from "@/features/p2p/components/ui/p2pdashboard/sections/UserPaymentSelector";
import PaymentMethodsModal from "@/features/p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";
import AddWalletAddressModal from "./AddWalletAddressModal";
import { showToast } from "@/lib/utils/toast";
import CopyButton from "@/components/ui/CopyButton";
import QRCode from "qrcode";
import { getHighResAssetIcon } from "@/features/express/utils/imageHelpers";

const AddressQrImage: React.FC<{ value: string }> = ({ value }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      try {
        setHasError(false);
        const val = String(value || "").trim();
        if (!val) {
          setQrDataUrl(null);
          return;
        }

        const dataUrl = await QRCode.toDataURL(val, {
          width: 180,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to generate wallet QR:", err);
          setHasError(true);
          setQrDataUrl(null);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!qrDataUrl || hasError) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8751]/40"
        aria-label="Open QR code"
      >
        <img
          src={qrDataUrl}
          alt="Wallet QR"
          className="w-9 h-9 rounded-lg border border-[#E3E6F0] dark:border-[#2A2A35] bg-white object-contain"
        />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#18181D] border border-[#E3E6F0] dark:border-[#2A2A35] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Wallet QR
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2D33] text-gray-500 dark:text-[#8B90A5] transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={qrDataUrl}
                alt="Wallet QR large"
                className="w-72 h-72 rounded-xl border border-[#E3E6F0] dark:border-[#2A2A35] bg-white object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const WalletAddressCard = ({
  addr,
  onDelete,
  isDeleting,
}: {
  addr: UserWalletAddress;
  onDelete: () => void;
  isDeleting: boolean;
}) => (
  <div className="flex flex-col gap-3 rounded-[28px] border border-[#E3E6F0] dark:border-[#2A2A35] bg-gray-50 dark:bg-[var(--card-color)] px-4 py-4">
    <div className="flex items-start gap-4">
      <div className="relative">
        <span className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-white dark:bg-[#1F2432]">
          <img
            src={addr.asset_details?.image || "/images/tether.svg"}
            alt={addr.asset}
            className="w-full h-full object-cover"
            style={{ display: "block" }}
            onError={(e) => {
              e.currentTarget.src = "/default-provider-logo.svg";
            }}
          />
        </span>
      </div>
      <div className="flex-1 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            {addr.account_name || addr.label}
          </p>
          <p className="text-xs text-gray-500 dark:text-[#8B90A5] mt-0.5">
            {addr.network} • {addr.asset}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!!addr.address && <AddressQrImage value={addr.address} />}
          <button
            className="text-[#1D8751] hover:text-red-500 transition-colors"
            title="Delete"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1D8751" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="#1D8751" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
    <div>
      <label className="text-xs font-medium text-gray-500 dark:text-[#8B90A5] mb-2 block">
        Wallet address
      </label>
      <div className="rounded-full border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-2 flex items-center gap-2 text-sm">
        <input
          type="text"
          readOnly
          value={addr.address}
          className="flex-1 bg-transparent focus:outline-none text-gray-900 dark:text-white"
        />
        <CopyButton value={addr.address} />
      </div>
    </div>
  </div>
);

const ITEMS_PER_PAGE = 5;

const PaymentMethods = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const hasAppliedRedirectPrefill = useRef(false);
  const {
    userPaymentDetails,
    userDetailsLoading,
    adminMethods,
    loading: adminLoading,
  } = useSelector((state: RootState) => state.paymentMethods);
  const { postOrderLoading, postOrderError, postOrderSuccess } = useSelector(
    (state: RootState) => state.p2pAds
  );
  const {
    addresses: p2pDepositAddresses,
    loading: p2pAddressesLoading,
    createLoading: p2pCreateLoading,
    createError: p2pCreateError,
    createSuccess: p2pCreateSuccess,
  } = useSelector((state: RootState) => state.p2pDepositAddresses);
  const {
    addresses: userWalletAddresses,
    loading: userWalletAddressesLoading,
    createLoading: userWalletCreateLoading,
    createError: userWalletCreateError,
    createSuccess: userWalletCreateSuccess,
    deleteLoading: userWalletDeleteLoading,
  } = useSelector((state: RootState) => state.userWalletAddresses);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalFilterProvider, setModalFilterProvider] = useState<string | undefined>();
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [mainSection, setMainSection] = useState<"payment-methods" | "omaya-wallets">("payment-methods");
  const [bankTab, setBankTab] = useState<"pending" | "approved" | "rejected">("approved");
  const [cryptoDropdownOpen, setCryptoDropdownOpen] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'payment' | 'wallet', id: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletSearchQuery, setWalletSearchQuery] = useState("");

  const isForexDetail = (p: UserPaymentDetail) => {
    const method = String(p?.payment_method_name || "").toLowerCase();
    const provider = String(p?.payment_provider_name || (p as any)?.provider_name || "").toLowerCase();
    // Forex entries may include wallet_address (backend validation), but are not crypto wallets.
    return method.includes("forex") || provider.includes("forex") || provider.replace(/\s+/g, "").includes("fxprimus");
  };

  const isCryptoWallet = (p: UserPaymentDetail) => {
    const method = String(p?.payment_method_name || "").toLowerCase();
    // Wallet-address based details are usually crypto, but Forex brokers can also send wallet_address.
    if (isForexDetail(p)) return false;
    return method === "crypto" || method.includes("crypto") || !!p?.wallet_address;
  };

  const isBankAccount = (p: UserPaymentDetail) => {
    const name = (p?.payment_method_name || p?.payment_provider_name || "").toLowerCase();
    return name.includes("bank");
  };

  // Normalize status into explicit buckets.
  const getStatusCategory = (p: UserPaymentDetail): "pending" | "approved" | "rejected" => {
    const s = (p.status || "").toString().trim().toLowerCase();
    if (s === "approved") return "approved";
    if (s === "rejected") return "rejected";
    return "pending";
  };

  // All linked P2P payment details (bank, mobile money, forex, and crypto wallets).
  const allPaymentMethodsWithStatus = useMemo(
    () => (Array.isArray(userPaymentDetails) ? [...userPaymentDetails] : []),
    [userPaymentDetails]
  );

  const bankPending = useMemo(
    () => allPaymentMethodsWithStatus.filter((p) => getStatusCategory(p) === "pending"),
    [allPaymentMethodsWithStatus]
  );
  const bankApproved = useMemo(
    () => allPaymentMethodsWithStatus.filter((p) => getStatusCategory(p) === "approved"),
    [allPaymentMethodsWithStatus]
  );
  const bankRejected = useMemo(
    () => allPaymentMethodsWithStatus.filter((p) => getStatusCategory(p) === "rejected"),
    [allPaymentMethodsWithStatus]
  );

  const bankByTab =
    bankTab === "pending"
      ? bankPending
      : bankTab === "rejected"
      ? bankRejected
      : bankApproved;

  const prioritizedBankByTab = useMemo(() => {
    const rows = [...bankByTab];
    const getProvider = (p: UserPaymentDetail) =>
      String(p?.payment_provider_name || (p as any)?.provider_name || "").trim().toLowerCase();
    const isEdahab = (p: UserPaymentDetail) => {
      const v = getProvider(p).replace(/\s+/g, "");
      // exact-ish match first, then fallback contains
      return v === "edahab" || v === "edahabwallet" || v.includes("edahab");
    };
    const getCreatedAt = (p: UserPaymentDetail) => {
      const raw = (p as any)?.created_at || (p as any)?.createdAt || "";
      const t = Date.parse(String(raw));
      return Number.isFinite(t) ? t : 0;
    };
    rows.sort((a, b) => {
      const aTop = isEdahab(a) ? 0 : 1;
      const bTop = isEdahab(b) ? 0 : 1;
      if (aTop !== bTop) return aTop - bTop;
      // Stable-ish: newest first within the same priority.
      return getCreatedAt(b) - getCreatedAt(a);
    });
    return rows;
  }, [bankByTab]);

  const totalPaymentPages = Math.max(
    1,
    Math.ceil(prioritizedBankByTab.length / ITEMS_PER_PAGE)
  );
  const paginatedBankPayments = useMemo(
    () =>
      prioritizedBankByTab.slice(
        (paymentPage - 1) * ITEMS_PER_PAGE,
        paymentPage * ITEMS_PER_PAGE
      ),
    [prioritizedBankByTab, paymentPage]
  );

  useEffect(() => {
    setPaymentPage(1);
  }, [bankTab]);

  useEffect(() => {
    const maxPage = Math.max(1, totalPaymentPages);
    setPaymentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [totalPaymentPages]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails() as any);
      dispatch(fetchAdminPaymentMethods() as any);
    }
  }, [dispatch, isAuthenticated]);

  // Open add payment modal when returning from login redirect (from home withdrawal "Register Now")
  useEffect(() => {
    if (!isAuthenticated || hasAppliedRedirectPrefill.current) return;
    const openAdd = searchParams?.get("openAddModal") === "1";
    if (!openAdd) return;
    const prefillFromUrl = {
      method: searchParams?.get("method") || undefined,
      provider: searchParams?.get("provider") || undefined,
    };
    const prefill = (prefillFromUrl.method || prefillFromUrl.provider)
      ? prefillFromUrl
      : consumePaymentModalPrefill();
    if (!prefill?.method && !prefill?.provider) return;
    hasAppliedRedirectPrefill.current = true;
    if (prefill.provider) setModalFilterProvider(prefill.provider);
    setShowPaymentModal(true);
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (isAuthenticated && mainSection === "omaya-wallets") {
      dispatch(fetchP2PDepositAddresses() as any);
      dispatch(fetchUserWalletAddresses() as any);
    }
  }, [dispatch, isAuthenticated, mainSection]);

  const handleGenerateAddress = () => {
    dispatch(createP2PDepositAddress({ asset: "USDT", network: "BSC" }) as any);
  };

  React.useEffect(() => {
    if (p2pCreateError) {
      showToast.error(p2pCreateError);
      dispatch(clearCreateStatus());
    }
  }, [p2pCreateError, dispatch]);

  React.useEffect(() => {
    if (p2pCreateSuccess) {
      showToast.success("New OMAYA wallet address generated successfully!");
      dispatch(clearCreateStatus());
    }
  }, [p2pCreateSuccess, dispatch]);

  React.useEffect(() => {
    if (userWalletCreateError) {
      showToast.error(userWalletCreateError);
      dispatch(clearUserWalletCreateStatus());
    }
  }, [userWalletCreateError, dispatch]);

  React.useEffect(() => {
    if (userWalletCreateSuccess) {
      dispatch(clearUserWalletCreateStatus());
    }
  }, [userWalletCreateSuccess, dispatch]);

  const handleDeleteUserWallet = async (uuid: string) => {
    setDeleteTarget({ type: 'wallet', id: uuid });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'wallet') {
      const result = await dispatch(deleteUserWalletAddress(deleteTarget.id) as any);
      if (deleteUserWalletAddress.fulfilled.match(result)) {
        showToast.success("Wallet address deleted successfully.");
      } else if (deleteUserWalletAddress.rejected.match(result)) {
        showToast.error(result.payload || "Failed to delete wallet address");
      }
    } else if (deleteTarget.type === 'payment') {
      setDeletingMethodId(deleteTarget.id);
      const result = await dispatch(deleteUserPaymentDetail(deleteTarget.id) as any);
      setDeletingMethodId(null);

      if (deleteUserPaymentDetail.fulfilled.match(result)) {
        await dispatch(fetchUserPaymentDetails() as any);
        showToast.success("Payment method deleted successfully");
      } else if (deleteUserPaymentDetail.rejected.match(result)) {
        setErrorMessage((result.payload as string) || "Failed to delete payment method");
      }
    }

    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleDeleteMethod = async (methodId: string) => {
    setDeleteTarget({ type: 'payment', id: methodId });
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-1 sm:p-2 md:p-4 dark:text-white text-gray-900 w-full">
      {/* Top Header: Two main sections */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-2 sm:gap-3 mb-4">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold focus:outline-none transition-colors ${mainSection === "payment-methods" ? "bg-[#1D8751] text-white border-[#1D8751]" : "border-[#1D8751] text-[#1D8751] bg-transparent hover:bg-[#1D8751]/10"}`}
            onClick={() => setMainSection("payment-methods")}
          >
            Payment Methods
          </button>
          <button
            className={`px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold focus:outline-none transition-colors ${mainSection === "omaya-wallets" ? "bg-[#1D8751] text-white border-[#1D8751]" : "border-[#1D8751] text-[#1D8751] bg-transparent hover:bg-[#1D8751]/10"}`}
            onClick={() => setMainSection("omaya-wallets")}
          >
            My Omaya Wallets
          </button>
        </div>
        {mainSection === "payment-methods" && (
          <button
            className="flex items-center gap-1 text-xs sm:text-sm dark:text-white text-gray-900 font-medium hover:underline focus:outline-none"
            onClick={() => setShowPaymentModal(true)}
          >
             New Payment Method
            <span className="text-lg leading-none">+</span>
          </button>
        )}
      </div>
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm sm:text-base font-bold dark:text-white text-gray-900">
            Payment Methods
          </p>
        </div>
        <div className="rounded-[32px] border border-[#20202A] dark:border-[#1E1E27] bg-white dark:bg-[var(--card-color)] p-2 sm:p-3 md:p-4 space-y-3">
          {mainSection === "omaya-wallets" ? (
            <>
              {(p2pAddressesLoading || userWalletAddressesLoading) ? (
                <div className="rounded-2xl border border-dashed border-[#E3E6F0] dark:border-[#2A2A35] py-10 text-center text-sm text-gray-500 dark:text-[#7B819C]">
                  Loading OMAYA wallet addresses...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Default Wallets (Generated) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
                        Default Wallets
                      </p>
                    </div>
                    {p2pDepositAddresses.length > 0 && (
                      <>
                        {p2pDepositAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="flex flex-col gap-3 rounded-[28px] border border-[#E3E6F0] dark:border-[#2A2A35] bg-gray-50 dark:bg-[var(--card-color)] px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="relative">
                                  <span className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-white dark:bg-[#1F2432]">
                                    <img
                                      src="/images/tether.svg"
                                      alt="USDT"
                                      className="w-full h-full object-cover"
                                      style={{ display: "block" }}
                                      onError={(e) => {
                                        e.currentTarget.src = "/default-provider-logo.svg";
                                      }}
                                    />
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                                    OMAYA Wallet
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-xs text-gray-500 dark:text-[#8B90A5]">
                                      {addr.network_name || addr.chain}
                                    </span>
                                    {addr.address_type && (
                                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-[#1D8751]/15 text-[#1D8751] dark:bg-[#1D8751]/25 dark:text-[#34D399] border border-[#1D8751]/30">
                                        {addr.address_type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {!!addr.address && (
                                <AddressQrImage value={addr.address} />
                              )}
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 dark:text-[#8B90A5] mb-2 block">
                                Wallet address
                              </label>
                              <div className="rounded-full border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-2 flex items-center gap-2 text-sm">
                                <input
                                  type="text"
                                  readOnly
                                  value={addr.address}
                                  className="flex-1 bg-transparent focus:outline-none text-gray-900 dark:text-white"
                                />
                                <CopyButton value={addr.address} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* User Added Addresses */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 dark:text-[#8B90A5] uppercase tracking-wide">
                        Your Addresses
                      </p>
                      <button
                        onClick={() => setShowAddWalletModal(true)}
                        disabled={userWalletCreateLoading}
                        className="text-xs sm:text-sm text-[#1D8751] hover:text-[#0f8f4d] font-medium disabled:opacity-50"
                      >
                        {userWalletCreateLoading ? "Adding..." : "+ Add New Address"}
                      </button>
                    </div>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={walletSearchQuery}
                        onChange={(e) => setWalletSearchQuery(e.target.value)}
                        placeholder="Search address or label in your OMAYA wallets"
                        className="w-full rounded-full border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#5C6175] focus:outline-none"
                      />
                    </div>
                    {userWalletAddresses.length > 0 &&
                      userWalletAddresses
                        .filter((addr: UserWalletAddress) => {
                          if (!walletSearchQuery.trim()) return true;
                          const q = walletSearchQuery.toLowerCase();
                          const label =
                            addr.account_name ||
                            addr.label ||
                            "";
                          return (
                            addr.address.toLowerCase().includes(q) ||
                            label.toLowerCase().includes(q)
                          );
                        })
                        .map((addr: UserWalletAddress) => (
                        <WalletAddressCard
                          key={addr.user_wallet_address_id}
                          addr={addr}
                          onDelete={() => handleDeleteUserWallet(addr.user_wallet_address_id)}
                          isDeleting={userWalletDeleteLoading === addr.user_wallet_address_id}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Bank accounts: Pending / Approved tabs */}
              <div className="flex gap-2 mb-4">
                <button className={`px-3 py-1.5 rounded-full border border-[#1D8751] text-[#1D8751] text-xs sm:text-sm font-semibold focus:outline-none ${bankTab === "approved" ? "bg-[#1D8751] text-white" : "bg-transparent"}`} onClick={() => setBankTab("approved")}>
                  Approved
                </button>
                <button className={`px-3 py-1.5 rounded-full border border-[#1D8751] text-[#1D8751] text-xs sm:text-sm font-semibold focus:outline-none ${bankTab === "pending" ? "bg-[#1D8751] text-white" : "bg-transparent"}`} onClick={() => setBankTab("pending")}>
                  Pending
                </button>
                <button className={`px-3 py-1.5 rounded-full border border-[#1D8751] text-[#1D8751] text-xs sm:text-sm font-semibold focus:outline-none ${bankTab === "rejected" ? "bg-[#1D8751] text-white" : "bg-transparent"}`} onClick={() => setBankTab("rejected")}>
                  Rejected
                </button>
              </div>
              {bankByTab.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#E3E6F0] dark:border-[#2A2A35] py-10 text-center text-sm text-gray-500 dark:text-[#7B819C]">
                  No payment methods yet. Add one via Linked Accounts.
                </div>
              )}
              {paginatedBankPayments.map((payment: UserPaymentDetail) => {
                const statusCategory = getStatusCategory(payment);
                const isPending = statusCategory === "pending";
                const isRejected = statusCategory === "rejected";
                const isForex = isForexDetail(payment);
                const isBankMethod =
                  (payment?.payment_method_name || "").toLowerCase().includes("bank") ||
                  (payment?.payment_provider_name || "").toLowerCase().includes("bank");
                const rejectionMessageRaw = String(
                  payment?.rejection_reason ??
                    (payment as any)?.rejectionReason ??
                    (payment as any)?.reason ??
                    (payment as any)?.comment ??
                    (payment as any)?.note ??
                    ""
                ).trim();
                const rejectionMessage = rejectionMessageRaw || "No rejection reason provided.";
                const inputLabel = isForex ? "MT4/MT5 Number" : isBankMethod ? "Bank Account" : "Wallet Address";
                const placeholderText = isForex
                  ? "Enter MT4/MT5 number"
                  : isBankMethod
                    ? "Type in here your bank account number"
                    : "Type in here your wallet address";
                // For crypto: use wallet_address; for bank: use account_number
                const displayAddress =
                  payment?.wallet_address || payment?.account_number || "";
                return (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-3 rounded-[28px] border border-[#E3E6F0] dark:border-[#2A2A35] bg-gray-50 dark:bg-[var(--card-color)] px-4 py-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <span className=" overflow-hidden flex-shrink-0 bg-white dark:bg-[#1F2432]">
                          <img
                            src={
                              isCryptoWallet(payment)
                                ? getHighResAssetIcon({ ticker: "USDT" }, 80)
                                : payment?.provider_logo || "/default-provider-logo.svg"
                            }
                            alt={payment?.payment_provider_name || payment?.payment_method_name}
                            className={`w-10 h-10 rounded-full object-cover ${isCryptoWallet(payment) ? "object-contain bg-white dark:bg-[#1F2432]" : ""}`}
                            style={{ display: 'block' }}
                            onError={(e) => {
                              e.currentTarget.src = isCryptoWallet(payment)
                                ? "/images/tether.svg"
                                : "/default-provider-logo.svg";
                            }}
                          />
                        </span>
                        {isPending && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF4D55] border border-white dark:border-[#13131A]" />
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                              {payment?.payment_provider_name ||
                                (payment as any)?.provider_name ||
                                payment?.payment_method_name ||
                                "Payment Method"}
                            </p>
                            {/* account_name intentionally hidden to avoid repetition */}
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold capitalize ${
                                isPending
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                                  : isRejected
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                              }`}
                            >
                              {isPending ? "Pending" : isRejected ? "Rejected" : "Approved"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-[#8B90A5] mt-0.5">
                            {isBankMethod
                              ? (payment?.payment_method_name || "Bank")
                              : (payment?.payment_method_name || "Wallet")}
                          </p>
                          {(payment?.account_name || "").trim() && !isBankMethod ? (
                            <p className="text-xs text-gray-700 dark:text-gray-200 mt-1 font-medium">
                              {payment.account_name}
                            </p>
                          ) : null}
                          {isRejected && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400 max-w-[520px]">
                              {rejectionMessage}
                            </p>
                          )}
                        </div>
                        <button
                          className="text-[#1D8751] hover:text-red-500 transition-colors"
                          title="Delete"
                          disabled={deletingMethodId === payment.id.toString()}
                          onClick={() => handleDeleteMethod(payment.id.toString())}
                        >
                          {deletingMethodId === payment.id.toString() ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="#1D8751"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="#1D8751"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 cursor-pointer"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-[#8B90A5] mb-2 block">
                        {inputLabel}
                      </label>
                      <div className="rounded-full border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[var(--card-color)] px-4 py-2 flex items-center text-sm text-gray-500 dark:text-[#8890A6]">
                        <input
                          type="text"
                          readOnly
                          value={displayAddress}
                          placeholder={placeholderText}
                          className={`w-full bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#5C6175] text-gray-900 dark:text-white ${
                            isCryptoWallet(payment) ? "font-mono text-xs sm:text-sm break-all" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {bankByTab.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-[#E3E6F0] dark:border-[#2A2A35]">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#8B90A5]">
                    Showing {(paymentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(paymentPage * ITEMS_PER_PAGE, bankByTab.length)} of {bankByTab.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                      disabled={paymentPage <= 1}
                      className="p-2 rounded-lg border border-[#E3E6F0] dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B] disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPaymentPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setPaymentPage(page)}
                        className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium border transition-colors ${
                          paymentPage === page
                            ? "bg-[#1D8751] text-white border-[#1D8751]"
                            : "border-[#E3E6F0] dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B]"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
                      disabled={paymentPage >= totalPaymentPages}
                      className="p-2 rounded-lg border border-[#E3E6F0] dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23232B] disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showPaymentModal && (
        <PaymentMethodsModal
          key="add-payment-modal"
          open={true}
          onClose={() => {
            setShowPaymentModal(false);
            setModalFilterProvider(undefined);
            const params = new URLSearchParams(searchParams?.toString() || "");
            if (params.has("openAddModal") || params.has("method") || params.has("provider")) {
              params.delete("openAddModal");
              params.delete("method");
              params.delete("provider");
              const qs = params.toString();
              router.replace(window.location.pathname + (qs ? `?${qs}` : ""));
            }
          }}
          onAdd={() => dispatch(fetchUserPaymentDetails() as any)}
          onAddSuccess={() => {
            setShowPaymentModal(false);
            setModalFilterProvider(undefined);
            dispatch(fetchUserPaymentDetails() as any);
          }}
          filterByProviderName={modalFilterProvider}
        />
      )}
      <AddWalletAddressModal
        open={showAddWalletModal}
        onClose={() => setShowAddWalletModal(false)}
        onSuccess={() => dispatch(fetchUserWalletAddresses() as any)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1D1D23] rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-[#35353E]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this {deleteTarget?.type === 'wallet' ? 'wallet address' : 'payment method'}? This action is permanent and cannot be reversed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#23232B] text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#2A2A35] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1D1D23] rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-[#35353E]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Action Failed
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {errorMessage}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setErrorMessage(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1D8751] hover:bg-[#156b3f] text-white font-medium transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
