"use client";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import Button from "@/features/p2p/components/Common/Button";
import {
  getP2PProfileThunk,
  updateProfileThunk,
} from "@/features/p2p/slices/orderSlice";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { showToast } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";

import { logger } from '@/lib/utils/logger';

type UserProfileCardProps = {
  name: string;
  userId: string;
  userType: string;
  profileImage: string;
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name,
  userId,
  userType,
  profileImage: initialProfileImage,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E";
  const [profileImage, setProfileImage] = useState(
    initialProfileImage || defaultAvatar
  );

  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const isVerified = user?.is_verified ?? false;
  const { data: matchedTrades } = useSelector(
    (state: RootState) => state.matchedTrades
  );

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
        .catch((error) => {
          logger.error('exchange', "Failed to fetch profile:", error);
        });
    }
  }, [dispatch, isAuthenticated]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showToast.error("Image size should be less than 5MB");
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
          showToast.success("Profile image updated successfully");
        } catch (error: any) {
          logger.error('exchange', "Profile update error:", error);
          showToast.error(error?.message || "Failed to update profile image");
          // Revert the image if update fails
          setProfileImage(initialProfileImage || defaultAvatar);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Ensure we always have a valid image source
  const imageSrc = profileImage || defaultAvatar;

  return (
    <div className="flex items-center gap-4 p-2 rounded-2xl bg-[#1D1D23] border border-[#35353E]">
      <div className="flex flex-col w-full gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {/* User Avatar with Edit Button */}
          <div className="relative flex-shrink-0">
            <div className="h-14 w-14 rounded-full overflow-hidden relative">
              <img
                src={imageSrc}
                alt="User avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = defaultAvatar;
                }}
              />
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
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg text-[14px] font-semibold text-[#FFFFFF] truncate">
                Hello, {name}!
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`text-[14px] ${
                  isVerified ? "text-[#1D8751]" : "text-[#E23D3A]"
                }`}
              >
                {isVerified ? "Verified" : "Unverified"} Profile
              </span>
              {isVerified && (
                <div className="rounded-full p-0.5 bg-[#1D8751] flex-shrink-0">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12L11 14L15 10"
                      className="stroke-[#FFFFFF]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className="stroke-[#FFFFFF]"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Details and Actions */}
        <div className="flex flex-wrap gap-4 sm:gap-6 items-start sm:items-center">
          {/* User ID */}
          <div className="min-w-0">
            <p className="text-xs text-[#788099]">User ID</p>
            <div className="flex items-center gap-2">
              <p className="text-base text-[#FFFFFF] truncate">{userId}</p>
              <button
                className="flex-shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  showToast.success("User ID copied to clipboard");
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="5"
                    y="5"
                    width="14"
                    height="14"
                    rx="2"
                    className="stroke-[#E23D3A]"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* User Type */}
          <div className="min-w-0">
            <p className="text-xs text-[#788099]">User Type</p>
            <p className="text-base text-[#FFFFFF] truncate">{userType}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className=" flex items-center justify-center p-0"
              onClick={() => router.push("/dashboard/notifications")}
              icon={
                <div className="w-10 h-10 rounded-full border border-[#1D8751] flex items-center justify-center p-1 relative">
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
                </div>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center p-0"
              icon={
                <div className="w-10 h-10 rounded-[50%] border border-[#1D8751] flex items-center justify-center p-0">
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
    </div>
  );
};

export default UserProfileCard;
