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
    <div className="w-full flex flex-col gap-2 mx-auto">
      <ClientIdSection user={user} />
      <BasicInfoSection user={user} />
      <PasswordSection />
      <SystemThemeSection />

      {/* Logout Section */}
      <div className="mt-8 p-6 bg-[#23232B] rounded-lg border border-[#35353E]">
        <h3 className="text-white text-lg font-semibold mb-4">
          Account Actions
        </h3>
        <p className="text-[#788099] text-sm mb-6">
          Sign out of your account. You will need to log in again to access your
          dashboard.
        </p>
        <button
          onClick={handleLogout}
          className="bg-[#F04438] hover:bg-[#DC2626] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
