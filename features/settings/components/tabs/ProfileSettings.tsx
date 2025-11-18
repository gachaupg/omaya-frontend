import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import ClientIdSection from "./sections/ClientIdSection";
import PasswordSection from "./sections/PasswordSection";
import BasicInfoSection from "./sections/BasicInfoSection";
import SystemThemeSection from "./sections/SystemThemeSection";

const ProfileSettings = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:gap-3">
        <ClientIdSection user={user} />
        <BasicInfoSection user={user} />
        <PasswordSection />
        <SystemThemeSection />

      </div>
    </div>
  );
};

export default ProfileSettings;
