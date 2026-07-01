import type { AppDispatch } from "@/store";
import {
  fetchAdminWalletList,
  fetchUserPaymentDetails,
} from "@/features/exchange/slices/paymentSlice";
import { withTimeout } from "@/lib/utils/fetchWithTimeout";

export type RegisteredAccountDetail = {
  id: number;
  user_payment_detail_id?: string;
  payment_provider_name?: string;
  payment_method_name?: string;
  account_name?: string;
  account_number?: string;
  wallet_address?: string | null;
  provider_logo?: string | null;
  status?: string;
  provider_name?: string;
  payment_provider?: string;
  created_at?: string;
};

/** Prefer cached display list, then live Redux fallback. */
export function resolveAllUserPaymentAccounts(
  displayData: RegisteredAccountDetail[] | null | undefined,
  fallback: RegisteredAccountDetail[] | null | undefined
): RegisteredAccountDetail[] {
  if (Array.isArray(displayData) && displayData.length > 0) {
    return displayData;
  }
  return Array.isArray(fallback) ? fallback : [];
}

/** Accounts for the registered-account dropdown — only the selected provider's rows. */
export function getRegisteredAccountDropdownList(
  _allUserAccounts: RegisteredAccountDetail[],
  filteredForProvider: RegisteredAccountDetail[]
): RegisteredAccountDetail[] {
  return filteredForProvider;
}

type AddedPaymentPayload = {
  account_number?: string;
  wallet_address?: string | null;
  payment_provider_name?: string;
  provider_name?: string;
  account_name?: string;
};

/** Match a freshly added account after the modal closes. */
export function findAddedPaymentDetail(
  accounts: RegisteredAccountDetail[] | null | undefined,
  added?: AddedPaymentPayload | null
): RegisteredAccountDetail | undefined {
  if (!Array.isArray(accounts) || accounts.length === 0) return undefined;

  if (added && typeof added === "object") {
    const accountNumber = String(
      added.account_number || added.wallet_address || ""
    ).trim();
    const provider = String(
      added.payment_provider_name || added.provider_name || ""
    )
      .trim()
      .toLowerCase();

    const exact = accounts.find((account) => {
      const num = String(
        account.account_number || account.wallet_address || ""
      ).trim();
      const prov = String(
        account.payment_provider_name ||
          account.provider_name ||
          account.payment_provider ||
          ""
      )
        .trim()
        .toLowerCase();
      if (accountNumber && num && num === accountNumber) {
        return !provider || !prov || prov === provider;
      }
      return false;
    });
    if (exact) return exact;
  }

  return accounts[accounts.length - 1];
}

/** Refresh user payment accounts after adding one; admin wallet fetch is best-effort. */
export async function refreshRegisteredAccountsAfterAdd(
  dispatch: AppDispatch
): Promise<RegisteredAccountDetail[]> {
  const accounts = await withTimeout(
    dispatch(fetchUserPaymentDetails(true)).unwrap(),
    15_000
  );
  void dispatch(fetchAdminWalletList(true)).catch(() => undefined);
  return Array.isArray(accounts) ? accounts : [];
}
