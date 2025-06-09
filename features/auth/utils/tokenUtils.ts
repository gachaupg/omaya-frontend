import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  iat: number;
  jti: string;
  token_type: string;
  user_id: number;
}

export const isTokenValid = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("access_token");
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getTokenExpirationTime = (): number | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp;
  } catch (error) {
    return null;
  }
};
