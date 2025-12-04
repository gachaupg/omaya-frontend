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
    <div className="min-h-screen mt-8 w-full overflow-x-hidden md:flex">
      {/* Mobile Sidebar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="md:hidden sticky top-0 left-0 right-0 z-40 bg-white dark:bg-[#0D0D0D]"
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
      <div className="flex-1 w-full h-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname} // Use pathname for proper React reconciliation (fixes performance issue)
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }} // Reduced from 0.3s to 0.15s for snappier feel
            className="page-shell md:mt-20 w-full max-w-full"
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
