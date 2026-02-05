import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Button from "@/features/p2p/components/Common/Button";
import Input from "@/features/p2p/components/Common/Input";
import {
  fetchUserPaymentDetails,
  deleteUserPaymentDetail,
  fetchAdminPaymentMethods,
  postUserPaymentDetail,
  clearPostStatus,
} from "@/features/p2p/slices/paymentMethodsSlice";
import EditPaymentMethodModal from "./EditPaymentMethodModal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";
import { ChevronDown, Search } from "lucide-react";

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
  const listRef = useRef<HTMLDivElement>(null);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Inline add method states
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Edit modal states
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      setProviderSearch("");
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

  // Flat list of all providers (provider_name + method type) for direct selection
  const allProviders = useMemo(() => {
    const methods = (adminMethods || []) as AdminPaymentMethod[];
    return methods
      .filter((m) => m && m.provider_name)
      .map((m) => ({
        provider_name: m.provider_name,
        payment_method_type: m.payment_method_type || "Bank",
        logo: m.logo,
        provider_logo: m.provider_logo,
        wallet_address: m.wallet_address,
      }));
  }, [adminMethods]);

  // Filtered providers by search
  const filteredProviders = useMemo(() => {
    if (!providerSearch.trim()) return allProviders;
    const q = providerSearch.toLowerCase().trim();
    return allProviders.filter(
      (p) =>
        p.provider_name?.toLowerCase().includes(q) ||
        p.payment_method_type?.toLowerCase().includes(q)
    );
  }, [allProviders, providerSearch]);

  // Selected provider object (when user has selected one)
  const selectedProviderObj = useMemo(
    () => allProviders.find((p) => p.provider_name === selectedProvider),
    [allProviders, selectedProvider]
  );

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

  const handleProviderSelection = (provider: { provider_name: string; payment_method_type: string }) => {
    setSelectedProvider(provider.provider_name);
    setSelectedMethod(provider.payment_method_type);
    setAccountName(getDefaultAccountName());
    setShowAddDropdown(false);
  };

  const handleCancelSelection = () => {
    setSelectedMethod("");
    setSelectedProvider("");
    setProviderSearch("");
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
        <td className="px-4 py-4">
          <div className="flex items-center justify-end gap-2">
            {/* Edit Button */}
            <button
              onClick={() => {
                setEditingPaymentMethod(method);
                setIsEditModalOpen(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors"
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-[#1D8751] cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            {/* Delete Button */}
            <button
              disabled={deletingMethodId === method.id.toString()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors disabled:opacity-50"
              title="Delete"
              onClick={() => handleDeleteMethod(method.id.toString())}
            >
              {deletingMethodId === method.id.toString() ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#1D8751]"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-red-500 cursor-pointer"
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
        <td className="px-4 py-4">
          <div className="flex items-center justify-end gap-2">
            {/* Edit Button */}
            <button
              onClick={() => {
                setEditingPaymentMethod(method);
                setIsEditModalOpen(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors"
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-[#1D8751] cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            {/* Delete Button */}
            <button
              disabled={deletingMethodId === method?.id?.toString()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors disabled:opacity-50"
              title="Delete"
              onClick={() => handleDeleteMethod(method?.id?.toString() || '')}
            >
              {deletingMethodId === method?.id?.toString() ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#1D8751]"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-red-500 cursor-pointer"
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
        </td>
      </tr>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-(--card-color) flex items-center justify-center">
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (listRef.current) {
      const topOffset = 100;
      const elementPosition = listRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg bg-white border border-gray-200 dark:border-[#35353E] dark:bg-[var(--card-color)] text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${currentPage === page
                ? "bg-[#1D8751] text-white"
                : "bg-(--card-color) border border-gray-200 dark:border-accent  text-gray-700 dark:text-gray-400 hover:bg-[#1D8751]/10 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            handlePageChange(Math.min(currentPage + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-lg bg-white border border-gray-200 dark:border-[#35353E] dark:bg-[var(--card-color)] text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  /** Pagination logic */

  // Group methods into two sections: Bank and Mobile Money
  // Check payment_method or payment_method_type to determine category
  // Safely filter out any undefined/null methods
  const safeUserPaymentDetails = Array.isArray(userPaymentDetails)
    ? userPaymentDetails.filter((m: any) => m && typeof m === 'object')
    : [];

  // Helper function to check if a method is mobile money
  const isMobileMoneyMethod = (method: any) => {
    if (!method) return false;
    const providerName = (method.provider_name || method.provider || '').toLowerCase();
    const paymentMethod = (method.payment_method || '').toLowerCase();
    const paymentMethodType = (method.payment_method_type || '').toLowerCase();
    
    const mobileKeywords = ['mobile', 'mpesa', 'm-pesa', 'mtn', 'airtel', 'safaricom', 'vodafone', 'telesom', 'hormuud', 'golis', 'evc', 'zaad', 'sahal', 'telebirr', 'waafi'];
    
    return mobileKeywords.some(keyword => 
      providerName.includes(keyword) || 
      paymentMethod.includes(keyword) || 
      paymentMethodType.includes(keyword)
    );
  };

  const mobileMoneyMethods: PaymentMethod[] = safeUserPaymentDetails.filter(isMobileMoneyMethod);

  const bankMethods: PaymentMethod[] = safeUserPaymentDetails.filter((m: any) => !isMobileMoneyMethod(m));

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

  // Inline Add Method Dropdown - searchable list of all payment providers
  const renderAddMethodDropdown = () => (
    <div
      ref={dropdownRef}
      className={`absolute top-full mt-2 ${showAddDropdown ? "" : "hidden"} w-full sm:w-80 right-0 rounded-xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] shadow-lg z-20 overflow-hidden`}
    >
      <div className="p-2 border-b border-gray-200 dark:border-[#35353E]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payment methods..."
            value={providerSearch}
            onChange={(e) => setProviderSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1D1D23] border border-gray-200 dark:border-[#35353E] rounded-lg outline-none focus:ring-2 focus:ring-[#1D8751]/30 focus:border-[#1D8751]"
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto py-2">
        {adminLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D8751]" />
          </div>
        ) : filteredProviders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 dark:text-[#788099] text-center">
            {providerSearch ? "No matching payment methods." : "No payment methods available."}
          </p>
        ) : (
          filteredProviders.map((p, idx) => (
            <button
              type="button"
              key={`${p.provider_name}-${idx}`}
              className="flex items-center gap-3 px-4 py-2.5 text-left w-full hover:bg-gray-50 dark:hover:bg-[#1a1f2e] transition-colors"
              onClick={() => handleProviderSelection(p)}
            >
              {p.logo || p.provider_logo ? (
                <img
                  src={getHighResPaymentLogo(p.logo, p.provider_logo, PAYMENT_LOGO_SIZE)}
                  alt={p.provider_name}
                  className="w-8 h-8 rounded-full object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#35353E] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                  {p.provider_name}
                </span>
                <span className="text-xs text-gray-500 dark:text-[#788099]">
                  {p.payment_method_type}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );


  /** Render */
  return (
    <div className="w-full min-h-[600px] bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-[#35353E] overflow-visible">
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
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-auto" />
            </Button>
            {renderAddMethodDropdown()}
          </div>
        </div>
      </div>

      {/* Selected Provider Details - shown when user picks a provider from the dropdown */}
      {selectedProvider && (
        <div className="w-full border border-gray-200 dark:border-[#35353E] rounded-2xl p-4 sm:p-5 mb-6 bg-gray-50 dark:bg-[var(--card-color)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedProviderObj ? getHighResPaymentLogo(selectedProviderObj.logo, selectedProviderObj.provider_logo, PAYMENT_LOGO_SIZE * 2) : "/default-provider-logo.svg"}
                alt={selectedProvider}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain flex-shrink-0"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/default-provider-logo.svg";
                }}
              />
              <div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedProvider}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#788099]">
                  {selectedMethod}
                </p>
              </div>
            </div>
            <button
              className="text-xs sm:text-sm font-medium text-[#E23D3A] hover:opacity-80"
              onClick={handleCancelSelection}
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <Input
                placeholder="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full text-sm text-gray-900 dark:text-white disabled:opacity-50"
                disabled
              />
              <Input
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full text-sm text-gray-900 dark:text-white"
              />
            </div>

            <Button
              className="bg-[#1D8751] text-white w-full sm:w-auto px-8"
              onClick={handleAdd}
              disabled={
                !accountName || !accountNumber || postLoading
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
          <div className="mb-6" ref={listRef}>
            <div>
              {bankMethods.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No bank payment methods added.</p>
              ) : (
                <>
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
          <div className="mb-6 mx-4">
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
      <div className="mt-8 mx-4">
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

      {/* Edit Payment Method Modal */}
      <EditPaymentMethodModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPaymentMethod(null);
        }}
        paymentMethod={editingPaymentMethod}
      />
    </div>
  );
};

export default PaymentMethods;