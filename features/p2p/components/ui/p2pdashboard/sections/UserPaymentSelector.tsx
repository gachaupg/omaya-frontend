import React, { useState, useMemo } from "react";
import CustomSelect from "@/components/ui/CustomSelect";
import { AdminPaymentMethod } from "@/features/p2p/types/paymentMethods";

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
  onRemove: (detail: UserPaymentDetail) => void;
  selectedDetails: UserPaymentDetail[];
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
}) => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");

  // Memoized options for payment methods - show all admin methods first, then user methods
  const methodOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; logo?: string }> = [];
    
    // First, add all admin payment method types
    adminMethods.forEach((m) => {
      if (m.payment_method_type && !seen.has(m.payment_method_type)) {
        seen.add(m.payment_method_type);
        options.push({
          value: m.payment_method_type,
          label: m.payment_method_type,
          logo: m.logo_url || m.logo || undefined,
        });
      }
    });
    
    // Then, add user payment methods that aren't already in the list
    userPaymentDetails.forEach((d) => {
      if (d.payment_method_name && !seen.has(d.payment_method_name)) {
        seen.add(d.payment_method_name);
        const logoUrl = d.logo_url || d.logo || d.provider_logo || undefined;
        options.push({
          value: d.payment_method_name,
          label: d.payment_method_name,
          logo: logoUrl,
        });
      }
    });
    
    return options;
  }, [userPaymentDetails, adminMethods]);

  // Memoized options for providers - show all admin providers first, then user providers
  const providerOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; logo?: string }> = [];
    
    // First, add all admin providers for the selected method
    adminMethods
      .filter((m) => m.payment_method_type === selectedMethod)
      .forEach((m) => {
        if (m.provider_name && !seen.has(m.provider_name)) {
          seen.add(m.provider_name);
          options.push({
            value: m.provider_name,
            label: m.provider_name,
            logo: m.logo_url || m.logo || undefined,
          });
        }
      });
    
    // Then, add user providers for the selected method
    userPaymentDetails
      .filter((d) => d.payment_method_name === selectedMethod)
      .forEach((d) => {
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
  }, [userPaymentDetails, adminMethods, selectedMethod]);

  // Filtered details for selected method and provider - show user payment details
  const filteredDetails = useMemo(
    () =>
      userPaymentDetails.filter(
        (d) =>
          d.payment_method_name === selectedMethod &&
          d.payment_provider_name === selectedProvider
      ),
    [userPaymentDetails, selectedMethod, selectedProvider]
  );
  
  // Check if there are admin methods for the selected provider (to show "Add Account" message)
  const hasAdminMethod = useMemo(
    () =>
      adminMethods.some(
        (m) =>
          m.payment_method_type === selectedMethod &&
          m.provider_name === selectedProvider
      ),
    [adminMethods, selectedMethod, selectedProvider]
  );

  // Check if detail is selected
  const isSelected = (detail: UserPaymentDetail) =>
    selectedDetails.some((d) => d.id === detail.id);

  return (
    <div className="space-y-6">
      {/* dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* payment-method */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method Type
          </label>
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

        {/* provider */}
        {selectedMethod && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Provider
            </label>
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
        )}
      </div>

      {/* detail cards */}
      {selectedMethod && selectedProvider && (
        <div className="space-y-4">
          {filteredDetails.length > 0 ? (
            filteredDetails.map((detail) => (
              <div
                key={detail.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Logo with priority: logo_url > logo > provider_logo */}
                    <img
                      src={
                        detail.logo_url ||
                        detail.logo ||
                        detail.provider_logo ||
                        "/default-provider-logo.svg"
                      }
                      alt={detail.payment_provider_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/default-provider-logo.svg";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Account Name
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {detail.account_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Account Number
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {detail.account_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isSelected(detail) ? (
                    <button
                      onClick={() => onRemove(detail)}
                      className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelect(detail)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                {hasAdminMethod
                  ? `No payment account found for ${selectedProvider}. Please add a payment account first.`
                  : "No payment details found for this combination. Please add a payment method first."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPaymentSelector;