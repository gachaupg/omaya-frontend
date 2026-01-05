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
import { checkKYCStatus } from "@/features/kyc/slices/kycSlice";

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

  const { isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const kycState = useSelector((state: RootState) => state.kyc);
  // KYC verification status from central KYC slice (fed by /api/kyc/status/)
  const isVerified = kycState.isVerified ?? false;
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

      // Ensure KYC status (is_verified) is up to date
      dispatch(checkKYCStatus());
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
            <p className="text-base text-[#FFFFFF] truncate">
              {userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : ''}
            </p>
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
      </div>
    </div>
  );
};

export default UserProfileCard;
