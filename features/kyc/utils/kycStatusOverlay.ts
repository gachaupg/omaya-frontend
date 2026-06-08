import type { KYCResponse } from "@/features/auth/types";

export type KycStatusOverlay = "submitted" | "approved" | "rejected" | null;

export function normalizeKycStatusValue(status?: unknown): string {
  return String(status || "").trim().toLowerCase();
}

export function isKycApproved(kycStatus: KYCResponse | null | undefined): boolean {
  if (!kycStatus) return false;
  const normalized = normalizeKycStatusValue(kycStatus.status);
  return (
    kycStatus.is_verified === true ||
    normalized === "approved" ||
    normalized === "verified"
  );
}

export function isKycRejected(kycStatus: KYCResponse | null | undefined): boolean {
  if (!kycStatus || isKycApproved(kycStatus)) return false;
  return normalizeKycStatusValue(kycStatus.status) === "rejected";
}

export function isKycWaiting(kycStatus: KYCResponse | null | undefined): boolean {
  if (!kycStatus || isKycApproved(kycStatus)) return false;
  const normalized = normalizeKycStatusValue(kycStatus.status);
  return (
    normalized === "waiting_approval" ||
    normalized === "under_review" ||
    normalized === "under review"
  );
}

export function resolveKycStatusOverlay(
  kycStatus: KYCResponse | null | undefined,
  options: {
    showSubmittedPrompt: boolean;
    dismissedSubmitted: boolean;
    dismissedApproved?: boolean;
    /** Only true after a live transition to approved — not on login with existing approval. */
    showApprovedCelebration?: boolean;
  }
): KycStatusOverlay {
  if (isKycApproved(kycStatus)) {
    if (options.dismissedApproved || !options.showApprovedCelebration) return null;
    return "approved";
  }
  if (isKycRejected(kycStatus)) return "rejected";

  if (
    !options.dismissedSubmitted &&
    (options.showSubmittedPrompt || isKycWaiting(kycStatus))
  ) {
    return "submitted";
  }

  return null;
}

export function kycStatusSnapshotKey(kycStatus: KYCResponse | null | undefined): string {
  if (!kycStatus) return "";
  return JSON.stringify({
    is_verified: kycStatus.is_verified,
    status: kycStatus.status,
    message: kycStatus.message,
    rejection_reason: kycStatus.rejection_reason,
  });
}

export function parseKycStatusSnapshotKey(
  snapshotKey: string | null | undefined
): Pick<KYCResponse, "is_verified" | "status"> | null {
  if (!snapshotKey) return null;
  try {
    const parsed = JSON.parse(snapshotKey) as Pick<
      KYCResponse,
      "is_verified" | "status"
    >;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const KYC_APPROVED_OVERLAY_DISMISSED_PREFIX = "kyc_approved_overlay_dismissed";

/** Stable id for per-user overlay persistence (API may send `user_id` or numeric `id`). */
export function resolveKycUserId(
  user?: { user_id?: string | number | null; id?: number | null } | null
): string | number | null {
  if (!user) return null;
  const userId = String(user.user_id ?? "").trim();
  if (userId) return userId;
  if (user.id != null) return user.id;
  return null;
}

function approvedOverlayDismissedKey(userId: string | number): string {
  return `${KYC_APPROVED_OVERLAY_DISMISSED_PREFIX}_${userId}`;
}

export function getKycApprovedOverlayDismissed(
  userId?: string | number | null
): boolean {
  if (userId == null || typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(approvedOverlayDismissedKey(userId)) === "1"
    );
  } catch {
    return false;
  }
}

export function setKycApprovedOverlayDismissed(
  userId: string | number | null | undefined,
  dismissed: boolean
): void {
  if (userId == null || typeof window === "undefined") return;
  try {
    const key = approvedOverlayDismissedKey(userId);
    if (dismissed) {
      localStorage.setItem(key, "1");
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    /* no-op */
  }
}
