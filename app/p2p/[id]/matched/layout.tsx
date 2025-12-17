"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import { motion } from "framer-motion";

export default function MatchedOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen mt-8 w-full overflow-x-hidden md:flex">
      {/* Mobile Sidebar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="md:hidden sticky top-16 sm:top-20 left-0 right-0 z-40 bg-white dark:bg-[var(--bg-color)]"
      >
        <Sidebar />
      </motion.div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-48 lg:w-56 xl:w-[222.28px]" aria-hidden>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed top-28 left-0 z-30 h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden md:w-48 lg:w-56 xl:w-[222.28px] pr-2"
        >
          <Sidebar />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full h-full max-w-full overflow-x-hidden pl-0 md:pl-4 lg:pl-6">
        <div className="w-full min-h-screen mt-[68px] sm:mt-[68px] md:mt-0 px-0 sm:px-1 md:px-0">
          {children}
        </div>
      </div>
    </div>
  );
}
