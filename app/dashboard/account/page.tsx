import Settings from "@/features/settings/components/settings";
import { SettingsDataProvider } from "@/features/settings/components/SettingsDataProvider";
import React from "react";

const page = () => {
  return (
    <SettingsDataProvider>
      <div>
        <Settings />
      </div>
    </SettingsDataProvider>
  );
};

export default page;
