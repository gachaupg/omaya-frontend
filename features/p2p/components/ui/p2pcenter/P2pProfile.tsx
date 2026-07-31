import React, { useEffect, useMemo, useState, useRef } from "react";
import { formatNumber } from "@/utils/formatters";
import { formatCurrency } from "@/lib/globalFormatter";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import { fetchMerchantApplicationStatusThunk } from "@/features/p2p/slices/merchantSlice";
import { fetchFeedback } from "@/features/p2p/slices/feedbackSlice";
import { getUserProfile } from "@/features/auth/slices/authSlice";
import { getP2PProfileThunk } from "@/features/p2p/slices/orderSlice";
import {
  selectP2PWalletAmounts,
  selectTransactionSummary,
  selectWalletBalance,
} from "@/features/p2p/selectors";
import { useP2PWalletBalanceContext } from "@/features/p2p/context/P2PWalletBalanceProvider";
import { getP2PEscrowDisplay } from "@/features/p2p/walletAmounts";
import { mergeTransactionSummaries } from "@/lib/utils/normalizeTransactionSummary";
import { formatUserDisplayName } from "@/lib/utils/userDisplayName";

import { logger } from '@/lib/utils/logger';

const P2pProfile = ({
  wallets,
  summary,
  loading,
}: {
  wallets: any;
  summary: any;
  loading: any;
}) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, profile: userProfile } = useSelector(
    (state: RootState) => state.auth
  );
  const { status: merchantStatus } = useSelector(
    (state: RootState) => state.merchant
  );
  const { data: feedbackData } = useSelector(
    (state: RootState) => state.feedback
  );
  const p2pProfile = useSelector((state: RootState) => state.p2pMarket?.getP2PProfile);
  const profileFetchRef = useRef<{ hasFetched: boolean }>({ hasFetched: false });

  // Local state for profile image (more reliable than Redux state)
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    // Try to get cached image from localStorage on initial render
    if (typeof window !== "undefined") {
      return localStorage.getItem("p2p_profile_image") || null;
    }
    return null;
  });

  // Fetch merchant status, feedback, and user profile on component mount
  useEffect(() => {
    dispatch(fetchMerchantApplicationStatusThunk() as any);
    dispatch(fetchFeedback() as any);
    
    // Only fetch profiles once on mount, not on every userProfile/p2pProfile change
    if (isAuthenticated && !profileFetchRef.current.hasFetched) {
      profileFetchRef.current.hasFetched = true;
      
      // Fetch fresh user profile to ensure photo is synced - only if not already loaded
      if (!userProfile) {
        dispatch(getUserProfile());
      }
      
      // Also fetch P2P profile which has photo - only if not already loaded
      if (!p2pProfile?.profile) {
        dispatch(getP2PProfileThunk())
          .unwrap()
          .then((response: any) => {
            if (response?.profile?.photo) {
              setProfileImage(response.profile.photo);
              // Cache profile image to localStorage
              if (typeof window !== "undefined") {
                localStorage.setItem("p2p_profile_image", response.profile.photo);
              }
            }
          })
          .catch(() => {
            // If fetch fails, try to use cached image
            if (typeof window !== "undefined") {
              const cachedImage = localStorage.getItem("p2p_profile_image");
              if (cachedImage) {
                setProfileImage(cachedImage);
              }
            }
          });
      } else if (p2pProfile?.profile?.photo) {
        // Use existing P2P profile photo if available
        setProfileImage(p2pProfile.profile.photo);
      }
    } else if (p2pProfile?.profile?.photo && !profileImage) {
      // Use existing P2P profile photo if available (when component re-renders)
      setProfileImage(p2pProfile.profile.photo);
    }
  }, [dispatch, isAuthenticated]); // Removed userProfile and p2pProfile from deps to prevent loops

  // Sync profile image when p2pProfile becomes available from Redux (fetched elsewhere)
  useEffect(() => {
    if (p2pProfile?.profile?.photo && !profileImage) {
      setProfileImage(p2pProfile.profile.photo);
    }
  }, [p2pProfile?.profile?.photo, profileImage]);

  // Use profile.photo as fallback if profileImage is not set, also check user.photo
  const displayImage = profileImage || userProfile?.photo || (user as any)?.photo || null;

  // Force re-render when profile photo is updated
  const [profilePhotoKey, setProfilePhotoKey] = useState(0);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleProfilePhotoUpdate = () => {
      // Force component to re-render by updating key
      setProfilePhotoKey(prev => prev + 1);
    };
    
    window.addEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);
    
    // Also check localStorage in case profile was updated in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile_photo') {
        setProfilePhotoKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Calculate feedback statistics (support both array and { feedbacks } response)
  const feedbackList = Array.isArray(feedbackData)
    ? feedbackData
    : ((feedbackData as { feedbacks?: any[] } | null | undefined)?.feedbacks ?? []);
  const feedbackStats = useMemo(() => {
    const total = feedbackList.length;
    const positive = feedbackList.filter((f: any) => f?.is_positive).length;
    const positivePercentage = total > 0 ? ((positive / total) * 100).toFixed(1) : "0.0";

    return { total, positive, positivePercentage };
  }, [feedbackList]);
  
  logger.debug('p2p', "P2pProfile user:", user);
  logger.debug('p2p', "P2pProfile wallets:", wallets);
  logger.debug('p2p', "P2pProfile summary:", summary);

  const { balance: walletBalance, currency: walletCurrency } =
    useSelector(selectWalletBalance);
  const summaryFromStore = useSelector(selectTransactionSummary);
  const { balance: summaryBalance } = useSelector(selectP2PWalletAmounts);
  const wsWallet = useP2PWalletBalanceContext();
  const activeSummary = useMemo(
    () => mergeTransactionSummaries(summary ?? summaryFromStore, wsWallet.overviewSummary),
    [summary, summaryFromStore, wsWallet.overviewSummary]
  );

  const balanceDisplay =
    wsWallet.balance ??
    (activeSummary != null ? summaryBalance : walletBalance);

  const escrowDisplay = getP2PEscrowDisplay(wsWallet.escrow, activeSummary);

  const displayCurrency =
    (wsWallet.currency && wsWallet.currency.trim()) ||
    walletCurrency ||
    "USDT";

  return (
    <div className="w-full min-h-[110px] rounded-[24px] border-2 bg-white dark:bg-[var(--card-color)] border-gray-200 dark:border-[#35353E] flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-5 box-border gap-4 sm:gap-0">
      {/* Left Section */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* User Info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-[#1D8751] flex items-center justify-center">
              {displayImage ? (
                <img  
                  key={profilePhotoKey}
                  src={displayImage}
                  alt="User Avatar"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-initials')) {
                      const initials = document.createElement('div');
                      initials.className = 'fallback-initials text-white text-xl sm:text-2xl font-bold';
                      initials.textContent = user?.first_name?.charAt(0)?.toUpperCase() || 'U';
                      parent.appendChild(initials);
                    }
                  }}
                />
              ) : (
                <div className="text-white text-lg sm:text-xl font-semibold">
                  {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-900 dark:text-white text-base sm:text-lg font-semibold">
                {formatUserDisplayName(user?.first_name, user?.last_name, "User Name")}
              </span>
              {/* Edit Icon */}
              <button
                onClick={() => router.push("/dashboard/account")}
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors cursor-pointer active:scale-95"
                title="Edit Profile"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D8751]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>

          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Show Verified Merchant badge only if approved */}
            {merchantStatus?.is_merchant && merchantStatus?.status === 'approved' && (
              <span className="flex items-center text-xs sm:text-sm font-medium text-[#1D8751] bg-[#E0F2E8] dark:bg-[#384B41] border border-[#1D8751] rounded-full px-3 py-1">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Verified Merchant
              </span>
            )}

           
            
            {/* Show Pending badge if application is pending */}
            {merchantStatus?.status === 'pending' && (
              <span className="flex items-center text-xs sm:text-sm font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-3 py-1">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Application Pending
              </span>
            )}
            
            {/* Show button only if not approved or not pending */}
            {(!merchantStatus || (merchantStatus.status !== 'approved' && merchantStatus.status !== 'pending')) && (
              <button 
                onClick={() => router.push("/p2p/merchant")}
                className="bg-[#1D8751] text-white text-xs sm:text-sm font-semibold rounded-full px-4 sm:px-5 py-2 hover:bg-[#176e43] transition-colors"
              >
                {merchantStatus?.status === 'rejected' ? 'Reapply as Merchant' : 'Become Merchant PRO'}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Right Section */}
      <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
        <span className="text-[#1D8751] text-base sm:text-lg font-semibold">
          P2P Balance
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-gray-900 dark:text-white text-base sm:text-lg font-medium">
            {formatCurrency(balanceDisplay ?? 0, displayCurrency)}
          </span>
          <span className="text-gray-500 dark:text-[#7B8191] text-base sm:text-lg font-medium">
            ≈ {formatCurrency(balanceDisplay ?? 0, "USD")}
          </span>
        </div>
        <span className="text-gray-500 dark:text-[#7B8191] text-sm sm:text-base font-medium">
          In escrow:{" "}
          <span className="text-gray-900 dark:text-white font-medium">
            {formatCurrency(escrowDisplay ?? 0, displayCurrency)}
          </span>
        </span>
      </div>
    </div>
  );
};

export default P2pProfile;
