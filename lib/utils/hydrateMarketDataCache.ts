import type { AppDispatch } from "@/store";
import { sliceCache } from "@/lib/utils/sliceCache";
import { logger } from "@/lib/utils/logger";

const ACTIVE_PAYMENT_FILTER = (p: { is_active?: unknown }) =>
  p.is_active === undefined ||
  p.is_active === null ||
  p.is_active === true ||
  p.is_active === "true";

/**
 * Instantly hydrate Redux payment slices from IndexedDB so selects render
 * cached payment methods before the network round-trip completes.
 */
export async function hydratePaymentCacheFromIndexedDB(
  dispatch: AppDispatch
): Promise<void> {
  try {
    const [cachedAdmin, cachedUser, cachedPublic] = await Promise.all([
      sliceCache.get<unknown[]>("payment", "fetchAdminPaymentDetails"),
      sliceCache.get<unknown[]>("payment", "fetchUserPaymentDetails"),
      sliceCache.get<unknown>("paymentMethods", "fetchPublicPaymentMethods"),
    ]);

    if (Array.isArray(cachedAdmin) && cachedAdmin.length > 0) {
      dispatch({
        type: "payment/fetchAdminPaymentDetails/fulfilled",
        payload: cachedAdmin,
      });
      logger.debug("market-data", "Hydrated admin payment details from cache", {
        count: cachedAdmin.filter(ACTIVE_PAYMENT_FILTER).length,
      });
    }

    if (Array.isArray(cachedUser) && cachedUser.length > 0) {
      dispatch({
        type: "payment/fetchUserPaymentDetails/fulfilled",
        payload: cachedUser,
      });
      logger.debug("market-data", "Hydrated user payment details from cache", {
        count: cachedUser.length,
      });
    }

    if (cachedPublic != null) {
      dispatch({
        type: "paymentMethods/fetchPublicPaymentMethods/fulfilled",
        payload: cachedPublic,
      });
      logger.debug("market-data", "Hydrated public payment methods from cache");
    }
  } catch {
    // Non-fatal — network fetch will populate Redux
  }
}
