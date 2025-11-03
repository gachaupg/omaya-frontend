"use client";

import Sidebar from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import KYCVerificationModal from "./kyc/kycmodal";
import { useKYCVerification } from "@/features/auth/hooks/useKYCVerification";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always call the hook to maintain hook order consistency
  useKYCVerification();

  // Navigation toasts removed in favor of route `loading.tsx`

  // Use pathname as key for proper React reconciliation
  // This prevents unnecessary component remounts on every render
  const pathname = usePathname();

  return (
    <div className="min-h-screen ml-0 md:ml-4 lg:ml-6 mt-28">
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
        className="hidden md:mb-28 md:block fixed top-28 left-0 w-48 lg:w-56 xl:w-[222.28px] h-[calc(100vh-7rem)] overflow-y-auto"
      >
        <Sidebar />
      </motion.div>

      {/* Main Content */}
      <div className="w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname} // Use pathname for proper React reconciliation (fixes performance issue)
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }} // Reduced from 0.3s to 0.15s for snappier feel
            className="max-md:mt-40 md:mt-28 md:pl-48 lg:pl-56 xl:pl-[222.28px] px-3 sm:px-4 md:px-4 lg:px-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* KYC Verification Modal */}
      <KYCVerificationModal />
    </div>
  );
}
