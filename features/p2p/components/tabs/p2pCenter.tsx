import React from "react";
import P2pProfile from "../ui/p2pcenter/P2pProfile";
import Stats from "../ui/p2pcenter/Stats";
import FiterTabs from "../ui/p2pcenter/FilterTabs";

const P2PCenter = () => {
  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-screen px-0 sm:px-1 lg:px-2 overflow-x-hidden">
      <P2pProfile />
      <Stats />
      <FiterTabs />
    </div>
  );
};

export default P2PCenter;
