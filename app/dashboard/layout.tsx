"use client";

import Sidebar from "@/components/layout/Sidebar";
import { motion } from "framer-motion";
import KYCVerificationModal from "./kyc/kycmodal";
import { useKYCVerification } from "@/features/auth/hooks/useKYCVerification";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import React from "react";
import FrozenAccountModal from "@/components/ui/FrozenAccountModal";
import { MatchedTradesWebSocketProvider } from "@/features/p2p/components/MatchedTradesWebSocketProvider";
import { DashboardNavigationProvider } from "@/context/DashboardNavigationContext";
import DashboardContentArea from "@/components/dashboard/DashboardContentArea";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useKYCVerification();

  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showFrozenModal, setShowFrozenModal] = React.useState(false);
  const isFrozenUser = user?.freeze === true;

  React.useEffect(() => {
    if (!isFrozenUser) return;

    const blockedRoutes = [
      "/dashboard/exchange",
      "/dashboard/p2p",
      "/dashboard/swap",
      "/dashboard/express-exchange",
    ];
    const current = (pathname || "").replace(/\/$/, "");
    const isBlockedRoute = blockedRoutes.some((route) =>
      current === route || current.startsWith(`${route}/`)
    );
    if (isBlockedRoute) {
      setShowFrozenModal(true);
      router.replace("/dashboard");
    }
  }, [isFrozenUser, pathname, router]);

  return (
    <MatchedTradesWebSocketProvider>
      <DashboardNavigationProvider>
        <motion.div className="min-h-screen mt-0 md:mt-8 w-full overflow-x-hidden md:flex bg-gray-50 dark:bg-[var(--bg-color)]">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="md:hidden sticky top-16 sm:top-20 left-0 right-0 z-50 bg-white dark:bg-[var(--bg-color)]"
          >
            <Sidebar />
          </motion.div>

          <div className="hidden md:block md:w-48 lg:w-56 xl:w-[222.28px] flex-shrink-0" aria-hidden>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="fixed top-28 left-0 z-50 h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden md:w-48 lg:w-56 xl:w-[222.28px] pr-2"
            >
              <Sidebar />
            </motion.div>
          </div>

          <div className="flex-1 w-full h-full max-w-full overflow-x-hidden box-border bg-gray-50 dark:bg-[var(--bg-color)]">
            <DashboardContentArea>{children}</DashboardContentArea>
          </div>

          <KYCVerificationModal />
          <FrozenAccountModal
            isOpen={showFrozenModal}
            onClose={() => setShowFrozenModal(false)}
          />
        </motion.div>
      </DashboardNavigationProvider>
    </MatchedTradesWebSocketProvider>
  );
}
