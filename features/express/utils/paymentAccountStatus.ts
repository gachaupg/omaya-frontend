import { showToast } from "@/lib/utils/toast";

export type PaymentAccountLike = {
  status?: string | null;
  rejection_reason?: string | null;
  rejectionReason?: string | null;
  reason?: string | null;
  comment?: string | null;
  note?: string | null;
};

export const FROZEN_ACCOUNT_MESSAGE =
  "This account is frozen. Please contact Customer Support.";

export const normalizePaymentStatus = (status?: string | null) =>
  (status || "").toString().trim().toLowerCase();

export const isApprovedPaymentStatus = (status?: string | null) =>
  [
    "approved",
    "verified",
    "active",
    "enabled",
    "accepted",
    "completed",
    "success",
  ].includes(normalizePaymentStatus(status));

export const isFrozenPaymentStatus = (status?: string | null) => {
  const normalized = normalizePaymentStatus(status);
  return (
    normalized.includes("frozen") ||
    normalized.includes("freeze") ||
    normalized.includes("blocked") ||
    normalized.includes("suspend") ||
    normalized.includes("disabled")
  );
};

export const isRejectedPaymentStatus = (status?: string | null) => {
  const normalized = normalizePaymentStatus(status);
  return (
    normalized === "rejected" ||
    normalized === "declined" ||
    normalized === "failed"
  );
};

export const getPaymentRejectionReason = (
  detail?: PaymentAccountLike | null
): string | null => {
  if (!detail) return null;
  const raw =
    detail.rejection_reason ??
    detail.rejectionReason ??
    detail.reason ??
    detail.comment ??
    detail.note ??
    "";
  const trimmed = String(raw).trim();
  return trimmed || null;
};

export const getPaymentRestrictionMessage = (
  status?: string | null,
  rejectionReason?: string | null
) => {
  if (isFrozenPaymentStatus(status)) {
    return FROZEN_ACCOUNT_MESSAGE;
  }
  if (isRejectedPaymentStatus(status)) {
    const reason = rejectionReason?.trim();
    return reason
      ? `This payment method was rejected: ${reason}`
      : "This payment method was rejected. Please contact Customer Support or add a new account.";
  }
  return "Selected payment method is pending verification";
};

export const getPaymentStatusShortLabel = (status?: string | null) => {
  if (isFrozenPaymentStatus(status)) return "Frozen";
  if (isRejectedPaymentStatus(status)) return "Rejected";
  return "Pending";
};

export const getPaymentStatusBannerTitle = (status?: string | null) => {
  if (isFrozenPaymentStatus(status)) return "Account Frozen";
  if (isRejectedPaymentStatus(status)) return "Account Rejected";
  return "Account Pending Approval";
};

export const getPaymentStatusBannerStyle = (status?: string | null) => {
  if (isRejectedPaymentStatus(status)) {
    return {
      container: "bg-[#E23D3A]/10 border border-[#E23D3A]/40",
      accent: "text-[#E23D3A]",
      body: "text-[#E23D3A]/80",
    };
  }
  return {
    container: "bg-[#F79330]/10 border border-[#F79330]/40",
    accent: "text-[#F79330]",
    body: "text-[#F79330]/80",
  };
};

export const getPaymentStatusBannerLines = (
  status?: string | null,
  rejectionReason?: string | null
) => {
  if (isFrozenPaymentStatus(status)) {
    return {
      beforeLink: "is frozen. Please ",
      afterLink: "for assistance.",
    };
  }
  if (isRejectedPaymentStatus(status)) {
    const reasonSuffix = rejectionReason?.trim()
      ? ` Reason: ${rejectionReason.trim()}.`
      : "";
    return {
      beforeLink: `was rejected.${reasonSuffix} Please `,
      afterLink: "or add a new payment method.",
    };
  }
  return {
    beforeLink: "is pending approval. Please ",
    afterLink: "to get your account approved.",
  };
};

export const notifyPaymentMethodAddResult = (
  match?: PaymentAccountLike | null
) => {
  if (!match) {
    showToast.info("Payment method submitted and is pending approval.");
    return;
  }

  const status = match.status;
  if (isApprovedPaymentStatus(status)) {
    showToast.success("Payment method added successfully!");
    return;
  }

  if (isRejectedPaymentStatus(status)) {
    const reason = getPaymentRejectionReason(match);
    showToast.error(
      reason
        ? `Payment method was rejected: ${reason}`
        : "Payment method was rejected. Please contact support or try again."
    );
    return;
  }

  showToast.info("Payment method submitted and is pending approval.");
};

export const hasPaymentDetailMeaningfulChange = (
  current: PaymentAccountLike & {
    id?: number | string;
    account_name?: string;
    account_number?: string;
    wallet_address?: string | null;
  },
  fresh: PaymentAccountLike & {
    id?: number | string;
    account_name?: string;
    account_number?: string;
    wallet_address?: string | null;
  }
) =>
  String(current?.id) !== String(fresh.id) ||
  (current?.status ?? "") !== (fresh.status ?? "") ||
  getPaymentRejectionReason(current) !== getPaymentRejectionReason(fresh) ||
  (current?.account_name ?? "") !== (fresh.account_name ?? "") ||
  (current?.account_number ?? "") !== (fresh.account_number ?? "") ||
  (current?.wallet_address ?? "") !== (fresh.wallet_address ?? "");

export type PaymentBannerAccount = PaymentAccountLike & {
  id?: number | string;
  account_name?: string;
  account_number?: string;
  wallet_address?: string | null;
};

/** Pick the account whose status banner should be shown (follows current selection). */
export function resolvePaymentStatusBannerAccount<T extends PaymentBannerAccount>(
  filteredAccounts: T[],
  selectedAccount?: T | null
): T | undefined {
  if (selectedAccount) {
    return isApprovedPaymentStatus(selectedAccount.status)
      ? undefined
      : selectedAccount;
  }

  return filteredAccounts.find(
    (account) => account.status && !isApprovedPaymentStatus(account.status)
  );
};

/** Same as resolvePaymentStatusBannerAccount but re-reads status from the latest list. */
export function resolvePaymentStatusBannerAccountForSelection<
  T extends PaymentBannerAccount,
>(filteredAccounts: T[], selectedAccount?: T | null): T | undefined {
  const freshSelected = selectedAccount
    ? filteredAccounts.find(
        (account) => String(account.id) === String(selectedAccount.id)
      ) ?? selectedAccount
    : undefined;

  return resolvePaymentStatusBannerAccount(filteredAccounts, freshSelected);
};

export function shouldShowPaymentStatusBanner(
  account?: PaymentBannerAccount | null
): boolean {
  return !!account && !isApprovedPaymentStatus(account.status);
}

/** Lower = preferred for auto-select: approved → pending → other restricted → rejected. */
export function getPaymentAccountAutoSelectPriority(
  status?: string | null
): number {
  if (isApprovedPaymentStatus(status)) return 0;
  if (isRejectedPaymentStatus(status)) return 3;
  if (isFrozenPaymentStatus(status)) return 2;

  const normalized = normalizePaymentStatus(status);
  if (
    !normalized ||
    normalized === "pending" ||
    normalized.includes("review") ||
    normalized.includes("in review")
  ) {
    return 1;
  }

  if (status && !isApprovedPaymentStatus(status)) return 2;
  return 1;
}

export function pickPreferredPaymentAccountForAutoSelect<
  T extends PaymentBannerAccount,
>(accounts: T[]): T | undefined {
  if (!Array.isArray(accounts) || accounts.length === 0) return undefined;

  return [...accounts].sort(
    (a, b) =>
      getPaymentAccountAutoSelectPriority(a.status) -
      getPaymentAccountAutoSelectPriority(b.status)
  )[0];
}
