import React, { useState, useMemo, useEffect } from "react";
import CustomSelect from "@/components/ui/CustomSelect";
import { AdminPaymentMethod } from "@/features/p2p/types/paymentMethods";
import { FaTimes } from "react-icons/fa";

export interface UserPaymentDetail {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  provider_logo?: string;
  logo?: string;
  logo_url?: string;
  wallet_address?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserPaymentSelectorProps {
  userPaymentDetails: UserPaymentDetail[];
  adminMethods?: AdminPaymentMethod[];
  onSelect: (detail: UserPaymentDetail) => void;
  onRemove?: (detail: UserPaymentDetail) => void;
  selectedDetails: UserPaymentDetail[];
  onAddPaymentMethod?: () => void;
  onProviderSelect?: (provider: string | null) => void;
  hideSelected?: boolean;
  /** Renders next to Provider select with equal width (e.g. Time Limit) */
  renderAside?: React.ReactNode;
}

// Dropdown-selector + card list for a user's saved payment details.
// Pure UI – no business logic touched. Added `dark:` utilities everywhere so the
// component looks correct in both light & dark themes.
const UserPaymentSelector: React.FC<UserPaymentSelectorProps> = ({
  userPaymentDetails,
  adminMethods = [],
  onSelect,
  onRemove,
  selectedDetails,
  onAddPaymentMethod,
  onProviderSelect,
  hideSelected = false,
  renderAside,
}) => {
  const [selectedProvider, setSelectedProvider] = useState("");

  useEffect(() => {
    onProviderSelect?.(selectedProvider || null);
  }, [selectedProvider, onProviderSelect]);

  // Memoized options for providers - show all providers
  const providerOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; logo?: string }> = [];

    adminMethods.forEach((m) => {
      if (m.provider_name && !seen.has(m.provider_name)) {
        seen.add(m.provider_name);
        options.push({
          value: m.provider_name,
          label: m.provider_name,
          logo: m.logo_url || m.logo || undefined,
        });
      }
    });

    userPaymentDetails.forEach((d) => {
      if (d.payment_provider_name && !seen.has(d.payment_provider_name)) {
        seen.add(d.payment_provider_name);
        const logoUrl = d.logo_url || d.logo || d.provider_logo || undefined;
        options.push({
          value: d.payment_provider_name,
          label: d.payment_provider_name,
          logo: logoUrl,
        });
      }
    });

    return options;
  }, [userPaymentDetails, adminMethods]);

  // Filtered details for selected provider - match by provider (method optional when provider-first)
  const filteredDetails = useMemo(
    () => {
      let details = userPaymentDetails.filter(
        (d) => d.payment_provider_name === selectedProvider
      );

      if (hideSelected) {
        details = details.filter(
          (d) => !selectedDetails.some((sd) => sd.id === d.id)
        );
      }

      return details;
    },
    [userPaymentDetails, selectedProvider, selectedDetails, hideSelected]
  );

  // Check if there are admin methods for the selected provider (to show "Add Account" message)
  const hasAdminMethod = useMemo(
    () =>
      adminMethods.some((m) => m.provider_name === selectedProvider),
    [adminMethods, selectedProvider]
  );

  // When hideSelected is true, filteredDetails may be empty because ALL accounts for this provider are already selected
  const allMatchingSelected = useMemo(
    () =>
      hideSelected &&
      filteredDetails.length === 0 &&
      selectedDetails.some((d) => d.payment_provider_name === selectedProvider),
    [hideSelected, filteredDetails.length, selectedDetails, selectedProvider]
  );


  return (
    <div className="space-y-6">
      {/* Provider + Aside (e.g. Time Limit) - equal width */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Provider
          </label>
          <CustomSelect
            options={providerOptions}
            value={selectedProvider}
            onChange={(value) => setSelectedProvider(value)}
            placeholder="Select Provider (e.g. Salam Bank, M-Pesa)"
            logoSize={32}
            logoClassName="rounded-full object-cover flex-shrink-0"
            className="w-full"
            sizeMode="card"
            searchable
          />
        </div>
        {renderAside && (
          <div className="flex-1 min-w-0">
            {renderAside}
          </div>
        )}
      </div>

      {/* Payment cards + Add button */}
      {selectedProvider && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-gray-400 dark:text-[#788099] italic">
            Newly added methods may show as pending until verified.
          </p>
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* Card list */}
            <div className="flex-1 min-w-0 space-y-3">
              {filteredDetails.length > 0 ? (
                filteredDetails.map((detail) => {
                  const isPending = detail.status?.toLowerCase() === "pending";
                  return (
                    <div
                      key={detail.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg p-4 bg-gray-100 dark:bg-[#2a2d35] border border-gray-200 dark:border-[#35353E]"
                    >
                      {/* Logo */}
                      <img
                        src={
                          detail.logo_url ||
                          detail.logo ||
                          detail.provider_logo ||
                          "/default-provider-logo.svg"
                        }
                        alt={detail.payment_provider_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "/default-provider-logo.svg";
                        }}
                      />
                      {/* Account Name & Number - Grouped for better hierarchy */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                        {/* Account Name */}
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Account Name</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {detail.account_name}
                          </p>
                        </div>
                        {/* Phone/Account Number / Wallet */}
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {detail.payment_method_name?.toLowerCase().includes('mobile') || detail.payment_method_name?.toLowerCase().includes('money') ? 'Phone Number' : detail.wallet_address ? 'Wallet' : 'Account Number'}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {detail.account_number || detail.wallet_address || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Select/Remove/Pending Button - Consistent sizing */}
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        {selectedDetails.some((d) => d.id === detail.id) ? (
                          <button
                            onClick={() => onRemove?.(detail)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-md hover:bg-red-500/20 transition-colors"
                            type="button"
                            title="Deselect"
                            aria-label="Deselect"
                          >
                            <FaTimes className="w-4 h-4" /> Deselect
                          </button>
                        ) : isPending ? (
                          <span
                            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-500/20 dark:bg-amber-500/30 border border-amber-500/40 rounded-md cursor-not-allowed"
                            title="Pending verification. Select when approved."
                          >
                            Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelect(detail)}
                            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-[#1D8751] dark:text-[#1D8751] bg-[#1D8751]/20 dark:bg-[#1D8751]/30 border border-[#1D8751] rounded-md hover:bg-[#1D8751]/30 transition-colors"
                            type="button"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-start gap-3 rounded-xl p-4 bg-[#1D8751]/10 dark:bg-[#1D8751]/15 border border-[#1D8751]/25">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[#1D8751] shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {allMatchingSelected
                      ? "All accounts for this provider are already selected."
                      : hasAdminMethod
                        ? `No payment account found for ${selectedProvider}. Please add one first.`
                        : "No payment details found for this combination."}
                  </p>
                </div>
              )}
            </div>
            {/* Add Payment Method button */}
            {onAddPaymentMethod && (
              <button
                type="button"
                onClick={onAddPaymentMethod}
                className="w-full md:w-auto shrink-0 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D8751] hover:bg-[#166b3e] active:scale-[0.98] border border-[#1D8751] rounded-xl transition-all duration-150 shadow-sm"
              >
                Add Payment Method
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPaymentSelector;