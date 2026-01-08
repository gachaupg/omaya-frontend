import React, { useState, useMemo } from "react";
import CustomSelect from "@/components/ui/CustomSelect";

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
  onSelect: (detail: UserPaymentDetail) => void;
  onRemove: (detail: UserPaymentDetail) => void;
  selectedDetails: UserPaymentDetail[];
}

/**
 * Dropdown-selector + card list for a user’s saved payment details.
 * Pure UI – no business logic touched.  Added `dark:` utilities everywhere so the
 * component looks correct in both light & dark themes.
 */
const UserPaymentSelector: React.FC<UserPaymentSelectorProps> = ({
  userPaymentDetails,
  onSelect,
  onRemove,
  selectedDetails,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // ──────────────────────────────────────────────────────────────────────────────
  // memo helpers
  // ──────────────────────────────────────────────────────────────────────────────
  const methodOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; logo?: string }> = [];
    
    // Find the best logo for each unique payment method
    userPaymentDetails.forEach((d) => {
      if (!seen.has(d.payment_method_name)) {
        seen.add(d.payment_method_name);
        // Get logo with priority: logo_url > logo > provider_logo
        const logoUrl = d.logo_url || d.logo || d.provider_logo || undefined;
        options.push({
          value: d.payment_method_name,
          label: d.payment_method_name,
          logo: logoUrl,
        });
      }
    });
    
    return options;
  }, [userPaymentDetails]);

  const providerOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; logo?: string }> = [];
    
    userPaymentDetails
      .filter((d) => d.payment_method_name === selectedMethod)
      .forEach((d) => {
        if (!seen.has(d.payment_provider_name)) {
          seen.add(d.payment_provider_name);
          // Get logo with priority: logo_url > logo > provider_logo
          const logoUrl = d.logo_url || d.logo || d.provider_logo || undefined;
          options.push({
            value: d.payment_provider_name,
            label: d.payment_provider_name,
            logo: logoUrl,
          });
        }
      });
    
    return options;
  }, [userPaymentDetails, selectedMethod]);

  const filteredDetails = useMemo(
    () =>
      userPaymentDetails.filter(
        (d) =>
          d.payment_method_name === selectedMethod &&
          d.payment_provider_name === selectedProvider
      ),
    [userPaymentDetails, selectedMethod, selectedProvider]
  );

  const isSelected = (detail: UserPaymentDetail) =>
    selectedDetails.some((d) => d.id === detail.id);

  // ──────────────────────────────────────────────────────────────────────────────
  // render
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full" data-select-card="true">
      
      
      {/* dropdowns */}
      <div className="flex flex-col gap-3 sm:gap-2 sm:flex-row mb-4 w-full" data-select-card="true">
        {/* payment-method */}
        <div className="flex-1 w-full">
          <label className="block mb-1.5 sm:mb-1 text-xs sm:text-sm text-gray-700 dark:text-[#788099]">
            Payment Method Type
          </label>
          <div data-select-card="true" className="w-full">
            <CustomSelect
              options={methodOptions}
              value={selectedMethod}
              onChange={(value) => {
                setSelectedMethod(value);
                setSelectedProvider("");
              }}
              placeholder="Select Method Type"
              logoSize={32}
              logoClassName="rounded-full object-cover flex-shrink-0"
              className="w-full"
              sizeMode="card"
            />
          </div>
        </div>

        {/* provider */}
        {selectedMethod && (
          <div className="flex-1 w-full">
            <label className="block mb-1.5 sm:mb-1 text-xs sm:text-sm text-gray-700 dark:text-[#788099]">
              Provider
            </label>
            <div data-select-card="true" className="w-full">
              <CustomSelect
                options={providerOptions}
                value={selectedProvider}
                onChange={(value) => setSelectedProvider(value)}
                placeholder="Select Provider"
                logoSize={32}
                logoClassName="rounded-full object-cover flex-shrink-0"
                className="w-full"
                sizeMode="card"
              />
            </div>
          </div>
        )}
      </div>

      {/* detail cards */}
      {selectedMethod && selectedProvider && (
        <div className="space-y-2">
          {filteredDetails.length > 0 ? (
            filteredDetails.map((detail) => (
              <div
                key={detail.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-[16px] sm:rounded-[24px] bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E]"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Logo with priority: logo_url > logo > provider_logo */}
                  <img
                    src={detail.logo_url || detail.logo || detail.provider_logo || "/default-provider-logo.svg"}
                    alt={`${detail.payment_provider_name} logo`}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200 dark:border-[#35353E] flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "/default-provider-logo.svg";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 dark:text-[#788099] mb-0.5 sm:mb-1">
                      Account Name
                    </p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1.5 sm:mb-2 truncate">
                      {detail.account_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#788099] mb-0.5 sm:mb-1">
                      Account Number
                    </p>
                    <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {detail.account_number}
                    </p>
                  </div>
                </div>

                {isSelected(detail) ? (
                  <button
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-white rounded-[12px] sm:rounded-[16px] bg-[#E23D3A] hover:opacity-90 transition flex-shrink-0"
                    onClick={() => onRemove(detail)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-white rounded-[12px] sm:rounded-[16px] bg-[#1D8751] hover:opacity-90 transition flex-shrink-0"
                    onClick={() => onSelect(detail)}
                  >
                    Select
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 sm:p-4 text-xs sm:text-sm text-center text-gray-500 dark:text-[#788099] bg-gray-50 dark:bg-[#23232B] rounded-[16px] border border-gray-200 dark:border-[#35353E]">
              No payment details found for this combination. Please add a payment method first.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPaymentSelector;
