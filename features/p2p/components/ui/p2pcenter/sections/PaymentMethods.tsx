import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { getHighResPaymentLogo, PAYMENT_LOGO_SIZE } from "@/features/express/utils/imageHelpers";

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

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (
      showAddDropdown &&
      dropdownRef.current &&
      !dropdownRef.current.contains(target) &&
      buttonRef.current &&
      !buttonRef.current.contains(target)
    ) {
      setShowAddDropdown(false);
    }
  }, [showAddDropdown]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

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

  // Close dropdown and reset form on success
  useEffect(() => {
    if (postSuccess) {
      showToast.success("Payment method added!");
      setShowAddDropdown(false);
      // Reset all form fields
      setSelectedMethod("");
      setSelectedProvider("");
      setAccountNumber("");
      setAccountName(getDefaultAccountName());
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
  const renderPaymentMethod = (method: PaymentMethod) => {
    // Safety check - return null if method is invalid
    if (!method || typeof method !== 'object') {
      return null;
    }
    
    return (
      <tr key={method.id} className="border-b border-gray-200 dark:border-[#35353E] hover:bg-gray-50 dark:hover:bg-[var(--card-color)] transition-colors">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={getHighResPaymentLogo(method?.provider_logo, null, PAYMENT_LOGO_SIZE * 2)}
              alt={`${method?.payment_provider_name || 'Payment'} Icon`}
              className="w-10 h-10 rounded-full object-contain flex-shrink-0"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/default-provider-logo.svg";
              }}
            />
            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {method.payment_provider_name}
            </span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm sm:text-base text-gray-900 dark:text-white">
          {method?.account_name || '—'}
        </td>
        <td className="px-4 py-4 text-sm sm:text-base text-gray-900 dark:text-white font-mono">
          {method?.account_number || '—'}
        </td>
        <td className="px-4 py-4 text-right">
          <button
            disabled={deletingMethodId === method.id.toString()}
            className="text-[#1D8751] hover:text-red-500 transition-colors flex items-center justify-end"
            title="Delete"
            onClick={() => handleDeleteMethod(method.id.toString())}
          >
            {deletingMethodId === method.id.toString() ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#1D8751]"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 cursor-pointer"
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
        </td>
      </tr>
    );
  };

  // Render helper specifically for Mobile Money items
  const renderMobilePaymentMethod = (method: PaymentMethod) => {
    // Safety check - return null if method is invalid
    if (!method || typeof method !== 'object') {
      return null;
    }
    
    return (
      <tr key={method.id} className="border-b border-gray-200 dark:border-[#35353E] hover:bg-gray-50 dark:hover:bg-[var(--card-color)] transition-colors">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={method?.provider_logo || "/default-provider-logo.svg"}
              alt={`${method?.payment_provider_name || 'Payment'} Icon`}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/default-provider-logo.svg";
              }}
            />
            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {method?.payment_provider_name || ''}
            </span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm sm:text-base text-gray-900 dark:text-white">
          {method?.account_name || '—'}
        </td>
        <td className="px-4 py-4 text-sm sm:text-base text-gray-900 dark:text-white font-mono">
          {method?.account_number || '—'}
        </td>
        <td className="px-4 py-4 text-right">
          <button
            disabled={deletingMethodId === method?.id?.toString()}
            className="text-[#1D8751] hover:text-red-500 transition-colors flex items-center justify-end"
            title="Delete"
            onClick={() => handleDeleteMethod(method?.id?.toString() || '')}
          >
            {deletingMethodId === method?.id?.toString() ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#1D8751]"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 cursor-pointer"
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
        </td>
      </tr>
    );
  };

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

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
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
              className={`w-8 h-8 rounded-lg ${currentPage === page
                ? "bg-[#1D8751] text-white"
                : "bg-gray-100 dark:bg-card text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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

  // Group methods into two sections: Bank and Mobile Money
  // For now place the first available method under Mobile Money and the rest under Bank
  // Safely filter out any undefined/null methods
  const safeUserPaymentDetails = Array.isArray(userPaymentDetails) 
    ? userPaymentDetails.filter((m: any) => m && typeof m === 'object')
    : [];
  
  const mobileMoneyMethods: PaymentMethod[] = safeUserPaymentDetails.length > 22 && safeUserPaymentDetails[22]
    ? [safeUserPaymentDetails[22]]
    : [];

  const bankMethods: PaymentMethod[] = safeUserPaymentDetails.length > 1
    ? safeUserPaymentDetails.slice(1).filter((m: any) => m && typeof m === 'object')
    : [];

  // Paginate bank methods only
  const bankMethodsPaginated = bankMethods.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    const totalPages = Math.ceil(bankMethods.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [bankMethods.length]);

  // Inline Add Method Dropdown
  const renderAddMethodDropdown = () => (
    <div
      ref={dropdownRef}
      className={
        `absolute top-full mt-2 ${showAddDropdown ? "" : "hidden"} sm:w-48 md:w-56 right-0 rounded-lg border border-[#49C476] bg-[#0F1219] text-white shadow-lg z-10`
      }
    >
      <div className="py-2">
        {methodTypes.map((type, idx) => {
          const isSelected = selectedMethod === type;
          return (
            <button
              type="button"
              key={type + idx}
              className={`flex items-center gap-3 px-4 py-2.5 text-left transition w-full hover:bg-[#1a1f2e] ${isSelected ? "bg-[#1a1f2e]" : ""}`}
              onClick={() => { handleMethodSelection(type); setShowAddDropdown(false); }}
              disabled={adminLoading}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded border-1 flex-shrink-0 ${isSelected ? "border-[#49C476] bg-[#49C476]" : "border-[#49C476]"}`}>
                {isSelected ? (
                  <svg className="w-3 h-3 text-[#0F1219]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <span className="text-sm">{type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );


  /** Render */
  return (
    <div className="w-full min-h-[600px] bg-white dark:bg-[#1D1D23] rounded-2xl p-4 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-[#35353E] overflow-visible">
      {/* Header: Bank title left, Add Method dropdown right */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Bank</h4>
        </div>

        <div className="relative w-full sm:w-auto">
          <div className="w-full sm:w-auto ml-auto" ref={buttonRef}>
            <Button
              height={44}
              borderRadius={24}
              variant="outline"
              className="border-1 rounded-lg border-[#49C476] lg:w-56 sm:w-auto text-gray-900 dark:text-white relative flex items-center justify-center gap-2 px-4"
              size="md"
              onClick={() => setShowAddDropdown(prev => !prev)}
            >
              <span className="flex items-center gap-2">
                <span className="flex items-center justify-center  text-[#49C476] font-light text-3xl">+</span>
                <span className="text-sm font-medium">Add Method</span>
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-200 ml-auto" />
            </Button>
            {renderAddMethodDropdown()}
          </div>
        </div>
      </div>

      {/* Selected Method Details */}
      {selectedMethod && (
        <div className="w-full border border-gray-200 dark:border-[#35353E] rounded-2xl p-4 sm:p-5 mb-6 bg-gray-50 dark:bg-[#1D1D23]">
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
                  className="w-full bg-white dark:bg-[#1D1D23] text-gray-900 dark:text-white appearance-none pr-10 rounded-xl border border-gray-200 dark:border-[#35353E] h-12 px-4 text-sm"
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
              <div className="p-3 rounded-xl bg-white dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] flex items-center gap-3">
                {(() => {
                  const selectedProviderObj = providers.find(
                    (p: any) => p && typeof p === 'object' && p.provider_name === selectedProvider
                  );
                  // Safely handle case where provider object might not exist
                  if (!selectedProviderObj || typeof selectedProviderObj !== 'object') {
                    return (
                      <>
                        <img
                          src="/default-provider-logo.svg"
                          alt={`${selectedProvider} logo`}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain flex-shrink-0"
                          loading="lazy"
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
                  }
                  return (
                    <>
                      <img
                        src={getHighResPaymentLogo(
                          selectedProviderObj?.logo,
                          selectedProviderObj?.provider_logo,
                          PAYMENT_LOGO_SIZE * 2
                        )}
                        alt={`${selectedProvider} logo`}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain flex-shrink-0"
                        loading="lazy"
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
          {/* Bank Section */}
          <div className="mb-6">
            <div>
              {bankMethods.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No bank payment methods added.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-[#35353E]">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Bank</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Account Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Account Number</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankMethodsPaginated.map(renderPaymentMethod)}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(bankMethods.length)}
                </>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-[#35353E] my-6" />

          {/* Mobile Money Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Mobile Money</h4>
            </div>
            <div>
              {mobileMoneyMethods.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No mobile money methods added.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-[#35353E]">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Provider</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Account Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Account Number</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mobileMoneyMethods.map(renderMobilePaymentMethod)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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