import Settings from "@/features/settings/components/settings";
import { SettingsDataProvider } from "@/features/settings/components/SettingsDataProvider";
import React from "react";

const page = () => {
  return (
    <SettingsDataProvider>
      <div className="w-[calc(100%+4rem)] -ml-8 -mr-8 sm:w-[calc(100%+2rem)] sm:-ml-4 sm:-mr-4 md:ml-0 md:mr-0 md:w-full">
        <Settings />
      </div>
    </SettingsDataProvider>
  );
};

export default page;
