import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import Image from "next/image";
import { getP2PProfileThunk } from "@/features/p2p/slices/orderSlice";
import { AppDispatch } from "@/store";

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E";

const KYC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
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
          console.error("Failed to fetch profile:", error);
        });
    }
  }, [dispatch, user]);

  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target?.result as string);
      reader.readAsDataURL(file);
      // Optionally, dispatch upload action here
    }
  };

  return (
    <div className="p-3 dark:text-white text-[#0D0D0D] flex flex-col gap-2">
      <p className="text-base font-semibold">KYC Verification</p>
      <div className="flex flex-col dark:bg-[#1D1D23] bg-gray-50 dark:border-[#35353E] border-gray-300 border-2 rounded-xl p-3 gap-3">
        <div className="flex flex-col border dark:bg-[#18181D] bg-[#F5F5F5] dark:border-[#35353E] border-gray-300 rounded-xl p-3 gap-3">
          {/* Avatar, Name, and Status */}
          {/* KYC Info */}
          <p className="text-sm dark:text-[#808080] text-gray-600">
            Complete your KYC verification to unlock all platform features and enhance your account security. 
            This process helps us verify your identity and comply with regulatory requirements, ensuring a 
            safe and compliant trading environment for all users.
          </p>
          <div className="flex items-center gap-3">
            <div
              className="relative"
              onClick={handleImageClick}
              style={{ cursor: "pointer" }}
            >
              {!profileImage || profileImage === DEFAULT_AVATAR ? (
                // Simple SVG avatar icon
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded-full dark:bg-[#35353E] bg-gray-300"
                >
                  <circle cx="24" cy="24" r="24" fill="#35353E" />
                  <circle cx="24" cy="20" r="8" fill="#808080" />
                  <ellipse cx="24" cy="36" rx="12" ry="8" fill="#808080" />
                </svg>
              ) : (
                <Image
                  src={profileImage}
                  alt="User avatar"
                  width={48}
                  height={48}
                  className="object-cover rounded-full aspect-square"
                  unoptimized={true}
                  onError={(
                    e: React.SyntheticEvent<HTMLImageElement, Event>
                  ) => {
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
            <div>
              <div className="text-base font-semibold">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="flex items-center gap-2 text-[#1D8751] text-sm">
                Verified Profile
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#1D8751"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="#1D8751"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYC;
