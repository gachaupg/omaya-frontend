"use client";

import Sidebar from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import KYCVerificationModal from "@/features/auth/components/KYCVerificationModal";
import { useKYCVerification } from "@/features/auth/hooks/useKYCVerification";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize KYC verification check
  useKYCVerification();

  return (
    <div className="min-h-screen mt-28">
      {/* Mobile Sidebar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="md:hidden fixed top-18 left-0 right-0 z-40"
      >
        <Sidebar />
      </motion.div>

      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden md:mb-28 md:block fixed top-28 left-0 w-[222.28px] h-[calc(100vh-7rem)]"
      >
        <Sidebar />
      </motion.div>

      {/* Main Content */}
      <div className="w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={Math.random()} // This ensures animation plays on route changes
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-md:mt-40 md:mt-28 md:pl-[222.28px] px-2 md:px-6">
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* KYC Verification Modal */}
      <KYCVerificationModal />
    </div>
  );
}
