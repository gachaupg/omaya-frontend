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

      {/* detail cards + Add button - shown when provider is selected */}
      {selectedProvider && (
        <div className="flex flex-col gap-4">
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-[#788099] font-medium italic">
            Newly added methods may show as pending until verified.
          </p>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            {/* Card(s) or empty state */}
            <div className="flex-1 w-full space-y-3">
              {filteredDetails.length > 0 ? (
                filteredDetails.map((detail) => {
                  const isPending = detail.status?.toLowerCase() === "pending";
                  return (
                    <div
                      key={detail.id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-[19px] p-4 bg-gray-50 dark:bg-[#1e2026] border border-gray-200 dark:border-[#35353E] hover:border-[#1D8751] dark:hover:border-[#1D8751] transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      {/* Logo & Info Header (Mobile optimization) */}
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative">
                          <img
                            src={
                              detail.logo_url ||
                              detail.logo ||
                              detail.provider_logo ||
                              "/default-provider-logo.svg"
                            }
                            alt={detail.payment_provider_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-[#2a2d35] shadow-sm"
                            onError={(e) => {
                              e.currentTarget.src = "/default-provider-logo.svg";
                            }}
                          />
                          {isPending && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-[#1e2026]" />
                          )}
                        </div>
                        <div className="sm:hidden flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Account Name</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {detail.account_name}
                          </p>
                        </div>
                      </div>

                      {/* Desktop Account Name */}
                      <div className="hidden sm:block min-w-0 flex-1">
                        <p className="text-[10px] text-gray-500 dark:text-[#788099] uppercase tracking-wider font-semibold mb-0.5">Account Name</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {detail.account_name}
                        </p>
                      </div>

                      {/* Phone/Account Number / Wallet */}
                      <div className="min-w-0 flex-1 w-full sm:w-auto">
                        <p className="text-[10px] text-gray-500 dark:text-[#788099] uppercase tracking-wider font-semibold mb-0.5">
                          {detail.payment_method_name?.toLowerCase().includes('mobile') || detail.payment_method_name?.toLowerCase().includes('money') ? 'Phone Number' : detail.wallet_address ? 'Wallet' : 'Account Number'}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate font-mono">
                          {detail.account_number || detail.wallet_address || 'N/A'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#35353E]">
                        {selectedDetails.some((d) => d.id === detail.id) ? (
                          <button
                            onClick={() => onRemove?.(detail)}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[12px] hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            type="button"
                          >
                            <FaTimes className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        ) : isPending ? (
                          <div
                            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-[12px] cursor-not-allowed flex items-center justify-center gap-2"
                            title="Pending verification."
                          >
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span>Pending</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelect(detail)}
                            className="w-full sm:w-auto px-6 py-2 text-sm font-bold text-white bg-[#1D8751] rounded-[12px] hover:bg-[#166b3e] transform active:scale-95 transition-all shadow-sm hover:shadow-md"
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
                <div className="flex flex-row items-center gap-4 rounded-[19px] p-6 bg-gray-50 dark:bg-[#1e2026] border border-dashed border-gray-300 dark:border-[#35353E]">
                  <p className="text-sm text-gray-600 dark:text-[#788099] flex-1 leading-relaxed text-center sm:text-left">
                    {allMatchingSelected
                      ? `All accounts for ${selectedProvider} have been selected. See Selected Payment Methods below.`
                      : hasAdminMethod
                        ? `No payment account found for ${selectedProvider}. Please add a payment account first to continue.`
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
                className="w-full lg:w-[220px] px-6 py-4 lg:py-8 flex flex-col items-center justify-center gap-3 text-sm font-bold text-white bg-linear-to-br from-[#1D8751] to-[#166b3e] hover:from-[#166b3e] hover:to-[#125832] rounded-[24px] shadow-lg hover:shadow-[#1D8751]/20 transition-all duration-300 group ring-4 ring-transparent hover:ring-[#1D8751]/10"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">+</span>
                </div>
                <span className="text-center">Add Payment Method</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPaymentSelector;