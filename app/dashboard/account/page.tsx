import Settings from "@/features/settings/components/settings";
import { SettingsDataProvider } from "@/features/settings/components/SettingsDataProvider";
import React from "react";

const page = () => {
  return (
    <SettingsDataProvider>
      <div className="container mx-auto px-4 sm:px-6 md:px-8 overflow-x-hidden">
        <Settings />
      </div>
    </SettingsDataProvider>
  );
};

export default page;
