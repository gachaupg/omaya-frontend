import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { API_BASE_URL } from "@/config/api";
import { getP2PProfileThunk } from "@/features/p2p/slices/orderSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchWallets } from "@/features/p2p/slices/walletSlice";
import {
  fetchTransactionSummary,
  selectTransactionSummary,
  selectTransactionSummaryLoading,
} from "@/features/p2p/slices/transactionSummarySlice";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { fetchReferredUsers } from "@/features/settings/slices/referralSlice";
import { fetchReferralWallet } from "@/features/settings/slices/referralWalletSlice";
import { formatNumber } from "@/utils/formatters";
import { formatCurrency, formatAmount } from "@/lib/globalFormatter";
import { useRouter } from "next/navigation";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

import { logger } from "@/lib/utils/logger";

// Resolve relative URLs (e.g. /media/...) to full API URL so images load
const resolvePhotoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== "string" || !url.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:")) return u;
  if (u.startsWith("/")) return `${API_BASE_URL.replace(/\/$/, "")}${u}`;
  return u;
};

const DefaultProfileIcon = () => (
  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-gray-200 dark:bg-[#35353E] border-2 border-white dark:border-[var(--card-color)]">
    <svg
      width="56"
      height="56"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="100"
        cy="100"
        r="100"
        fill="currentColor"
        className="text-gray-300 dark:text-[#4B5563]"
        stroke="currentColor"
        strokeWidth="4"
      />
      <g fill="currentColor" className="text-gray-400 dark:text-[#6B7280]">
        <circle cx="100" cy="75" r="25" />
        <path d="M100 110 C85 110, 60 120, 60 140 L60 160 C60 170, 65 175, 75 175 L125 175 C135 175, 140 170, 140 160 L140 140 C140 120, 115 110, 100 110 Z" />
      </g>
    </svg>
  </div>
);

interface StatsProps {
  onSupportClick?: () => void;
}

const Stats = ({ onSupportClick }: StatsProps) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, profile: userProfile } = useSelector(
    (state: RootState) => state.auth
  );
  const summary = useSelector(selectTransactionSummary);
  const { data: matchedTrades } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const { referredUsers } = useSelector(
    (state: RootState) => state.referral
  );
  const {
    data: referralWallet,
    loading: referralWalletLoading,
    error: referralWalletError,
  } = useSelector((state: RootState) => state.referralWallet);
  logger.debug('dashboard', "summary", summary);
  const [profileImage, setProfileImage] = useState("");

  const p2pProfile = useSelector((state: RootState) => state.p2pMarket?.getP2PProfile);
  const profileFetchRef = useRef<{ lastFetch: number; inProgress: boolean }>({ lastFetch: 0, inProgress: false });

  // Use same displayImage pattern as P2pProfile/UserCard - updates when Redux p2pProfile or auth profile changes
  const displayImage = profileImage || p2pProfile?.profile?.photo || userProfile?.photo || null;

  // Load cached profile photo from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem("profile_photo") || localStorage.getItem("p2p_profile_image");
    if (cached && cached.trim()) {
      setProfileImage(resolvePhotoUrl(cached));
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (p2pProfile?.profile?.photo) {
        setProfileImage(resolvePhotoUrl(p2pProfile.profile.photo));
        return;
      }
      const now = Date.now();
      if (!profileFetchRef.current.inProgress && (now - profileFetchRef.current.lastFetch > 30000)) {
        profileFetchRef.current.inProgress = true;
        profileFetchRef.current.lastFetch = now;
        dispatch(getP2PProfileThunk())
          .unwrap()
          .then((response) => {
            if (response?.profile?.photo) {
              setProfileImage(resolvePhotoUrl(response.profile.photo));
            }
          })
          .catch((error) => {
            console.error("Failed to fetch profile:", error);
          })
          .finally(() => {
            profileFetchRef.current.inProgress = false;
          });
      }
    }
  }, [dispatch, user, p2pProfile]);

  // Listen for profile photo updates from other components
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProfilePhotoUpdate = (event: CustomEvent) => {
      const newPhotoUrl = event.detail?.photoUrl;
      if (newPhotoUrl) {
        const resolved = resolvePhotoUrl(newPhotoUrl);
        if (!resolved) return;
        const url =
          resolved.startsWith("data:") ? resolved
          : resolved.includes("?") ? `${resolved}&t=${Date.now()}`
          : `${resolved}?t=${Date.now()}`;
        setProfileImage(url);
      }
    };

    window.addEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);

    // Also check localStorage in case profile was updated in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile_photo' && e.newValue) {
        const resolved = resolvePhotoUrl(e.newValue);
        if (!resolved) return;
        const url =
          resolved.startsWith("data:") ? resolved
          : resolved.includes("?") ? `${resolved}&t=${Date.now()}`
          : `${resolved}?t=${Date.now()}`;
        setProfileImage(url);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTransactionSummary());
      dispatch(fetchWallets());
      dispatch(fetchMatchedTrades(1));

      // Fetch referral data
      if (user?.referral_code) {
        dispatch(fetchReferredUsers(user.referral_code));
        dispatch(fetchReferralWallet()).catch((e) =>
          console.warn("Referral wallet API not available:", e)
        );
      }
    }
  }, [dispatch, isAuthenticated, user?.referral_code]);

  return (
    <Card className="w-full p-3 sm:p-4 dark:bg-(--card-color) bg-gray-50 rounded-2xl dark:border-accent border-gray-300 border dark:text-white text-gray-900 shadow-lg">
      {/* Header */}
      <div className="flex w-full flex-row items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {displayImage ? (
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden">
                <Image
                  src={resolvePhotoUrl(displayImage)}
                  alt="User avatar"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                  unoptimized={true}
                  onError={() => setProfileImage("")}
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <DefaultProfileIcon />

            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-[14px] font-semibold truncate max-w-xs sm:max-w-sm text-gray-900 dark:text-white">
              {user?.first_name}
            </span>
            <span className="flex items-center gap-1.5 text-[#1D8751] text-[8px] sm:text-xs font-medium whitespace-nowrap">
              <span className="shrink-0">Verified Profile</span>
              <span className="inline-flex items-center justify-center w-5 h-5 shrink-0" style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 20 20" style={{ position: 'absolute' }}>
                  <circle cx="10" cy="10" r="9" fill="white" />
                  <circle cx="10" cy="10" r="7.5" fill="#1D8751" />
                  {/* Serrated edge using small circles */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => {
                    const rad = (angle * Math.PI) / 180;
                    const x = 10 + 8.5 * Math.cos(rad);
                    const y = 10 + 8.5 * Math.sin(rad);
                    return <circle key={angle} cx={x} cy={y} r="1" fill="white" />;
                  })}
                </svg>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ position: 'relative', zIndex: 1 }}
                  className="shrink-0"
                >
                  <path
                    d="M2 5L4 7L8 3"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-3 sm:gap-6 shrink-0 items-center">
          <div
            className="p-2 rounded-full border border-[#1D8751] flex items-center justify-center relative cursor-pointer"
            onClick={() => router.push("/dashboard/notifications")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#1D8751]"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
            {matchedTrades?.results && matchedTrades.results.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#E23D3A] text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {matchedTrades.results.length}
              </span>
            )}
          </div>
          <div
            className="p-2 rounded-full border border-[#1D8751] flex items-center justify-center cursor-pointer"
            onClick={() => router.push("/contactUs/")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#1D8751]"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </div>
        </div>
      </div>

      {/* Total Volume - same as Overview */}
      <div className="mb-4 sm:mb-6">
        <div className="dark:text-[#788099] text-gray-600 text-sm sm:text-base font-medium">
          Total Volume
        </div>
        <div className="text-base sm:text-lg font-semibold mt-1 mb-2 text-muted-foreground dark:text-muted">
          {formatCurrency(summary?.total_volume ?? 0, "USD")}
        </div>
        <div className="border-b dark:border-accent border-border mt-2" />
      </div>

      {/* Deposits & Withdrawals - approved only, same as Overview */}
      <div className="mb-4 sm:mb-6">
        {/* Deposits - approved only */}
        <div className="mb-4">
          <div className="text-muted-foreground text-sm sm:text-base font-medium mb-1">
            Deposits
          </div>
          <div className="flex w-full items-center justify-between gap-3 mb-2">
            <div className="text-sm sm:text-base text-muted-foreground dark:text-muted font-medium">
              {formatCurrency(summary?.total_approved_p2p_deposits || 0)}
            </div>
          </div>
        </div>
        <div className="w-full h-4 sm:h-5 dark:bg-accent bg-gray-300 rounded-r-full mb-4">
          <div
            className={`h-4 sm:h-5 rounded-r-full ${(summary?.total_approved_p2p_deposits || 0) > 0
                ? "bg-[#1D8751]"
                : "bg-[#788099]"
              }`}
            style={{
              width: `${((summary?.total_approved_p2p_deposits || 0) /
                  ((summary?.total_approved_p2p_deposits || 0) +
                    (summary?.total_approved_p2p_withdrawals || 0))) *
                100
                }%`,
            }}
          />
        </div>
        {/* Withdrawals - approved only */}
        <div className="mb-4">
          <div className="text-muted-foreground text-sm sm:text-base font-medium mb-1">
            Withdrawals
          </div>
          <div className="flex w-full items-center justify-between gap-3 mb-2">
            <div className="text-sm sm:text-base text-muted-foreground dark:text-muted font-medium">
              {formatCurrency(summary?.total_approved_p2p_withdrawals || 0)}
            </div>
          </div>
        </div>
        <div className="w-full h-4 sm:h-5 dark:bg-accent bg-gray-300 rounded-r-full mb-4">
          <div
            className={`h-4 sm:h-5 rounded-r-full ${(summary?.total_approved_p2p_withdrawals || 0) > 0
                ? "bg-[#E23D3A]"
                : "bg-[#788099]"
              }`}
            style={{
              width: `${((summary?.total_approved_p2p_withdrawals || 0) /
                  ((summary?.total_approved_p2p_deposits || 0) +
                    (summary?.total_approved_p2p_withdrawals || 0))) *
                100
                }%`,
            }}
          />
        </div>
        <div className="border-b dark:border-accent border-gray-300 mt-2" />
      </div>

      {/* Referral Section */}
      <div className="mb-2">
        <div className="text-lg font-semibold mb-1 text-muted-foreground dark:text-muted">Referral</div>
        <div className="text-muted-foreground text-sm mb-3">
          Invite friends to earn commission money
        </div>
        <div className="border-b dark:border-accent border-gray-300 mb-3" />
        <div className="flex items-center justify-between mb-2">
          <span className="dark:text-[#788099] text-gray-600 text-sm">
            Users Invited:
          </span>
          <span className="text-[#1D8751] font-semibold">
            {referredUsers?.length || 0} Users
          </span>
        </div>
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="w-3 h-3 rounded-sm bg-[#1D8751] inline-block" />
              Deposits
            </span>
            <span className="font-medium text-accent dark:text-muted">
              {formatCurrency(referralWallet?.total_earned || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="w-3 h-3 rounded-sm bg-[#E23D3A] inline-block" />
              Withdrawals
            </span>
            <span className="font-medium text-accent dark:text-muted">
              {formatCurrency(referralWallet?.total_withdrawn || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="w-3 h-3 rounded-sm bg-[#3B82F6] inline-block" />
              Total
            </span>
            <span className="font-medium text-accent dark:text-muted">
              {formatCurrency((referralWallet?.total_earned || 0) + (referralWallet?.total_withdrawn || 0))}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Stats;