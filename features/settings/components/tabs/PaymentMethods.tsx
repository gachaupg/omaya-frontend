import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchAdminPaymentMethods,
  fetchUserPaymentDetails,
  deleteUserPaymentDetail,
} from "@/features/p2p/slices/paymentMethodsSlice";
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
        <img
          src="/images/tether.svg"
          alt={addr.asset}
          className="w-12 h-12 object-contain flex-shrink-0"
          style={{ display: "block" }}
          onError={(e) => {
            e.currentTarget.src = "/default-provider-logo.svg";
          }}
        />
        {addr.status === "pending" && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FF4D55] border-2 border-white dark:border-[#13131A]" />
        )}
      </div>
      <div className="flex-1 flex items-center justify-between">
        <div>
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            {addr.account_name || addr.label}
          </p>
          <p className="text-xs text-gray-500 dark:text-[#8B90A5] mt-0.5">
            {addr.network} • {addr.asset} • {addr.status}
          </p>
        </div>
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

const PaymentMethods = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
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
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState("Approved");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'payment' | 'wallet', id: string } | null>(null);

  const isCryptoWallet = (p: UserPaymentDetail) =>
    p?.payment_method_name?.toLowerCase() === "crypto" ||
    !!p?.wallet_address;

  const filteredPayments = userPaymentDetails.filter(
    (payment: UserPaymentDetail) => {
      if (activeButton === "OMAYA Wallets") {
        return isCryptoWallet(payment);
      }
      return payment.status?.toLowerCase() === activeButton.toLowerCase();
    }
  );

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails() as any);
      dispatch(fetchAdminPaymentMethods() as any);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeButton === "OMAYA Wallets") {
      dispatch(fetchP2PDepositAddresses() as any);
      dispatch(fetchUserWalletAddresses() as any);
    }
  }, [dispatch, isAuthenticated, activeButton]);

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
      try {
        setDeletingMethodId(deleteTarget.id);
        await dispatch(deleteUserPaymentDetail(deleteTarget.id) as any);
        await dispatch(fetchUserPaymentDetails() as any);
      } finally {
        setDeletingMethodId(null);
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
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-2 sm:gap-3 mb-4">
        <div>
          <div className="text-sm sm:text-base font-semibold dark:text-white text-gray-900 mb-2">
            Wallet Address
          </div>
          <div className="flex gap-2">
            <button className={`px-3 py-1.5 rounded-full border border-[#1D8751] text-[#1D8751] text-xs sm:text-sm font-semibold focus:outline-none ${activeButton === "Approved" ? "bg-[#1D8751] text-white" : "bg-transparent"}`} onClick={() => setActiveButton("Approved")} >
              Approved
            </button>
            <button className={`px-3 py-1.5 rounded-full border border-[#1D8751] text-[#1D8751] text-xs sm:text-sm font-semibold focus:outline-none ${activeButton === "Pending" ? "bg-[#1D8751] text-white" : "bg-transparent"}`} onClick={() => setActiveButton("Pending")}>
              Pending
            </button>
            <button className={`px-3 py-1.5 rounded-full border border-[#1D8751] text-[#1D8751] text-xs sm:text-sm font-semibold focus:outline-none ${activeButton === "OMAYA Wallets" ? "bg-[#1D8751] text-white" : "bg-transparent"}`} onClick={() => setActiveButton("OMAYA Wallets")}>
              OMAYA.io Wallets
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            className="flex items-center gap-1 text-xs sm:text-sm dark:text-white text-gray-900 font-medium hover:underline focus:outline-none"
            onClick={() => setShowPaymentModal(true)}
          >
            Add Payment Method
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm sm:text-base font-bold dark:text-white text-gray-900">
            Payment Methods
          </p>
          {activeButton === "OMAYA Wallets" && (
            <button
              onClick={() => setShowAddWalletModal(true)}
              disabled={userWalletCreateLoading}
              className="flex items-center gap-1 text-sm sm:text-base text-[#1D8751] font-semibold hover:text-[#0f8f4d] disabled:opacity-50"
            >
              <span className="text-lg leading-none">+</span>
              Add New Address
            </button>
          )}
        </div>
        <div className="rounded-[32px] border border-[#20202A] dark:border-[#1E1E27] bg-white dark:bg-[var(--card-color)] p-2 sm:p-3 md:p-4 space-y-3">
          {activeButton === "OMAYA Wallets" ? (
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
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <img
                                src="/images/tether.svg"
                                alt="USDT"
                                className="w-12 h-12 object-contain flex-shrink-0"
                                style={{ display: "block" }}
                                onError={(e) => {
                                  e.currentTarget.src = "/default-provider-logo.svg";
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                                OMAYA Wallet
                              </p>
                              <p className="text-xs text-gray-500 dark:text-[#8B90A5] mt-0.5">
                                {addr.network_name || addr.chain} • {addr.is_default ? "Default" : ""}
                              </p>
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
                        ))}
                      </>
                    )}
                    {/* Add New Address button - visible when no default wallets */}
                    {p2pDepositAddresses.length === 0 && (
                      <button
                        onClick={() => setShowAddWalletModal(true)}
                        disabled={userWalletCreateLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-[28px] border-2 border-dashed border-[#1D8751] bg-[#1D8751]/5 dark:bg-[#1D8751]/10 py-4 px-4 text-[#1D8751] font-semibold hover:bg-[#1D8751]/10 dark:hover:bg-[#1D8751]/20 transition-colors disabled:opacity-50"
                      >
                        <span className="text-xl leading-none">+</span>
                        {userWalletCreateLoading ? "Adding..." : "Add New Address"}
                      </button>
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
                    {userWalletAddresses.length === 0 && p2pDepositAddresses.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#E3E6F0] dark:border-[#2A2A35] py-10 text-center text-sm text-gray-500 dark:text-[#7B819C]">
                        No OMAYA wallet addresses yet. Click &quot;Generate New Address&quot; or &quot;Add New Address&quot; to create one.
                      </div>
                    ) : userWalletAddresses.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#E3E6F0] dark:border-[#2A2A35] py-6 text-center text-sm text-gray-500 dark:text-[#7B819C]">
                        No custom addresses. Click &quot;Add New Address&quot; to add your own wallet.
                      </div>
                    ) : (
                      userWalletAddresses.map((addr: UserWalletAddress) => (
                        <WalletAddressCard
                          key={addr.user_wallet_address_id}
                          addr={addr}
                          onDelete={() => handleDeleteUserWallet(addr.user_wallet_address_id)}
                          isDeleting={userWalletDeleteLoading === addr.user_wallet_address_id}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {filteredPayments.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#E3E6F0] dark:border-[#2A2A35] py-10 text-center text-sm text-gray-500 dark:text-[#7B819C]">
                  No payment methods in {activeButton.toLowerCase()} state yet.
                </div>
              )}
              {filteredPayments.map((payment: UserPaymentDetail) => {
            const isPending = payment.status?.toLowerCase() === "pending";
            const isBankMethod =
              payment?.payment_method_name
                ?.toLowerCase()
                .includes("bank") ||
              payment?.payment_provider_name?.toLowerCase().includes("bank");
            const inputLabel = isBankMethod ? "Bank Account" : "Wallet Address";
            const placeholderText = isBankMethod
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
                    <img
                      src={payment?.provider_logo || (isCryptoWallet(payment) ? "/images/tether.svg" : "/default-provider-logo.svg")}
                      alt={payment?.payment_provider_name || payment?.payment_method_name}
                      className="w-12 h-12 object-contain flex-shrink-0"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        e.currentTarget.src = isCryptoWallet(payment) ? "/images/tether.svg" : "/default-provider-logo.svg";
                      }}
                    />
                    {isPending && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FF4D55] border-2 border-white dark:border-[#13131A]" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {payment?.payment_method_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#8B90A5] mt-0.5">
                        {payment?.payment_provider_name}
                      </p>
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
                      className="w-full bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#5C6175] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
            </>
          )}
        </div>
      </div>
      <PaymentMethodsModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onAdd={() => dispatch(fetchUserPaymentDetails() as any)}
      />
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
    </div>
  );
};

export default PaymentMethods;
