import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import {
  fetchAdminPaymentMethods,
  fetchUserPaymentDetails,
  deleteUserPaymentDetail,
} from "@/features/p2p/slices/paymentMethodsSlice";
import { UserPaymentDetail } from "@/features/p2p/components/ui/p2pdashboard/sections/UserPaymentSelector";
import PaymentMethodsModal from "@/features/p2p/components/ui/p2pdashboard/sections/PaymentMethodsModal";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState("Approved");

  const filteredPayments = userPaymentDetails.filter(
    (payment: UserPaymentDetail) =>
      payment.status?.toLowerCase() === activeButton.toLowerCase()
  );

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails() as any);
      dispatch(fetchAdminPaymentMethods() as any);
    }
  }, [dispatch, isAuthenticated]);

  const handleDeleteMethod = async (methodId: string) => {
    try {
      setDeletingMethodId(methodId);
      await dispatch(deleteUserPaymentDetail(methodId) as any);
      await dispatch(fetchUserPaymentDetails() as any);
    } finally {
      setDeletingMethodId(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 dark:text-white text-gray-900 w-full">
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
            <button className={`px-3 py-1.5 rounded-full border border-[#1D8751] text-[#1D8751] text-xs sm:text-sm font-semibold focus:outline-none ${activeButton === "Pending"? "bg-[#1D8751] text-white" : "bg-transparent"}` } onClick={() => setActiveButton("Pending")}>
              Pending
            </button>
          </div>
        </div>
        <button
          className="flex items-center gap-1 text-xs sm:text-sm dark:text-white text-gray-900 font-medium hover:underline focus:outline-none self-start"
          onClick={() => setShowPaymentModal(true)}
        >
          Add Payment Method
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="text-sm sm:text-base font-bold dark:text-white text-gray-900">
          Payment Methods
        </p>
        <div className="rounded-[32px] border border-[#20202A] dark:border-[#1E1E27] bg-white dark:bg-[#0D0D12] p-3 sm:p-4 space-y-3">
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
            return (
              <div
                key={payment.id}
                className="flex flex-col gap-3 rounded-[28px] border border-[#E3E6F0] dark:border-[#2A2A35] bg-gray-50 dark:bg-[#13131A] px-4 py-4"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={payment?.provider_logo || "/default-provider-logo.svg"}
                      alt={payment?.payment_provider_name || payment?.payment_method_name}
                      className="w-12 h-12 object-contain flex-shrink-0"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        e.currentTarget.src = "/default-provider-logo.svg";
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
                  <div className="rounded-full border border-[#E3E6F0] dark:border-[#2A2A35] bg-white dark:bg-[#0D0D12] px-4 py-2 flex items-center text-sm text-gray-500 dark:text-[#8890A6]">
                    <input
                      type="text"
                      readOnly
                      value={payment?.account_number || ""}
                      placeholder={placeholderText}
                      className="w-full bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#5C6175] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <PaymentMethodsModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onAdd={() => dispatch(fetchUserPaymentDetails() as any)}
      />
    </div>
  );
};

export default PaymentMethods;
