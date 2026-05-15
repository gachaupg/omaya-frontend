import { AppDispatch } from "@/store";
import { logout } from "@/features/auth/slices/authSlice";
import { clearDeviceSessionsError } from "@/features/settings/slices/settingsSlice";
import { clearPersistedDeviceSessionId } from "./deviceSessionStorage";
import { showToast } from "@/lib/utils/toast";

/**
 * Full local sign-out when this browser's device session was revoked remotely
 * (e.g. removed from Settings on mobile).
 */
export function performRemoteSessionLogout(
  dispatch: AppDispatch,
  toastMessage = "This device was signed out from another device."
) {
  if (typeof window === "undefined") return;

  clearPersistedDeviceSessionId();
  dispatch(clearDeviceSessionsError());
  dispatch(logout());

  const p2pAct = localStorage.getItem("p2p_act");
  localStorage.clear();
  if (p2pAct) {
    localStorage.setItem("p2p_act", p2pAct);
  }

  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie =
    "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie =
    "twoFA_enabled=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  sessionStorage.clear();

  showToast.info(toastMessage);

  window.location.replace("/auth/login");
}
