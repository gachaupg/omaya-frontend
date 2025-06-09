import React, { useState, useMemo } from "react";

export interface UserPaymentDetail {
  id: number;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
}

interface UserPaymentSelectorProps {
  userPaymentDetails: UserPaymentDetail[];
  onSelect: (detail: UserPaymentDetail) => void;
  onRemove: (detail: UserPaymentDetail) => void;
  selectedDetails: UserPaymentDetail[];
}

const UserPaymentSelector: React.FC<UserPaymentSelectorProps> = ({
  userPaymentDetails,
  onSelect,
  onRemove,
  selectedDetails,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Get unique payment methods from userPaymentDetails
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

  // Get unique providers for the selected method from userPaymentDetails
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

  // Filter user payment details by selected method and provider
  const filteredDetails = useMemo(() => {
    return userPaymentDetails.filter(
      (d) =>
        d.payment_method_name === selectedMethod &&
        d.payment_provider_name === selectedProvider
    );
  }, [userPaymentDetails, selectedMethod, selectedProvider]);

  // Helper to check if a detail is selected
  const isSelected = (detail: UserPaymentDetail) =>
    selectedDetails.some((d) => d.id === detail.id);

  return (
    <div className="w-full">
    <div className="flex items-center justify-between gap-2">
        {/* Payment Method Dropdown */}
        <div className="mb-4 w-full">
        <label className="block text-[#788099] text-sm mb-1">Payment Method</label>
        <select
          className="w-full p-3 rounded-[24px] bg-[#18181D] border border-[#35353E] text-white"
          value={selectedMethod}
          onChange={(e) => {
            setSelectedMethod(e.target.value);
            setSelectedProvider("");
          }}
        >
          <option value="">Select Method</option>
          {methodOptions.map((d) => (
            <option key={d.payment_method_name} value={d.payment_method_name}>
              {d.payment_method_name}
            </option>
          ))}
        </select>
      </div>
      {/* Provider Dropdown */}
      {selectedMethod && (
        <div className="mb-4 w-full">
          <label className="block text-sm mb-1">Provider</label>
          <select
            className="w-full p-3 rounded-[24px] bg-[#18181D] border border-[#35353E] text-white"
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value);
            }}
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
      {/* Payment Details Cards */}
      {selectedMethod && selectedProvider && (
        <div className="space-y-2">
          {filteredDetails.map((detail) => (
            <div
              key={detail.id}
              className="flex items-center justify-between bg-[#23232B] rounded-[24px] p-3 border border-[#35353E]"
            >
              <div>
                <div className="text-xs text-[#788099]">Account Name</div>
                <div className="font-semibold text-white">
                  {detail.account_name}
                </div>
                <div className="text-xs text-[#788099] mt-1">
                  Account Number
                </div>
                <div className="font-semibold text-white">
                  {detail.account_number}
                </div>
              </div>
              {isSelected(detail) ? (
                <button
                  className="px-4 py-2 ml-4 text-white"
                  style={{ background: "#E23D3A", borderRadius: 16 }}
                  onClick={() => onRemove(detail)}
                >
                  Remove
                </button>
              ) : (
                <button
                  className="px-4 py-2 ml-4 text-white"
                  style={{ background: "#1D8751", borderRadius: 16 }}
                  onClick={() => onSelect(detail)}
                >
                  Select
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPaymentSelector;
