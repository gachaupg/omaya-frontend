import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import Image from "next/image";
import { getP2PProfileThunk, updateProfileThunk } from "@/features/p2p/slices/orderSlice";
import { getUserProfile } from "@/features/auth/slices/authSlice";
import { AppDispatch } from "@/store";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { showToast } from "@/lib/utils/toast";

import { logger } from '@/lib/utils/logger';

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E";

const KYC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      dispatch(getP2PProfileThunk())
        .unwrap()
        .then((response) => {
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
        })
        .catch((error) => {
          logger.error('dashboard', "Failed to fetch profile:", error);
        });
    }
  }, [dispatch, user]);

  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        // Show preview immediately
        setProfileImage(base64Image);

        try {
          setIsUpdating(true);
          const formData = new FormData();
          formData.append("photo", file);

          // Upload the profile photo
          await dispatch(updateProfileThunk(formData)).unwrap();
          
          // Refetch P2P profile to get updated photo
          const response = await dispatch(getP2PProfileThunk()).unwrap();
          if (response?.profile?.photo) {
            const updatedPhotoUrl = response.profile.photo;
            setProfileImage(updatedPhotoUrl);
            
            // Update localStorage immediately with cache-busting timestamp
            if (typeof window !== "undefined") {
              // Store the photo URL with timestamp to force cache refresh
              const photoWithTimestamp = updatedPhotoUrl.includes('?') 
                ? `${updatedPhotoUrl}&t=${Date.now()}`
                : `${updatedPhotoUrl}?t=${Date.now()}`;
              localStorage.setItem("profile_photo", updatedPhotoUrl);
              
              // Trigger a custom event to notify other components
              window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { 
                detail: { photoUrl: updatedPhotoUrl } 
              }));
            }
          }
          
          // Wait a bit for backend to sync, then refresh main auth profile
          // This ensures the auth profile endpoint has the updated photo
          await new Promise(resolve => setTimeout(resolve, 500));
          await dispatch(getUserProfile()).unwrap();
          
          // Force update localStorage again after getUserProfile to ensure sync
          if (typeof window !== "undefined" && response?.profile?.photo) {
            localStorage.setItem("profile_photo", response.profile.photo);
          }
          
          showToast.success("Profile image updated successfully");
        } catch (error: any) {
          logger.error('dashboard', "Profile update error:", error);
          showToast.error(error?.message || "Failed to update profile image");
          // Revert the image if update fails
          setProfileImage(DEFAULT_AVATAR);
          // Try to reload the original profile image
          try {
            const response = await dispatch(getP2PProfileThunk()).unwrap();
            if (response?.profile?.photo) {
              setProfileImage(response.profile.photo);
            }
          } catch (fetchError) {
            // Keep default avatar if fetch fails
          }
        } finally {
          setIsUpdating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fullName =
    user?.first_name || user?.last_name
      ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
      : "Peter Gachau";

  return (
    <div className="p-3 sm:p-4 dark:text-white text-[#0D0D0D]">
      <section className="rounded-[32px] p-4 sm:p-6 flex flex-col gap-4 border dark:bg-[var(--card-color)] bg-white dark:border-[#2B2B3A] border-[#E2E8F0]">
        <p className="text-sm sm:text-base leading-relaxed dark:text-[#B8BAC7] text-[#4A5568]">
          Your account is fully verified. Keep your personal information up to date so we can continue protecting access to trading,
          payments, and P2P settlements. If you ever need to refresh your documents, you can upload new files directly from this page.
        </p>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl p-4 dark:bg-[var(--card-color)] bg-[#F8FAFC] dark:border-[#2F2C3C] border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div
              className="relative cursor-pointer"
              onClick={handleImageClick}
            >
              {!profileImage || profileImage === DEFAULT_AVATAR ? (
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded-full dark:bg-[#2B2B3A] bg-[#E2E8F0]"
                >
                  <circle cx="28" cy="28" r="28" fill="#35353E" />
                  <circle cx="28" cy="22" r="10" fill="#B8BAC7" />
                  <ellipse cx="28" cy="40" rx="16" ry="10" fill="#B8BAC7" />
                </svg>
              ) : (
                <Image
                  src={profileImage}
                  alt="User avatar"
                  width={56}
                  height={56}
                  className="object-cover rounded-full aspect-square"
                  unoptimized
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = DEFAULT_AVATAR;
                  }}
                />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-base sm:text-lg font-semibold dark:text-white text-[#0D0D0D]">
                  {fullName}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#35353E] transition-colors cursor-pointer active:scale-95"
                  title="Update Profile"
                  aria-label="Update Profile"
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
              <div className="flex items-center gap-2 text-sm font-medium dark:text-[#1D8751] text-[#15803D]">
                Verified Profile
                <span className="inline-flex items-center justify-center w-5 h-5 flex-shrink-0" style={{position: 'relative'}}>
                      <svg width="18" height="18" viewBox="0 0 20 20" style={{position: 'absolute'}}>
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
                        style={{position: 'relative', zIndex: 1}}
                        className="flex-shrink-0"
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
              </div>
              {/* Edit Profile Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-1.5 text-xs font-medium text-[#1D8751] border border-[#1D8751] rounded-full hover:bg-[#1D8751] hover:text-white transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="w-full rounded-[40px] text-sm sm:text-base py-3 sm:py-4 font-semibold cursor-default dark:bg-[#35353e] bg-[#EDF2F7] dark:border-[#2F2C3C] border-[#E2E8F0] dark:text-[#A1A1B3] text-[#475569]"
        >
          Verified
        </button>
      </section>
    </div>
  );
};

export default KYC;
