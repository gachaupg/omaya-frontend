import React from "react";
import Express from "@/features/express/components/express";

const page = () => {
  return (
    <div className="w-[calc(100%+4rem)] -ml-8 -mr-8 sm:w-[calc(100%+2rem)] sm:-ml-4 sm:-mr-4 md:ml-0 md:mr-0 md:w-full flex justify-center px-0 sm:px-1 md:px-4">
      <div className="w-full mr-0 lg:mr-20 mt-0 sm:mt-1 md:mt-2">
        <Express />
      </div>
    </div>
  );
};

export default page;
