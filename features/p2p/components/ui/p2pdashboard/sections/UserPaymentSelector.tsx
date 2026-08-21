import React, { useState, useMemo, useEffect } from "react";
import CustomSelect from "@/components/ui/CustomSelect";
import { AdminPaymentMethod } from "@/features/p2p/types/paymentMethods";
import { getPaymentMethodSelectLabels } from "@/lib/utils/paymentProviderLabel";
import { FaTimes } from "react-icons/fa";
import {
  getPaymentRejectionReason,
  getPaymentStatusShortLabel,
  isApprovedPaymentStatus,
  isRejectedPaymentStatus,
} from "@/features/express/utils/paymentAccountStatus";

export interface UserPaymentDetail {
  id: number | string;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  provider_logo?: string;
  logo?: string;
  logo_url?: string;
  wallet_address?: string | null;
  allow_auto_send?: boolean;
  status?: string;
  /** Admin provided message when rejected/blocked */
  rejection_reason?: string | null;
  rejectionReason?: string | null;
  reason?: string | null;
  comment?: string | null;
  note?: string | null;
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
  /** When false, hides the Provider dropdown and shows all methods directly */
  showProviderSelect?: boolean;
  /** Renders next to Provider select with equal width (e.g. Time Limit) */
  renderAside?: React.ReactNode;
}

const getStatusActionClasses = (status?: string) => {
  if (isRejectedPaymentStatus(status)) {
    return "text-red-700 dark:text-red-400 bg-red-500/15 dark:bg-red-500/20 border-red-500/40";
  }
  return "text-amber-700 dark:text-amber-400 bg-amber-500/20 dark:bg-amber-500/30 border-amber-500/40";
};

// Dropdown-selector + card list for a user's saved payment details.
const UserPaymentSelector: React.FC<UserPaymentSelectorProps> = ({
  userPaymentDetails,
  adminMethods = [],
  onSelect,
  onRemove,
  selectedDetails,
  onAddPaymentMethod,
  onProviderSelect,
  hideSelected = false,
  showProviderSelect = true,
  renderAside,
}) => {
  const [selectedProvider, setSelectedProvider] = useState("");

  useEffect(() => {
    if (!showProviderSelect) {
      onProviderSelect?.(null);
      return;
    }
    onProviderSelect?.(selectedProvider || null);
  }, [selectedProvider, onProviderSelect, showProviderSelect]);

  const providerOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; subtitle?: string; logo?: string }> = [];

    adminMethods.forEach((m) => {
      if (m.provider_name && !seen.has(m.provider_name)) {
        seen.add(m.provider_name);
        const { label, subtitle } = getPaymentMethodSelectLabels(m);
        options.push({
          value: m.provider_name,
          label,
          subtitle,
          logo: m.logo_url || m.logo || undefined,
        });
      }
    });

    userPaymentDetails.forEach((d) => {
      if (d.payment_provider_name && !seen.has(d.payment_provider_name)) {
        seen.add(d.payment_provider_name);
        const logoUrl = d.logo_url || d.logo || d.provider_logo || undefined;
        const { label, subtitle } = getPaymentMethodSelectLabels({
          provider_name: d.payment_provider_name,
          short_name: (d as any).short_name,
        });
        options.push({
          value: d.payment_provider_name,
          label,
          subtitle,
          logo: logoUrl,
        });
      }
    });

    return options;
  }, [userPaymentDetails, adminMethods]);

  const filteredDetails = useMemo(
    () => {
      let details = showProviderSelect
        ? userPaymentDetails.filter((d) => d.payment_provider_name === selectedProvider)
        : [...userPaymentDetails];

      if (hideSelected) {
        details = details.filter(
          (d) => !selectedDetails.some((sd) => String(sd.id) === String(d.id))
        );
      }

      return details;
    },
    [userPaymentDetails, selectedProvider, selectedDetails, hideSelected, showProviderSelect]
  );

  const hasAdminMethod = useMemo(
    () =>
      adminMethods.some((m) => m.provider_name === selectedProvider),
    [adminMethods, selectedProvider]
  );

  const allMatchingSelected = useMemo(
    () =>
      hideSelected &&
      filteredDetails.length === 0 &&
      selectedDetails.some((d) => d.payment_provider_name === selectedProvider),
    [hideSelected, filteredDetails.length, selectedDetails, selectedProvider]
  );

  return (
    <div className="space-y-6">
      {showProviderSelect ? (
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
      ) : (
        renderAside && <div>{renderAside}</div>
      )}

      {(!showProviderSelect || selectedProvider) && (
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-[#788099]">
            Only approved payment methods can be selected. Pending or rejected
            methods update here automatically after verification.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
              {filteredDetails.length > 0 ? (
                filteredDetails.map((detail) => {
                  const isApproved = isApprovedPaymentStatus(detail.status);
                  const isRejected = isRejectedPaymentStatus(detail.status);
                  const statusLabel = getPaymentStatusShortLabel(detail.status);
                  const rejectionReason = getPaymentRejectionReason(detail);
                  const isSelected = selectedDetails.some(
                    (d) => String(d.id) === String(detail.id)
                  );

                  return (
                    <div
                      key={String(detail.id)}
                      className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 rounded-lg p-3 sm:p-4 bg-gray-100 dark:bg-[#2a2d35] border border-gray-200 dark:border-[#35353E]"
                    >
                      <span className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white dark:bg-[#1F2432]">
                        <img
                          src={
                            detail.logo_url ||
                            detail.logo ||
                            detail.provider_logo ||
                            "/default-provider-logo.svg"
                          }
                          alt={detail.payment_provider_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/default-provider-logo.svg";
                          }}
                        />
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Account Name</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {detail.account_name}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {detail.payment_method_name?.toLowerCase().includes('mobile') || detail.payment_method_name?.toLowerCase().includes('money') ? 'Phone Number' : detail.wallet_address ? 'Wallet' : 'Account Number'}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {detail.account_number || detail.wallet_address || 'N/A'}
                          </p>
                        </div>
                        {!isApproved && (
                          <div className="sm:col-span-2">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusActionClasses(detail.status)}`}
                            >
                              {statusLabel}
                            </span>
                            {isRejected && rejectionReason && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                Reason: {rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 w-full sm:w-auto">
                        {isSelected ? (
                          <button
                            onClick={() => onRemove?.(detail)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-md hover:bg-red-500/20 transition-colors"
                            type="button"
                            title="Deselect"
                            aria-label="Deselect"
                          >
                            <FaTimes className="w-4 h-4" /> Deselect
                          </button>
                        ) : !isApproved ? (
                          <span
                            className={`w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-md cursor-not-allowed ${getStatusActionClasses(detail.status)}`}
                            title={
                              isRejected
                                ? rejectionReason
                                  ? `Rejected: ${rejectionReason}`
                                  : "Rejected. Add another account or contact support."
                                : "Pending verification. Select when approved."
                            }
                          >
                            {statusLabel}
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
                <div className="flex flex-col gap-3 rounded-lg p-3 sm:p-4 bg-[#1D8751]/10 dark:bg-[#1D8751]/20 border border-[#1D8751]/30">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-left">
                    {showProviderSelect
                      ? hasAdminMethod || allMatchingSelected
                        ? `No payment account found for ${selectedProvider}. Please add a payment account first.`
                        : "No payment details found for this combination."
                      : "No payment methods found. Please add a payment method first."}
                  </p>
                </div>
              )}
            </div>
            {onAddPaymentMethod && (
              <button
                type="button"
                onClick={onAddPaymentMethod}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-[#1D8751] hover:bg-[#166b3e] border border-[#1D8751] rounded-md transition-colors flex-shrink-0 self-center mt-2 sm:mt-0"
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
