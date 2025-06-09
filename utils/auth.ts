import axios from "axios";
import { API_BASE_URL } from "@/config/api";

export const refreshToken = async (refresh: string) => {
  return axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
};
