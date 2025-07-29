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
    <div className="p-3 text-white">
      {/* Top Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white mb-2">
            Wallet Address
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-full bg-[#1D8751] text-white text-xs font-semibold focus:outline-none">
              Approved
            </button>
            <button className="px-3 py-1 rounded-full border border-[#1D8751] text-[#1D8751] text-xs font-semibold focus:outline-none bg-transparent">
              Pending
            </button>
          </div>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-white font-medium hover:underline focus:outline-none"
          onClick={() => setShowPaymentModal(true)}
        >
          Add Payment Method
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-base font-semibold"> Payment Methods</p>
        {userPaymentDetails.map((payment: UserPaymentDetail) => (
          <div
            key={payment.id}
            className="flex bg-[#1D1D23] border-2 border-[#35353E] rounded-xl p-3 justify-between gap-3 items-center"
          >
            <div>
              <p className="text-sm">{payment?.payment_method_name}</p>
              <p className="text-xs text-[#808080]">
                {payment?.payment_provider_name}
              </p>
            </div>
            <div>
              <p className="text-sm">{payment?.account_number}</p>
              <p className="text-xs text-[#808080]">{payment?.account_name}</p>
            </div>
            <button
              className="ml-2 text-[#1D8751] hover:text-red-500"
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
        ))}
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
