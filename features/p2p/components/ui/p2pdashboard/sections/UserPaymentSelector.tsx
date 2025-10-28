import React, { useState, useMemo } from "react";

export interface UserPaymentDetail {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  provider_logo?: string;
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
    const seen = new Set();
    return userPaymentDetails.filter((d) => {
      if (!seen.has(d.payment_method_name)) {
        seen.add(d.payment_method_name);
        return true;
      }
      return false;
    });
  }, [userPaymentDetails]);

  const providerOptions = useMemo(() => {
    const seen = new Set();
    return userPaymentDetails
      .filter((d) => d.payment_method_name === selectedMethod)
      .filter((d) => {
        if (!seen.has(d.payment_provider_name)) {
          seen.add(d.payment_provider_name);
          return true;
        }
        return false;
      });
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
    <div className="w-full">
      
      
      {/* dropdowns */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        {/* payment-method */}
        <div className="flex-1">
          <label className="block mb-1 text-sm text-gray-700 dark:text-[#788099]">
            Payment Method Type
          </label>
          <select
            className="w-full p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none"
            value={selectedMethod}
            onChange={(e) => {
              setSelectedMethod(e.target.value);
              setSelectedProvider("");
            }}
          >
            <option value="">Select Method Type</option>
            {methodOptions.map((d) => (
              <option key={d.payment_method_name} value={d.payment_method_name}>
                {d.payment_method_name}
              </option>
            ))}
          </select>
        </div>

        {/* provider */}
        {selectedMethod && (
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-700 dark:text-[#788099]">
              Provider
            </label>
            <select
              className="w-full p-3 rounded-[24px] bg-white dark:bg-[#18181D] border border-gray-300 dark:border-[#35353E] text-gray-900 dark:text-white focus:outline-none"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="">Select Provider</option>
              {providerOptions.map((d) => (
                <option
                  key={d.payment_provider_name}
                  value={d.payment_provider_name}
                >
                  {d.payment_provider_name}
                </option>
              ))}
            </select>
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
                className="flex items-center justify-between p-3 rounded-[24px] bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={detail.provider_logo || "/default-provider-logo.svg"}
                    alt={`${detail.payment_provider_name} logo`}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/default-provider-logo.svg";
                    }}
                  />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-[#788099]">
                      Account Name
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {detail.account_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-[#788099]">
                      Account Number
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {detail.account_number}
                    </p>
                  </div>
                </div>

                {isSelected(detail) ? (
                  <button
                    className="px-4 py-2 ml-4 text-white rounded-[16px] bg-[#E23D3A] hover:opacity-90"
                    onClick={() => onRemove(detail)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 ml-4 text-white rounded-[16px] bg-[#1D8751] hover:opacity-90"
                    onClick={() => onSelect(detail)}
                  >
                    Select
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-[#788099] bg-gray-50 dark:bg-[#23232B] rounded-[16px] border border-gray-200 dark:border-[#35353E]">
              No payment details found for this combination. Please add a payment method first.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPaymentSelector;
