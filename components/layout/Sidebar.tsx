"use client";

/**
 * Sidebar.tsx – auto‑generated placeholder
 */

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { navItems } from "@/utils/data";
import { useTheme } from "@/context/theme";
import { markExpressCancelled } from "@/features/express/utils/cancelExpressWork";

const NAV_LABEL_FALLBACKS: Record<string, string> = {
  "navigation.dashboard": "DASHBOARD",
  "navigation.express": "Express",
  "navigation.exchange": "Money",
  "navigation.p2pTrading": "P2P",
  "navigation.swapCrypto": "Swap",
  "navigation.account": "Account",
};
import { useDashboardI18n } from "@/lib/useDashboardI18n";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { AppDispatch } from "@/store";
import { openKYCModal } from "@/features/auth/slices/authSlice";
import FrozenAccountModal from "@/components/ui/FrozenAccountModal";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useDashboardI18n();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const kycState = useSelector((state: RootState) => state.kyc);


  const isVerified = kycState.isVerified !== undefined
    ? kycState.isVerified
    : (user?.is_verified !== undefined ? user.is_verified : true);

  const { isDark } = useTheme();
  const [showFrozenModal, setShowFrozenModal] = React.useState(false);
  const isFrozenUser = isAuthenticated && user?.freeze === true;
  const isFrozenBlockedHref = (href: string) => {
    const normalized = href.replace(/\/$/, "");
    return (
      normalized === "/dashboard/exchange" ||
      normalized === "/dashboard/p2p" ||
      normalized === "/dashboard/swap" ||
      normalized === "/dashboard/express-exchange"
    );
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Immediately cancel any ongoing Express work (estimates, commissions, etc.)
    markExpressCancelled();
    // Allow dashboard access for all users (verified and unverified)
    if (href === "/dashboard/" || href === "/dashboard") {
      return; // Allow navigation
    }

    // ONLY block unverified authenticated users from accessing other routes
    // Block only if: authenticated, user exists, and explicitly not verified (isVerified === false)
    // Allow navigation if verification status is undefined (hasn't been checked yet)
    const isUnverifiedUser = isAuthenticated && user && isVerified === false;

    if (isUnverifiedUser) {
      e.preventDefault();
      e.stopPropagation();
      dispatch(openKYCModal());
      return false;
    }

    if (isFrozenUser && isFrozenBlockedHref(href)) {
      e.preventDefault();
      e.stopPropagation();
      setShowFrozenModal(true);
      return false;
    }

    // Check if clicking on an already active section - reset to default/base route
    const normalizedPathname = pathname?.replace(/\/$/, "") || "";
    const normalizedHref = href.replace(/\/$/, "");
    const isActive = normalizedHref === "/dashboard"
      ? normalizedPathname === normalizedHref
      : normalizedPathname === normalizedHref ||
      (normalizedPathname && normalizedPathname.startsWith(normalizedHref + "/"));

    // If the clicked item is already active, navigate to its base/default route
    if (isActive && normalizedHref !== "/dashboard") {
      // Check if we're already on the base route
      if (normalizedPathname !== normalizedHref) {
        // We're on a sub-route, navigate to the base route
        e.preventDefault();
        router.push(href);
        return false;
      }
      // If already on the base route, avoid hard reload (it feels like lag).
      // If you need to "reset" state, prefer a soft refresh.
      e.preventDefault();
      router.refresh();
      return false;
    }

    // Let Next.js / Link handle SPA navigation normally (no forced full reload here)
  };

  return (
    <React.Fragment>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden md:block left-0",
          "w-48 lg:w-56 xl:w-[222.28px]"
        )}
      >
        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const normalizedPathname = pathname?.replace(/\/$/, "") || "";
              const normalizedHref = item.href.replace(/\/$/, "");
              const isActive =
                normalizedHref === "/dashboard"
                  ? normalizedPathname === normalizedHref
                  : normalizedPathname === normalizedHref ||
                  (normalizedPathname &&
                    normalizedPathname.startsWith(normalizedHref + "/"));
              const label = t(item.labelKey, NAV_LABEL_FALLBACKS[item.labelKey] ?? item.labelKey);
              const isUnverifiedUser = isAuthenticated && user && isVerified === false;
              const isFrozenDisabled = isFrozenUser && isFrozenBlockedHref(item.href);
              const isDisabled =
                (isUnverifiedUser && item.href !== "/dashboard/" && item.href !== "/dashboard") ||
                isFrozenDisabled;
              return (
                <li key={item.labelKey}>
                  <Link
                    prefetch={true}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    title={
                      isFrozenDisabled
                        ? "Your account is frozen. Contact support to unfreeze."
                        : isDisabled
                          ? "Please verify your identity to access this feature"
                          : undefined
                    }
                    className={clsx(
                      "flex items-center px-3 md:px-4 lg:px-6 py-3 rounded-lg text-sm md:text-base font-medium gap-2 md:gap-3 lg:gap-4 transition",
                      "w-full",
                      isActive
                        ? "bg-[#E1E1E1] dark:bg-[#303038] text-muted-foreground dark:text-white"
                        : "text-[#727272] dark:hover:text-white hover:bg-white dark:hover:bg-[#23262F]",
                      isDisabled && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {item.labelKey === "navigation.exchange" ? (
                      <>
                        <img
                          className="w-5 h-5 object-contain flex-shrink-0 scale-[1.35]"
                          src="/assets/uil_exchange_1_okxkvb.png"
                          alt=""
                        />
                      </>
                    ) : (
                      <img
                        src={item.icon}
                        alt={label + " icon"}
                        className="w-[18px] h-[18px] object-contain flex-shrink-0"
                      />
                    )}
                    {item.labelKey === "navigation.exchange" ? (
                      <span>
                        <span className="flex items-center gap-0.5 leading-none">
                          <span
                            className={
                              isActive
                                ? "text-[#727272] dark:text-white text-base uppercase font-bold"
                                : "text-[#727272] text-base uppercase font-bold"
                            }
                          >
                            Money
                          </span>

                          <span className="relative flex items-center">
                            {/* Light-mode image (always shown in light mode, and in dark mode when inactive) */}
                            <img
                              src="/images/x.png"
                              className={clsx(
                                "w-5 h-5 object-contain",
                                isActive ? "block dark:hidden" : "block"
                              )}
                              alt=""
                            />

                            {/* Dark-mode active image (shown only when active + dark mode) */}
                            {isActive && (
                              <img
                                src="/images/xwhite.png"
                                className="hidden dark:block w-5 h-5 object-contain"
                                alt=""
                              />
                            )}
                          </span>
                        </span>
                      </span>

                    ) : (
                      ''
                    )}
                    {item.labelKey === "navigation.express" ? (
                      <span >
                        <span className="flex ml-1 items-center justify-center gap-0.5">
                          <span
                            className={
                              isActive
                                ? "text-[#727272] dark:text-white text-base uppercase font-bold"
                                : "text-[#727272] text-base uppercase font-bold"
                            }
                          >
                            E
                          </span>

                          <span className="relative mt-2">
                            {/* Light-mode image: shown in light mode always (active or not), 
            also shown in dark mode when not active */}
                            <img
                              src="/images/Group_9_momvgo.png"
                              className={clsx(
                                "h-5 w-auto object-contain",
                                isActive ? "block dark:hidden" : "block"
                              )}
                              alt=""
                            />

                            {/* Dark-mode active image: only visible in dark mode AND active */}
                            {isActive && (
                              <img
                                src="/images/Group_5_gkxzdz.png"
                                className="hidden dark:block h-5 w-auto object-contain"
                                alt=""
                              />
                            )}
                          </span>
                        </span>
                      </span>
                    ) : item.labelKey === "navigation.exchange" ? null : (
                      <span className="font-bold ml-1">{label}</span>
                    )}

                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden w-full dark:bg-[#1D1D23] bg-white relative">
        {/* Fade indicators for horizontal scroll */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-[#1D1D23] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-[#1D1D23] to-transparent" />

        <nav className="px-4 sm:px-6 overflow-x-auto scrollbar-hide scroll-smooth">
          <ul className="flex items-center space-x-2 sm:space-x-3 py-3 snap-x snap-mandatory">
            {navItems.map((item) => {
              // Normalize paths for comparison (handle trailing slashes)
              const normalizedPathname = pathname?.replace(/\/$/, "") || "";
              const normalizedHref = item.href.replace(/\/$/, "");
              const isActive =
                normalizedHref === "/dashboard"
                  ? normalizedPathname === normalizedHref
                  : normalizedPathname === normalizedHref ||
                  (normalizedPathname &&
                    normalizedPathname.startsWith(normalizedHref + "/"));
              const label = t(item.labelKey, NAV_LABEL_FALLBACKS[item.labelKey] ?? item.labelKey);
              // Only disable for unverified authenticated users (explicitly false, not undefined)
              const isUnverifiedUser = isAuthenticated && user && isVerified === false;
              const isFrozenDisabled = isFrozenUser && isFrozenBlockedHref(item.href);
              const isDisabled =
                (isUnverifiedUser && item.href !== "/dashboard/" && item.href !== "/dashboard") ||
                isFrozenDisabled;
              return (
                <li key={item.labelKey} className="snap-start">
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    title={
                      isFrozenDisabled
                        ? "Your account is frozen. Contact support to unfreeze."
                        : isDisabled
                          ? "Please verify your identity to access this feature"
                          : undefined
                    }
                    className={clsx(
                      "flex items-center justify-center px-2.5 sm:px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium gap-1.5 sm:gap-2 whitespace-nowrap transition min-h-[44px]",
                      isActive
                        ? "dark:bg-[#303038] bg-[#E1E1E1] dark:text-white text-muted-foreground"
                        : "text-[#727272] dark:hover:text-white hover:text-[#051015] dark:hover:bg-[#23262F] hover:bg-gray-100",
                      isDisabled && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {item.labelKey === "navigation.exchange" ? (
                      <>
                        <img
                          className="w-5 h-5 object-contain flex-shrink-0 scale-[1.35]"
                          src="/assets/uil_exchange_1_okxkvb.png"
                          alt=""
                        />
                        <span
                          className={clsx(
                            "flex items-center gap-0.5 sm:gap-1 leading-none",
                            isActive
                              ? "font-bold text-white text-sm sm:text-base"
                              : "font-normal text-[#727272] text-xs sm:text-sm"
                          )}
                        >
                          <span className={isActive ? "dark:text-white text-muted-foreground text-sm sm:text-base uppercase font-bold" : "text-[#727272] text-xs sm:text-sm uppercase font-bold"}>
                            Money
                          </span>
                          <img
                            className="w-5 h-5 object-contain"
                            src={isActive

                              ? isDark ? "/assets/Group_7_ichuyz.png"
                                : "/images/x.png"
                              : "/images/x.png"
                            }
                            alt=""
                          />
                        </span>
                      </>
                    ) : (
                      <>
                        <img
                          src={item.icon}
                          alt={label + " icon"}
                          className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain shrink-0"
                        />
                        {item.labelKey === "navigation.express" ? (
                          <span
                            className={clsx(
                              "flex items-center justify-center gap-0.5 sm:gap-1",
                              isActive
                                ? "font-bold text-white text-sm sm:text-base"
                                : "font-normal text-[#727272] text-xs sm:text-sm"
                            )}
                          >
                            <span
                              className={isActive ? "dark:text-white text-muted-foreground text-sm sm:text-base font-bold" : "text-[#727272] text-xs sm:text-sm font-bold"}
                            >
                              E
                            </span>
                            <img
                              className="h-5 w-auto mt-[5px] object-contain"
                              style={{ maxWidth: 'none' }}
                              src={
                                isActive

                                  ? isDark ? "/images/Group_5_gkxzdz.png"
                                    : "/images/Group_9_momvgo.png"
                                  : "/images/Group_9_momvgo.png"
                              }
                              alt="Express"
                            />
                          </span>

                        ) : (
                          <span className="font-semibold">{label}</span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <FrozenAccountModal
        isOpen={showFrozenModal}
        onClose={() => setShowFrozenModal(false)}
      />
    </React.Fragment>
  );
}
