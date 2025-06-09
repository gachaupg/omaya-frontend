import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export const logout = () => {
  // Clear localStorage
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  // Clear cookies
  Cookies.remove("access_token");

  // Redirect to login page
  window.location.href = "/auth/login";
};
