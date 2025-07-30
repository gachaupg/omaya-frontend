import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";
import { logout } from "@/features/auth/slices/authSlice";
import { useRouter } from "next/navigation";
import ClientIdSection from "./sections/ClientIdSection";
import PasswordSection from "./sections/PasswordSection";
import BasicInfoSection from "./sections/BasicInfoSection";
import SystemThemeSection from "./sections/SystemThemeSection";

const ProfileSettings = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    showToast.success("Logged out successfully", "You have been logged out");
    // Navigate to login page
    router.push("/auth/login");
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:gap-3">
        <ClientIdSection user={user} />
        <BasicInfoSection user={user} />
        <PasswordSection />
        <SystemThemeSection />

        {/* Logout Section */}
        <div className="mt-3 sm:mt-4 p-4 sm:p-6 bg-[#23232B] rounded-lg sm:rounded-xl border border-[#35353E]">
          <h3 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3">
            Account Actions
          </h3>
          <p className="text-[#788099] text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
            Sign out of your account. You will need to log in again to access
            your dashboard.
          </p>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-[#F04438] hover:bg-[#DC2626] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 17L21 12L16 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
