import React, { useEffect, useState } from "react";
import Button from "@/features/p2p/components/Common/Button";
import Input from "@/features/p2p/components/Common/Input";
import Select from "@/features/p2p/components/Common/Select";
import PaymentMethodsModal from "../../p2pdashboard/sections/PaymentMethodsModal";
import {
  fetchUserPaymentDetails,
  deleteUserPaymentDetail,
} from "@/features/p2p/slices/paymentMethodsSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";

// Types
interface PaymentMethod {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  wallet_address: string | null;
  editable?: boolean;
}

const ITEMS_PER_PAGE = 5;

const PaymentMethods = () => {
  /** Local state */
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  /** Store */
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { userPaymentDetails, loading: userPaymentDetailsLoading } =
    useSelector((state: RootState) => state.paymentMethods);

  /** Effects */
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails() as any);
    }
  }, [dispatch, isAuthenticated]);

  /** Handlers */
  const handleDeleteMethod = async (methodId: string) => {
    try {
      setDeletingMethodId(methodId);
      setDeleteError(null);
      setDeleteSuccess(false);
      await dispatch(deleteUserPaymentDetail(methodId) as any);
      setDeleteSuccess(true);
      await dispatch(fetchUserPaymentDetails() as any);
    } catch {
      setDeleteError("Failed to delete payment method");
    } finally {
      setDeletingMethodId(null);
    }
  };

  const handleInputChange = (
    methodId: number,
    field: string,
    value: string
  ) => {
    // TODO: Implement input change functionality
    console.log("Input change:", methodId, field, value);
  };

  /** Render helpers */
  const renderPaymentMethod = (method: PaymentMethod) => (
    <div key={method.id} className="mb-4">
      <div className="flex items-center mb-2">
        <img
          src="https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
          alt={`${method.payment_provider_name} Icon`}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 object-cover"
        />
        <span className="text-gray-900 dark:text-white font-medium flex items-center text-base sm:text-lg">
          {method.payment_provider_name}
          <svg
            className="w-4 h-4 ml-1 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
        <button
          disabled={deletingMethodId === method.id.toString()}
          className="ml-auto text-[#1D8751] text-2xl flex items-center"
          title="Delete"
          onClick={() => handleDeleteMethod(method.id.toString())}
        >
          {deletingMethodId === method.id.toString() ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#1D8751]"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer"
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
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Account Name */}
        <Input
          placeholder="Account Name"
          value={method.account_name}
          className="w-full sm:w-[539px] h-[52px] rounded-3xl border border-gray-300 dark:border-[#353535] bg-white dark:bg-[#353535] text-gray-900 dark:text-white px-[14px] py-[10px] text-base"
          bgColor="#ffffff"
          borderColor="#d1d5db"
          disabled={!method.editable}
          onChange={(e) =>
            handleInputChange(method.id, "account_name", e.target.value)
          }
        />
        {/* Account Number */}
        <Input
          placeholder="Account Number"
          value={method.account_number}
          className="w-full sm:w-[539px] h-[52px] rounded-3xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#18181D] text-gray-900 dark:text-white px-[14px] py-[10px] text-base"
          bgColor="#ffffff"
          borderColor="#d1d5db"
          disabled={!method.editable}
          onChange={(e) =>
            handleInputChange(method.id, "account_number", e.target.value)
          }
        />
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-[#1D1D23] flex items-center justify-center">
        <svg
          className="w-12 h-12 text-[#1D8751]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Payment Methods
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        You haven't added any payment methods yet. Add your first payment method
        to start accepting payments.
      </p>
      <Button
        onClick={() => setShowPaymentModal(true)}
        className="bg-[#1D8751] hover:bg-[#176e43] text-white px-6 py-2 rounded-full"
      >
        Add Payment Method
      </Button>
    </div>
  );

  const renderPagination = () => {
    const totalPages = Math.ceil(userPaymentDetails.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-[#1D1D23] text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg ${
                currentPage === page
                  ? "bg-[#1D8751] text-white"
                  : "bg-gray-100 dark:bg-[#1D1D23] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-[#1D1D23] text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  /** Pagination logic */
  const paginatedMethods = userPaymentDetails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /** Render */
  return (
    <div className="w-full min-h-[600px] bg-white dark:bg-[#23232B] rounded-2xl p-4 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <span className="text-[18px] sm:text-[22px] font-semibold">
          Payment Methods
        </span>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            height={40}
            borderRadius={10}
            variant="outline"
            className="border-1 border-[#1D8751] w-full text-gray-900 dark:text-white"
            size="md"
            onClick={() => setShowPaymentModal(true)}
          >
            <p>+ Add Method</p>
          </Button>
        </div>
      </div>

      {/* Modal */}
      <PaymentMethodsModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onAdd={() => setShowPaymentModal(false)}
      />

      {/* Content */}
      {userPaymentDetailsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1D8751]"></div>
        </div>
      ) : userPaymentDetails.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {paginatedMethods.map(renderPaymentMethod)}
          {renderPagination()}
        </>
      )}

      {/* Update Button */}
      <div className="mt-8 w-full">
        <Button
          height={40}
          borderRadius={24}
          variant="outline"
          className="border-2 border-[#1D8751] w-full text-gray-900 dark:text-white"
          size="md"
        >
          <p>Update</p>
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethods;
