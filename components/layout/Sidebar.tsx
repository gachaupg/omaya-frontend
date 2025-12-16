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
import { useDashboardI18n } from "@/lib/useDashboardI18n";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useDashboardI18n();

  const handleNavClick = undefined as any; // rely on <Link> client navigation entirely
  const { isDark } = useTheme();

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
              // Normalize paths for comparison (handle trailing slashes)
              const normalizedPathname = pathname?.replace(/\/$/, "") || "";
              const normalizedHref = item.href.replace(/\/$/, "");
              const isActive =
                normalizedHref === "/dashboard"
                  ? normalizedPathname === normalizedHref
                  : normalizedPathname === normalizedHref ||
                  (normalizedPathname &&
                    normalizedPathname.startsWith(normalizedHref + "/"));
              const label = t(item.labelKey, item.labelKey);
              return (
                <li key={item.labelKey}>
                  <Link
                    prefetch={true}
                    href={item.href}
                    className={clsx(
                      "flex items-center px-3 md:px-4 lg:px-6 py-3 rounded-lg text-sm md:text-base font-medium gap-2 md:gap-3 lg:gap-4 transition",
                      "w-full",
                      isActive
                        ? "bg-[#E1E1E1] dark:bg-[#303038] text-muted-foreground dark:text-white"
                        : "text-[#727272] dark:hover:text-white hover:bg-white dark:hover:bg-[#23262F]"
                    )}
                  >
                    {item.labelKey === "navigation.exchange" ? (
                      <>

                        <img
                          className=" w-9 h-8 object-cover "
                          src="https://res.cloudinary.com/pitz/image/upload/v1764568507/uil_exchange_1_okxkvb.png"
                          alt=""
                        />
                      </>
                    ) : (
                      <img
                        src={item.icon}
                        alt={label + " icon"}
                        className="ml-2 w-5 h-5 md:w-6 md:h-6 object-contain flex-shrink-0"
                      />
                    )}
                    {item.labelKey === "navigation.exchange" ? (
                      <span

                      >
                        <span className="flex items-center justify-center gap-0.5">
                          <span
                            className={
                              isActive
                                ? "text-[#727272] dark:text-white text-base uppercase font-bold"
                                : "text-[#727272] text-base uppercase font-bold"
                            }
                          >
                            Money
                          </span>

                          <span className="relative mt-2">
                            {/* Light-mode image (always shown in light mode, and in dark mode when inactive) */}
                            <img
                              src="https://res.cloudinary.com/pitz/image/upload/v1764661972/Group_6_ohph9q.png"
                              className={isActive ? "block dark:hidden" : "block"}
                              alt=""
                            />

                            {/* Dark-mode active image (shown only when active + dark mode) */}
                            {isActive && (
                              <img
                                src="https://res.cloudinary.com/pitz/image/upload/v1764663236/Group_7_ichuyz.png"
                                className="hidden dark:block"
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
                              src="https://res.cloudinary.com/pitz/image/upload/v1764698096/Group_9_momvgo.png"
                              className={isActive ? "block dark:hidden" : "block"}
                              alt=""
                            />

                            {/* Dark-mode active image: only visible in dark mode AND active */}
                            {isActive && (
                              <img
                                src="https://res.cloudinary.com/pitz/image/upload/v1764698106/Group_8_hjhlxe.png"
                                className="hidden dark:block"
                                alt=""
                              />
                            )}
                          </span>
                        </span>
                      </span>
                    ) : (
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
              const label = t(item.labelKey, item.labelKey);
              return (
                <li key={item.labelKey} className="snap-start">
                  <Link
                    href={item.href}
                    className={clsx(
                      "flex items-center justify-center px-2.5 sm:px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium gap-1.5 sm:gap-2 whitespace-nowrap transition min-h-[44px]",
                      isActive
                        ? "dark:bg-[#303038] bg-[#E1E1E1] dark:text-white text-muted-foreground"
                        : "text-[#727272] dark:hover:text-white hover:text-[#051015] dark:hover:bg-[#23262F] hover:bg-gray-100"
                    )}
                  >
                    {item.labelKey === "navigation.exchange" ? (
                      <>
                        <img
                          className="w-7 h-6 sm:w-8 sm:h-7 object-cover flex-shrink-0"
                          src="https://res.cloudinary.com/pitz/image/upload/v1764568507/uil_exchange_1_okxkvb.png"
                          alt=""
                        />
                        <span
                          className={clsx(
                            "flex items-center justify-center gap-0.5 sm:gap-1",
                            isActive
                              ? "font-bold text-white text-sm sm:text-base"
                              : "font-normal text-[#727272] text-xs sm:text-sm"
                          )}
                        >
                          <span className={isActive ? "dark:text-white text-muted-foreground text-sm sm:text-base uppercase font-bold" : "text-[#727272] text-xs sm:text-sm uppercase font-bold"}>
                            Money
                          </span>
                          <img
                            className="mt-1 w-3 h-3 sm:w-4 sm:h-4"
                            src={isActive

                              ? isDark ? "https://res.cloudinary.com/pitz/image/upload/v1764663236/Group_7_ichuyz.png"
                                : "https://res.cloudinary.com/pitz/image/upload/v1764661972/Group_6_ohph9q.png"
                              : "https://res.cloudinary.com/pitz/image/upload/v1764661972/Group_6_ohph9q.png"
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
                          className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0"
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
                              className={isActive ? "dark:text-white text-muted-foreground text-sm sm:text-base font-bold" : "text-muted-foreground text-xs sm:text-sm font-bold"}
                            >
                              E
                            </span>
                            <img
                              className="mt-2 -ml-0.5"
                              style={{ maxWidth: 'none' }}
                              src={
                                isActive

                                  ? isDark ? "https://res.cloudinary.com/pitz/image/upload/v1764698106/Group_8_hjhlxe.png"
                                    : "https://res.cloudinary.com/pitz/image/upload/v1764698096/Group_9_momvgo.png"
                                  : "https://res.cloudinary.com/pitz/image/upload/v1764698096/Group_9_momvgo.png"
                              }
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
    </React.Fragment>
  );
}
