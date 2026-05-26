"use client";

import Button from "@/features/p2p/components/Common/Button";
import Card from "@/features/p2p/components/Common/Card";
import CopyButton from "@/components/ui/CopyButton";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { showToast } from "@/lib/utils/toast";
import { fetchLatestMatchedTradesPage } from "@/features/p2p/slices/matchedTradesSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { useRouter } from "next/navigation";
import {
  updateProfileThunk,
  getP2PProfileThunk,
} from "@/features/p2p/slices/orderSlice";
import { getUserProfile } from "@/features/auth/slices/authSlice";
import HelpSupportForm from "@/features/settings/components/HelpSupportForm";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { selectPendingMatchedTradeNotificationCount } from "@/features/p2p/selectors";
import { useMatchedTradesWsConnected } from "@/features/p2p/components/MatchedTradesWebSocketProvider";
import { logger } from "@/lib/utils/logger";
import { checkKYCStatus } from "@/features/kyc/slices/kycSlice";

function UserCard() {
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { t } = useDashboardI18n();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const pendingNotificationCount = useSelector(
    selectPendingMatchedTradeNotificationCount
  );
  const kycState = useSelector((state: RootState) => state.kyc);
  // KYC verification status from central KYC slice
  const isVerified = kycState.isVerified ?? false;
  const wsConnected = useMatchedTradesWsConnected();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchLatestMatchedTradesPage());
      dispatch(getP2PProfileThunk())
        .unwrap()
        .then((response) => {
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
        })
        .catch((error) => { });

      // Ensure KYC status (is_verified) is up to date
      dispatch(checkKYCStatus());
    }
  }, [dispatch, isAuthenticated]);

  // Listen for profile photo updates from other components
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleProfilePhotoUpdate = (event: CustomEvent) => {
      const newPhotoUrl = event.detail?.photoUrl;
      if (newPhotoUrl) {
        // Add cache-busting parameter to force browser to reload the image
        const photoWithTimestamp = newPhotoUrl.includes('?') 
          ? `${newPhotoUrl}&t=${Date.now()}`
          : `${newPhotoUrl}?t=${Date.now()}`;
        setProfileImage(photoWithTimestamp);
      }
    };
    
    window.addEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);
    
    // Also check localStorage in case profile was updated in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile_photo' && e.newValue) {
        const photoWithTimestamp = e.newValue.includes('?') 
          ? `${e.newValue}&t=${Date.now()}`
          : `${e.newValue}?t=${Date.now()}`;
        setProfileImage(photoWithTimestamp);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error(
          t("userCard.imageSizeError", "Image size should be less than 5MB")
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setProfileImage(base64Image);

        try {
          const formData = new FormData();
          formData.append("photo", file);

          await dispatch(updateProfileThunk(formData)).unwrap();
          // Refetch P2P profile to get updated photo in this card
          const response = await dispatch(getP2PProfileThunk()).unwrap();
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
          // Also refresh main auth profile so navbar/other pages update without reload
          await dispatch(getUserProfile()).unwrap();
          showToast.success(
            t(
              "userCard.profileImageUpdated",
              "Profile image updated successfully"
            )
          );
        } catch (error: any) {
          showToast.error(
            error?.message ||
            t("userCard.updateError", "Failed to update profile image")
          );
          // Revert the image if update fails
          setProfileImage(
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E"
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mx-2 sm:mx-0">
      <Card
        borderColor="border-border dark:border-accent"
        width="w-full"
        bgColor="bg-card"
        borderRadius="rounded-xl sm:rounded-xl lg:rounded-[20px]"
        className="p-0 sm:p-3 lg:p-2 bg-card overflow-hidden"
      >
        {showHelpSupport ? (
          <div className="w-full mt-2 px-4 sm:px-0">
            <button
              className="mb-4 px-4 py-2 bg-gray-200 text-[#1D8751] font-medium text-sm hover:bg-[#1D8751]/10 dark:bg-[#2C2C32] rounded"
              onClick={() => setShowHelpSupport(false)}
            >
              {t("userCard.back", "Back")}
            </button>
            <HelpSupportForm />
          </div>
        ) : (
          <div className="flex flex-row items-center justify-between w-full gap-2 sm:gap-4 lg:gap-6 min-w-0 px-4 sm:px-0 py-2 sm:py-0 overflow-hidden">
            {/* Left Side: Avatar, User Info, User ID, User Type */}
            <div className="flex flex-row items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                {/* User Avatar with Edit Button */}
                <div className="relative shrink-0 z-10">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full overflow-hidden relative">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="User avatar"
                        width={56}
                        height={56}
                        className="h-full w-full object-cover object-center"
                        unoptimized={true}
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement, Event>
                        ) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#35353E] flex items-center justify-center">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                            className="stroke-[#788099]"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="7"
                            r="4"
                            className="stroke-[#788099] dark:stroke-[#788099]"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1D8751] flex items-center justify-center cursor-pointer hover:bg-[#16663d] transition-colors shrink-0 z-20"
                    onClick={handleImageClick}
                    aria-label="Edit profile picture"
                  >
                    <svg
                      width="12"
                      height="12"
                      className="sm:w-[14px] sm:h-[14px] lg:w-[16px] lg:h-[16px] stroke-[#FFFFFF]"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 3L21 8L8 21L3 21L3 16L16 3Z"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                {/* User Info */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 overflow-hidden">
                    <h2 className="text-sm sm:text-base lg:text-lg font-semibold dark:text-[#FFFFFF] text-[#0D0D0D] truncate" title={user?.first_name || user?.last_name ? `Hello, ${user.first_name} ${user.last_name}!` : undefined}>
                      {t("userCard.hello", "Hello, {{name}}!", {
                        name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User",
                      })}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 shrink-0 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm lg:text-sm whitespace-nowrap shrink-0 font-medium ${isVerified ? "text-[#1D8751]" : "text-[#E23D3A]"
                        }`}
                    >
                      {isVerified
                        ? t("userCard.verifiedProfile", "Verified Profile")
                        : t("userCard.unverifiedProfile", "Unverified Profile")}
                    </span>
                    {isVerified && (
                      <span className="inline-flex items-center justify-center w-5 h-5 shrink-0" style={{ position: 'relative' }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute' }}>
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
                    )}
                  </div>
                </div>
              </div>

              {/* Flexible Info Group (User ID + Type) - hidden on very small screens */}
              <div className="hidden sm:flex flex-row flex-wrap items-center gap-4 sm:gap-6 md:w-auto">
                {/* User ID */}
                <div className="shrink-0 min-w-0">
                  <p className="text-xs text-[#788099] mb-1">
                    {t("userCard.userId", "User ID")}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="text-sm sm:text-base lg:text-base dark:text-[#FFFFFF] break-all sm:break-normal">
                      {user?.user_id}
                    </p>
                    <div className="shrink-0 min-h-[44px] sm:min-h-[36px] lg:min-h-0 w-[44px] sm:w-auto sm:h-auto flex items-center justify-center">
                      <CopyButton
                        value={user?.user_id || ""}
                        className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-110 text-[#F79330] touch-manipulation"
                        showIcon={true}
                      />
                    </div>
                  </div>
                </div>

                {/* User Type */}
                <div className="shrink-0 min-w-0">
                  <p className="text-xs text-[#788099] mb-1">
                    {t("userCard.userType", "User Type")}
                  </p>
                  <div className="flex items-center min-h-[44px] sm:min-h-[36px] lg:min-h-0">
                    <p className="text-sm sm:text-base lg:text-base dark:text-[#FFFFFF]">
                      {(() => {
                        const userType = user?.user_type || t("userCard.individual", "Individual");
                        return userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : '';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Action Buttons (responsive) - compact on mobile */}
            <div className="flex flex-row items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center p-0 min-w-9 min-h-9 w-9 h-9 sm:min-w-10 sm:min-h-10 sm:w-10 sm:h-10 rounded-full shrink-0 flex-shrink-0 aspect-square overflow-hidden"
                onClick={() => router.push("/dashboard/notifications")}
                icon={
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#1D8751] flex items-center justify-center p-1 relative shrink-0">

                    <svg
                    
                      width="14"
                      height="14"
                      className="sm:w-4 sm:h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                        className="stroke-[#1D8751]"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                        className="stroke-[#1D8751]"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {pendingNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#E23D3A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingNotificationCount}
                        </span>
                      )}
                    {/* WebSocket connection indicator */}
                    {wsConnected ? (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#1D8751] rounded-full border border-white dark:border-[#18181D]"
                        title="Real-time WebSocket updates active"
                      />
                    ) : (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#F79330] rounded-full border border-white dark:border-[#18181D]"
                        title="Using HTTP polling (WebSocket unavailable)"
                      />
                    )}
                  </div>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center p-0 min-w-9 min-h-9 w-9 h-9 sm:min-w-10 sm:min-h-10 sm:w-10 sm:h-10 rounded-full shrink-0 flex-shrink-0 aspect-square overflow-hidden"
                onClick={() => {
                  router.push("/contactUs");
                }}
                icon={
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#1D8751] flex items-center justify-center shrink-0">
                    <svg
                      width="14"
                      height="14"
                      className="sm:w-4 sm:h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        className="stroke-[#1D8751]"
                        strokeWidth="2"
                      />
                      <path
                        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                        className="stroke-[#1D8751]"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="17"
                        r="0.5"
                        className="fill-[#1D8751] stroke-[#1D8751]"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default UserCard;
