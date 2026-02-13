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

      {/* detail cards + Add button - shown when provider is selected, in a row */}
      {selectedProvider && (
        <div className="flex flex-row flex-wrap items-start gap-4">
          {/* Card(s) or empty state */}
          <div className="flex-1 min-w-0 space-y-4">
            {filteredDetails.length > 0 ? (
              filteredDetails.map((detail) => (
                <div
                  key={detail.id}
                  className="flex flex-row flex-wrap items-center gap-4 rounded-lg p-4 bg-[#1D8751]/10 dark:bg-[#1D8751]/20 border border-[#1D8751]/30"
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
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "/default-provider-logo.svg";
                    }}
                  />
                  {/* Account Name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Account Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {detail.account_name}
                    </p>
                  </div>
                  {/* Phone/Account Number */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {detail.payment_method_name?.toLowerCase().includes('mobile') || detail.payment_method_name?.toLowerCase().includes('money') ? 'Phone Number' : 'Account Number'}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {detail.account_number}
                    </p>
                  </div>
                  {/* Select / X / Pending on same card */}
                  {selectedDetails.some((d) => d.id === detail.id) ? (
                    <button
                      onClick={() => onRemove?.(detail)}
                      className="p-2 text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-md hover:bg-red-500/20 transition-colors flex-shrink-0"
                      type="button"
                      title="Deselect"
                      aria-label="Deselect"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  ) : (detail.status?.toLowerCase() === "pending") ? (
                    <span className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md flex-shrink-0 cursor-default">
                      Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelect(detail)}
                      className="px-4 py-2 text-sm font-medium text-[#1D8751] dark:text-[#1D8751] bg-[#1D8751]/20 dark:bg-[#1D8751]/30 border border-[#1D8751] rounded-md hover:bg-[#1D8751]/30 transition-colors flex-shrink-0"
                      type="button"
                    >
                      Select
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-row flex-wrap items-center gap-4">
                <div className="rounded-lg px-4 py-3 bg-[#1D8751]/10 dark:bg-[#1D8751]/20 border border-[#1D8751]/30">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the button to add a payment method
                  </p>
                </div>
                {onAddPaymentMethod && (
                  <button
                    type="button"
                    onClick={onAddPaymentMethod}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#1D8751] hover:bg-[#166b3e] border border-[#1D8751] rounded-md transition-colors flex-shrink-0"
                  >
                    Add Payment Method
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Add Payment Method button - only when we have cards (empty state has its own button) */}
          {filteredDetails.length > 0 && onAddPaymentMethod && (
            <button
              type="button"
              onClick={onAddPaymentMethod}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1D8751] hover:bg-[#166b3e] border border-[#1D8751] rounded-md transition-colors flex-shrink-0 self-center"
            >
              Add Payment Method
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPaymentSelector;