"use client";

import React, { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TransactionFromToCell } from "@/components/dashboard/ui/TransactionFromToCell";
import type { AllTransactionItem } from "@/features/transactions/api";
import type { FromToCellModel } from "@/lib/utils/transactionFromTo";
import { normalizeTransactionStatusForBadge } from "@/lib/utils/transactionFromTo";
import { formatDashboardTransactionWhen } from "@/lib/globalFormatter";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { resolveDashboardTransactionAssetImage } from "@/features/express/utils/imageHelpers";
import {
  UsdFlagIcon,
  isUsdOrMoneyXTransaction,
} from "@/components/dashboard/ui/UsdFlagIcon";
import { getDashboardTransactionAmounts } from "@/lib/utils/dashboardTransactionAmounts";
import { useDashboardTransactionUsdValues } from "@/features/transactions/hooks/useDashboardTransactionUsdValues";
import {
  downloadDashboardTransactionPdf,
  shareDashboardTransaction,
} from "@/lib/utils/dashboardTransactionReceipt";
import { showToast } from "@/lib/utils/toast";
import { formatDashboardDetailAmount } from "@/lib/utils/dashboardDetailAmount";
import { getNetworkDisplayName } from "@/lib/utils/networkDisplay";

export type DashboardTransactionDetailView = {
  tx: AllTransactionItem;
  from: FromToCellModel;
  to: FromToCellModel;
  assetTitle: string;
  assetSubtitle?: string;
  assetImageUrl?: string | null;
  typeLabel: string;
};

type DashboardTransactionDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  detail: DashboardTransactionDetailView | null;
};

function DetailRow({
  label,
  value,
  copyValue,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
  mono?: boolean;
}) {
  if (value === null || value === undefined || value === "" || value === "—") {
    return null;
  }
  const copy = copyValue?.trim();
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2.5 border-b border-gray-200 dark:border-[#35353E] last:border-0">
      <span className="text-xs sm:text-sm text-gray-500 dark:text-[#788099] shrink-0">
        {label}
      </span>
      <div className="flex items-start gap-2 min-w-0 sm:max-w-[65%] sm:justify-end">
        <span
          className={`text-sm text-gray-900 dark:text-white break-all text-left sm:text-right ${
            mono ? "font-mono text-xs" : "font-medium"
          }`}
        >
          {value}
        </span>
        {copy ? (
          <CopyButton
            value={copy}
            className="text-[#1D8751] shrink-0 p-1"
            showIcon
            showInlineMessage={false}
          />
        ) : null}
      </div>
    </div>
  );
}

export function DashboardTransactionDetailsModal({
  open,
  onClose,
  detail,
}: DashboardTransactionDetailsModalProps) {
  const { t } = useDashboardI18n();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const transactionUsdValues = useDashboardTransactionUsdValues(
    detail?.tx ? [detail.tx] : []
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !detail) return null;

  const { tx, from, to, assetTitle, assetSubtitle, typeLabel } = detail;
  const showUsdFlag = isUsdOrMoneyXTransaction(tx, assetTitle, typeLabel);
  const headerLogo = resolveDashboardTransactionAssetImage(tx);

  const whenLabel = formatDashboardTransactionWhen(tx.created_at);
  const amountDisplay = getDashboardTransactionAmounts(tx, {
    transactionUsdValues,
  });
  const hasComputedAmounts = !!(
    amountDisplay.assetAmount || amountDisplay.usdValue
  );
  const transactionId = String(
    tx.referral_withdrawal_id || tx.withdrawal_id || tx.id || ""
  ).trim();
  const payment = tx.payment_method;
  const addresses = [
    { label: t("transactions.depositAddress", "Deposit address"), value: tx.deposit_address },
    {
      label: t("transactions.withdrawalAddress", "Withdrawal address"),
      value: tx.withdrawal_address,
    },
    { label: t("transactions.fromAddress", "From address"), value: tx.from_address },
    { label: t("transactions.toAddress", "To address"), value: tx.to_address },
    {
      label: t("transactions.transactionHash", "Transaction hash"),
      value: tx.transaction_hash || tx.payout_hash,
    },
  ].filter((row) => String(row.value || "").trim());

  const handleDownloadPdf = async () => {
    if (!detail || pdfLoading) return;
    setPdfLoading(true);
    try {
      await downloadDashboardTransactionPdf(detail);
      showToast.success(
        t("transactions.pdfDownloaded", "Receipt downloaded"),
        t("transactions.pdfDownloadedHint", "Saved as PDF")
      );
    } catch {
      showToast.error(
        t("transactions.pdfDownloadFailed", "Download failed"),
        t("transactions.pdfDownloadFailedHint", "Could not create PDF. Try again.")
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    if (!detail || shareLoading) return;
    setShareLoading(true);
    try {
      await shareDashboardTransaction(detail);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      showToast.error(
        t("transactions.shareFailed", "Share failed"),
        t("transactions.shareFailedHint", "Could not share this transaction")
      );
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-tx-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 dark:bg-black/60"
        aria-label={t("common.close", "Close")}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#35353E] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#18181D]">
          <h2
            id="dashboard-tx-detail-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {t("transactions.viewDetails", "Transaction details")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-[#788099] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#23232A] transition-colors"
            aria-label={t("common.close", "Close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-[#35353E] p-4 space-y-3">
            <div className="flex items-center gap-3 min-w-0">
              {showUsdFlag ? (
                <UsdFlagIcon size={44} className="w-11 h-11 shrink-0" alt={assetTitle} />
              ) : (
                <div className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-[#23232A] border border-gray-200 dark:border-[#35353E] overflow-hidden">
                  <img
                    key={`${tx.id}-${headerLogo}`}
                    src={headerLogo}
                    alt={assetTitle}
                    className="max-w-[85%] max-h-[85%] w-auto h-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white uppercase truncate">
                  {assetTitle}
                </p>
                {assetSubtitle ? (
                  <p className="text-xs text-gray-500 dark:text-[#A0A3BC] mt-0.5 truncate">
                    {assetSubtitle}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-gray-200 dark:border-[#35353E]">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1D8751]/10 text-[#1D8751]">
                {typeLabel}
              </span>
              <StatusBadge
                status={normalizeTransactionStatusForBadge(tx.status)}
              />
              {whenLabel && whenLabel !== "-" ? (
                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#A0A3BC] whitespace-nowrap">
                  {whenLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-[#35353E] px-4">
            <DetailRow
              label={t("transactions.transactionId", "Transaction ID")}
              value={transactionId || "—"}
              copyValue={transactionId}
              mono
            />
            <DetailRow
              label={t("transactions.when", "Date")}
              value={whenLabel !== "-" ? whenLabel : undefined}
            />
            {amountDisplay.assetAmount ? (
              <DetailRow
                label={t("transactions.assetAmount", "Asset amount")}
                value={amountDisplay.assetAmount}
              />
            ) : null}
            {amountDisplay.usdValue ? (
              <DetailRow
                label={t("transactions.usdValue", "USD value")}
                value={amountDisplay.usdValue}
              />
            ) : null}
            {!hasComputedAmounts ? (
              <DetailRow
                label={t("transactions.amount", "Amount")}
                value={formatDashboardDetailAmount(tx.amount)}
              />
            ) : null}
            {!hasComputedAmounts ? (
              <DetailRow
                label={t("transactions.netAmount", "Net amount")}
                value={formatDashboardDetailAmount(tx.net_amount)}
              />
            ) : null}
            <DetailRow
              label={t("transactions.commission", "Commission / fees")}
              value={formatDashboardDetailAmount(tx.commission)}
            />
            {tx.to_amount ? (
              <DetailRow
                label={t("transactions.receivedAmount", "Received amount")}
                value={formatDashboardDetailAmount(tx.to_amount)}
              />
            ) : null}
            {tx.network ? (
              <DetailRow
                label={t("transactions.network", "Network")}
                value={getNetworkDisplayName(tx.network)}
              />
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-[#35353E] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#788099]">
              {t("transactions.fromTo", "From / To")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1.5">
                  {t("transactions.from", "From")}
                </p>
                <TransactionFromToCell
                  label={from.label}
                  subLabel={from.subLabel}
                  copyValue={from.copyValue}
                  iconUrl={from.iconUrl}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#A0A3BC] mb-1.5">
                  {t("transactions.to", "To")}
                </p>
                <TransactionFromToCell
                  label={to.label}
                  subLabel={to.subLabel}
                  copyValue={to.copyValue}
                  iconUrl={to.iconUrl}
                />
              </div>
            </div>
          </div>

          {payment?.provider || payment?.account_number || payment?.account_name ? (
            <div className="rounded-xl border border-gray-200 dark:border-[#35353E] px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#788099] py-3 border-b border-gray-200 dark:border-[#35353E]">
                {t("transactions.paymentMethod", "Payment method")}
              </p>
              <DetailRow
                label={t("transactions.provider", "Provider")}
                value={payment.provider}
              />
              <DetailRow
                label={t("transactions.accountName", "Account name")}
                value={payment.account_name}
              />
              <DetailRow
                label={t("transactions.accountNumber", "Account number")}
                value={payment.account_number}
                copyValue={payment.account_number || undefined}
                mono
              />
            </div>
          ) : null}

          {addresses.length > 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-[#35353E] px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#788099] py-3 border-b border-gray-200 dark:border-[#35353E]">
                {t("transactions.addresses", "Addresses")}
              </p>
              {addresses.map((row) => (
                <DetailRow
                  key={row.label}
                  label={row.label}
                  value={String(row.value)}
                  copyValue={String(row.value)}
                  mono
                />
              ))}
            </div>
          ) : null}

          {tx.reason ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 py-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                {t("transactions.reason", "Reason")}
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 break-words">
                {tx.reason}
              </p>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex flex-col sm:flex-row gap-2 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-[#35353E] bg-white dark:bg-[#18181D]">
          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={pdfLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1D8751] hover:bg-[#17693F] disabled:opacity-60 transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden />
            {pdfLoading
              ? t("transactions.downloadingPdf", "Downloading…")
              : t("transactions.downloadPdf", "Download PDF")}
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={shareLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1D8751] border border-[#1D8751] bg-[#1D8751]/10 hover:bg-[#1D8751]/20 dark:hover:bg-[#1D8751]/25 disabled:opacity-60 transition-colors"
          >
            <Share2 className="w-4 h-4 shrink-0" aria-hidden />
            {shareLoading
              ? t("transactions.sharing", "Sharing…")
              : t("transactions.share", "Share")}
          </button>
        </div>
      </div>
    </div>
  );
}
