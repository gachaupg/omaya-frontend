import axios from "axios";
import { config } from "@/app.config";

export interface ReferralWallet {
  total_earned: number;
  total_withdrawn: number;
  balance: number;
}

export interface ReferredUser {
  email: string;
  name: string;
  id: string;
  joined: string;
  status: string;
}

class ReferralAPI {
  getReferredUsers = async (code: string): Promise<ReferredUser[]> => {
    const response = await axios.get(config.API.REFERRAL.USERS(code));
    return response.data;
  };

  getReferralWallet = async (): Promise<ReferralWallet> => {
    const response = await axios.get(config.API.REFERRAL.WALLET);
    return response.data;
  };
}

export const referralAPI = new ReferralAPI();
