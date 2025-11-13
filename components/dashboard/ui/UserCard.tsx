"use client";

import Button from "@/features/p2p/components/Common/Button";
import Card from "@/features/p2p/components/Common/Card";
import CopyButton from "@/components/ui/CopyButton";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { showToast } from "@/lib/utils/toast";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store/rootReducer";
import { useRouter } from "next/navigation";
import {
  updateProfileThunk,
  getP2PProfileThunk,
} from "@/features/p2p/slices/orderSlice";
import HelpSupportForm from "@/features/settings/components/HelpSupportForm";
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { useMatchedTradesWebSocket } from "@/features/p2p/hooks/useMatchedTradesWebSocket";

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
  const { data: matchedTrades } = useSelector(
    (state: RootState) => state.matchedTrades
  );

  // Use WebSocket for real-time matched trades updates with HTTP polling fallback
  const { isConnected: wsConnected } = useMatchedTradesWebSocket({
    enabled: isAuthenticated,
    fallbackToPolling: true,
    pollingInterval: 30000, // 30 seconds fallback polling
  });

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMatchedTrades(1));
      dispatch(getP2PProfileThunk())
        .unwrap()
        .then((response) => {
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
        })
        .catch((error) => {});
    }
  }, [dispatch, isAuthenticated]);

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
          // Refetch profile to get updated photo
          const response = await dispatch(getP2PProfileThunk()).unwrap();
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
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
    <Card
      borderColor="border-[#E8EFF5] dark:border-[#35353E]"
      width="w-full"
      bgColor="bg-[#1D1D23]"
      borderRadius="rounded-[20px]"
      className="p-2 dark:bg-[#1D1D23] bg-white"
    >
      {showHelpSupport ? (
        <div className="w-full mt-2">
          <button
            className="mb-4 px-4 py-2 bg-gray-200 text-[#1D8751] font-medium text-sm hover:bg-[#1D8751]/10 dark:bg-[#2C2C32] rounded"
            onClick={() => setShowHelpSupport(false)}
          >
            {t("userCard.back", "Back")}
          </button>
          <HelpSupportForm />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Avatar with Edit Button */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden relative">
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
                className="absolute -top-1 -right-1 rounded-full p-1 bg-[#1D8751] cursor-pointer hover:bg-[#16663d] transition-colors"
                onClick={handleImageClick}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 3L21 8L8 21L3 21L3 16L16 3Z"
                    className="stroke-[#FFFFFF]"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold dark:text-[#FFFFFF] text-[#0D0D0D] truncate">
                  {t("userCard.hello", "Hello, {{name}}!", {
                    name: `${user?.first_name} ${user?.last_name}`,
                  })}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#1D8751] text-xs sm:text-sm">
                  {t("userCard.verifiedProfile", "Verified Profile")}
                </span>
                <div className="rounded-full p-0.5 flex-shrink-0">
                  <img
                    className="h-3 w-3 sm:h-4 sm:w-4 bg-amber-50 rounded-full"
                    src="https://res.cloudinary.com/pitz/image/upload/v1753946849/download__3_-removebg-preview_1_clnjwy.png"
                    alt=""
                  />
                </div>
              </div>
            </div>
             {/* User ID */}
             <div className="flex flex-col gap-2 ml-12">
              <p className="text-xs text-[#788099]">
                {t("userCard.userId", "User ID")}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-base dark:text-[#FFFFFF]">{user?.user_id}</p>
                <CopyButton
                  value={user?.user_id || ""}
                  className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-110 text-[#F79330]"
                  showIcon={true}
                />
              </div>
            </div>

            {/* User Type */}
            <div>
              <p className="text-xs text-[#788099]">
                {t("userCard.userType", "User Type")}
              </p>
              <p className="text-base dark:text-[#FFFFFF]">
                {t("userCard.individual", "Individual")}
              </p>
            </div>
          </div>

          {/* User Details and Actions */}
          <div className="flex text-xs sm:text-sm flex-col w-full sm:w-auto sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6">
           

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center p-0"
                onClick={() => router.push("/dashboard/notifications")}
                icon={
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#1D8751] flex items-center justify-center p-1 relative min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                    <svg
                      width="16"
                      height="16"
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
                    {matchedTrades?.results &&
                      matchedTrades.results.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#E23D3A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {matchedTrades.results.length}
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
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#F79330] rounded-full border border-white dark:border-[#18181D]"
                        title="Using HTTP polling (WebSocket unavailable)"
                      />
                    )}
                  </div>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center p-0"
                onClick={() => {
                  router.push("/contactUs");
                }}
                icon={
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#1D8751] flex items-center justify-center p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 18V12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12V18"
                        className="stroke-[#1D8751]"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21 19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H18C17.4696 21 16.9609 20.7893 16.5858 20.4142C16.2107 20.0391 16 19.5304 16 19V16C16 15.4696 16.2107 14.9609 16.5858 14.5858C16.9609 14.2107 17.4696 14 18 14H21V19ZM3 19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H6C6.53043 21 7.03914 20.7893 7.41421 20.4142C7.78929 20.0391 8 19.5304 8 19V16C8 15.4696 7.78929 14.9609 7.41421 14.5858C7.03914 14.2107 6.53043 14 6 14H3V19Z"
                        className="stroke-[#1D8751]"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default UserCard;
