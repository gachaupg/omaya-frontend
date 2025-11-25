import React, { useEffect, useState } from "react";
import Button from "@/features/p2p/components/Common/Button";
import Input from "@/features/p2p/components/Common/Input";
import {
  fetchUserPaymentDetails,
  deleteUserPaymentDetail,
  fetchAdminPaymentMethods,
  postUserPaymentDetail,
  clearPostStatus,
} from "@/features/p2p/slices/paymentMethodsSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";
import { ChevronDown } from "lucide-react";

import { logger } from '@/lib/utils/logger';
import { AdminPaymentMethod } from "@/features/p2p/types/paymentMethods";

// Types
interface PaymentMethod {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  wallet_address: string | null;
  editable?: boolean;
  provider_logo?: string;
}

const ITEMS_PER_PAGE = 5;

const PaymentMethods = () => {
  /** Local state */
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Inline add method states
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isClient, setIsClient] = useState(false);

  /** Store */
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const {
    userPaymentDetails,
    loading: userPaymentDetailsLoading,
    adminMethods,
    loading: adminLoading,
    postLoading,
    postError,
    postSuccess,
  } = useSelector((state: RootState) => state.paymentMethods);

  /** Effects */
  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated) {
      dispatch(fetchUserPaymentDetails() as any);
    }
    dispatch(fetchAdminPaymentMethods() as any);
  }, [dispatch, isAuthenticated]);

  // Reset add form on dropdown open
  useEffect(() => {
    if (showAddDropdown) {
      setSelectedMethod("");
      setSelectedProvider("");
      setAccountName(user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "");
      setAccountNumber("");
      dispatch(clearPostStatus());
    }
  }, [showAddDropdown, user, dispatch]);

  // Providers for selected method
  const providers = (adminMethods || []).filter(
    (m: AdminPaymentMethod) => m.payment_method_type === selectedMethod
  );

  // Unique method types for dropdown
  const methodTypes = Array.from(
    new Set(
      (adminMethods || [])
        .map((m: AdminPaymentMethod) => m.payment_method_type)
        .filter(Boolean)
    )
  ) as string[];

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
    logger.debug('p2p', "Input change:", methodId, field, value);
  };

  // Handle Add
  const handleAdd = () => {
    if (!isAuthenticated) {
      showToast.error("Please log in to add payment methods");
      return;
    }
    if (!selectedMethod || !selectedProvider || !accountName || !accountNumber) {
      showToast.error("Please fill all required fields");
      return;
    }
    const selectedProviderObj = providers.find(
      (p: any) => p.provider_name === selectedProvider
    );
    const payload = {
      account_name: accountName,
      account_number: accountNumber,
      payment_method_name: selectedMethod,
      payment_provider_name: selectedProvider,
      provider_name: selectedProvider,
      wallet_address: selectedProviderObj?.wallet_address || null,
    };
    dispatch(postUserPaymentDetail(payload));
  };

  const getDefaultAccountName = () =>
    user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "";

  const handleMethodSelection = (type: string) => {
    setSelectedMethod(type);
    setSelectedProvider("");
    setAccountName(getDefaultAccountName());
    setShowAddDropdown(false);
  };

  const handleCancelSelection = () => {
    setSelectedMethod("");
    setSelectedProvider("");
    setAccountNumber("");
    setAccountName(getDefaultAccountName());
  };

  // Close dropdown on success
  useEffect(() => {
    if (postSuccess) {
      showToast.success("Payment method added!");
      setShowAddDropdown(false);
      dispatch(fetchUserPaymentDetails() as any);
      dispatch(clearPostStatus());
    }
  }, [postSuccess, dispatch]);

  // Handle errors
  useEffect(() => {
    if (postError) {
      showToast.error(postError);
    }
  }, [postError]);

  /** Render helpers */
  const renderPaymentMethod = (method: PaymentMethod) => (
    <div key={method.id} className="mb-5">
      <div className="flex items-center mb-3">
        <img
          src={
            method.provider_logo ||
            "/default-provider-logo.svg"
          }
          alt={`${method.payment_provider_name} Icon`}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 object-cover"
          onError={(e) => {
            e.currentTarget.src = "/default-provider-logo.svg";
          }}
        />
        <span className="text-gray-900 dark:text-white font-semibold flex items-center text-base sm:text-lg">
          {method.payment_provider_name}
          <svg
            className="w-5 h-5 ml-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
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
          className="ml-auto text-[#1D8751] flex items-center hover:opacity-80 transition-opacity"
          title="Delete"
          onClick={() => handleDeleteMethod(method.id.toString())}
        >
          {deletingMethodId === method.id.toString() ? (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#1D8751]"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 sm:w-7 sm:h-7 cursor-pointer"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
              />
            </svg>
          )}
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Account Name */}
        <Input
          placeholder="Accounthhhh Name"
          value={method.account_name}
          className="w-full sm:flex-1 h-[52px] rounded-3xl border border-gray-300 dark:border-[#353535] bg-white dark:bg-[#353535] text-gray-900 dark:text-white px-[14px] py-[10px] text-sm sm:text-base"
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
          className="w-full sm:flex-1 h-[52px] rounded-3xl border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#18181D] text-gray-900 dark:text-white px-[14px] py-[10px] text-sm sm:text-base"
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
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        No Payment Methods
      </h3>
      <p className="text-base font-medium text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
        You haven't added any payment methods yet. Add your first payment method
        to start accepting payments.
      </p>
      <Button
        onClick={() => setShowAddDropdown(true)}
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
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
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

  // Inline Add Method Dropdown
const renderAddMethodDropdown = () => (
  <div
    className={`
      absolute top-full mt-2
      ${showAddDropdown ? "" : "hidden"}
      w-[90vw] max-w-xs sm:w-64
      left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0
      rounded-xl border-2 border-[#1D8751] bg-[#0F1219] text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)]
      z-1000
    `}
  >
    <div className="p-3">
      <p className="text-xs uppercase tracking-wide text-[#49C476] mb-2">Payment Method</p>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {methodTypes.map((type, idx) => {
          const isSelected = selectedMethod === type;
          return (
            <button
              type="button"
              key={type + idx}
              className={`flex items-center gap-3 rounded-lg border border-[#205437] px-3 py-2 text-left transition
                ${isSelected ? "bg-[#14301F] border-[#49C476]" : "bg-transparent hover:bg-[#101c14]"}
              `}
              onClick={() => handleMethodSelection(type)}
              disabled={adminLoading}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                  isSelected ? "border-[#49C476] bg-[#49C476]" : "border-[#49C476]"
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-[#0F1219]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-medium">{type}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);


  /** Render */
  return (
    <div className="w-full min-h-[600px] bg-white dark:bg-[#18181D] rounded-2xl p-4 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-[#35353E] overflow-visible">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 ">
        <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Payment Methods
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto relative">
          <div className="w-full sm:w-auto">
            <Button
              height={44}
              borderRadius={24}
              variant="outline"
              className="border-2 border-[#1D8751] w-full text-gray-900 dark:text-white relative flex items-center justify-between"
              size="md"
              onClick={() => setShowAddDropdown(prev => !prev)}
            >
              <span className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                {!selectedMethod && (
                  <span className="text-[#1D8751] text-xl font-bold">+</span>
                )}
                {selectedMethod || "Add Method"}
              </span>
              <ChevronDown className="w-4 h-4 text-[#1D8751]" />
            </Button>
            {renderAddMethodDropdown()}
          </div>
        </div>
      </div>

      {/* Selected Method Details */}
      {selectedMethod && (
        <div className="w-full border border-gray-200 dark:border-[#35353E] rounded-2xl p-4 sm:p-5 mb-6 bg-gray-50 dark:bg-[#1F1F27]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-[#8C8CA1]">Selected Method</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{selectedMethod}</p>
            </div>
            <button
              className="text-xs sm:text-sm font-medium text-[#E23D3A] hover:opacity-80"
              onClick={handleCancelSelection}
            >
              Cancel Selection
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-600 dark:text-[#788099] text-xs sm:text-sm mb-1">
                Provider
              </label>
              <div className="relative">
                <select
                  className="w-full bg-white dark:bg-[#1C1C24] text-gray-900 dark:text-white appearance-none pr-10 rounded-xl border border-gray-200 dark:border-[#35353E] h-12 px-4 text-sm"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  disabled={adminLoading}
                >
                  <option value="">Select Provider</option>
                  {providers.map((p: any, idx: number) => (
                    <option key={p.provider_name + idx} value={p.provider_name}>
                      {p.provider_name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {selectedProvider && (
              <div className="p-3 rounded-xl bg-white dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] flex items-center gap-3">
                {(() => {
                  const selectedProviderObj = providers.find((p: any) => p.provider_name === selectedProvider);
                  return (
                    <>
                      <img
                        src={selectedProviderObj?.logo || "/default-provider-logo.svg"}
                        alt={`${selectedProvider} logo`}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/default-provider-logo.svg";
                        }}
                      />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {selectedProvider}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#788099]">
                          Selected Provider
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <Input
                placeholder="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full text-sm"
                disabled
              />
              <Input
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            <Button
              className="bg-[#1D8751] text-white w-full sm:w-auto px-8"
              onClick={handleAdd}
              disabled={
                !selectedProvider || !accountName || !accountNumber || postLoading
              }
              height={44}
              borderRadius={24}
            >
              {postLoading ? "Adding..." : "Add Payment Method"}
            </Button>
          </div>
        </div>
      )}

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
          height={44}
          borderRadius={24}
          variant="outline"
          className="border-2 border-[#1D8751] w-full text-gray-900 dark:text-white"
          size="md"
        >
          <p className="text-sm sm:text-base font-semibold">Update</p>
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethods;