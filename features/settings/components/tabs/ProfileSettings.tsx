import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";
import ClientIdSection from "./sections/ClientIdSection";
import PasswordSection from "./sections/PasswordSection";
import BasicInfoSection from "./sections/BasicInfoSection";
import SystemThemeSection from "./sections/SystemThemeSection";

const ProfileSettings = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="w-full flex flex-col gap-2 mx-auto">
      <ClientIdSection user={user} />
      <BasicInfoSection user={user} />
      <PasswordSection />
      <SystemThemeSection />
    </div>
  );
};

export default ProfileSettings;
