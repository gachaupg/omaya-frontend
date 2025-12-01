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
    <>
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
                        ? "bg-[#E1E1E1] dark:bg-[#303038] text-[#051015] dark:text-white"
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
                    {item.labelKey === "navigation.express" ? (
                      <span
                        className={clsx(
                          "flex items-center justify-center gap-0.5",
                          isActive
                            ? "font-bold text-white text-base"
                            : "font-normal text-[#727272] text-sm uppercase"
                        )}
                      >
                        {isActive ? (
                          isDark ? (
                            <span className="flex items-center justify-center gap-0.5">
                              <span className="text-[#727272] text-base uppercase font-bold">
                                E
                              </span>

                              <img
                                className="mt-2"
                                src="https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png"
                                alt=""
                              />
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-0.5">
                              <span className="text-[#727272] text-base uppercase font-bold">
                                E
                              </span>

                              <img
                                className="mt-2"
                                src="https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png"
                                alt=""
                              />
                            </span>
                          )
                        ) : (
                          <span className="flex items-center justify-center gap-0.5">
                            <span className="text-[#727272] text-base uppercase font-bold">
                              E
                            </span>

                            <img
                              className="mt-2"
                              src="https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png"
                              alt=""
                            />
                          </span>
                        )}
                      </span>
                    ) : (
                      label
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden w-full dark:bg-[#1D1D23] bg-white sticky top-0 z-40 relative">
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
                        ? "dark:bg-[#303038] bg-[#E1E1E1] dark:text-white text-[#051015]"
                        : "text-[#727272] dark:hover:text-white hover:text-[#051015] dark:hover:bg-[#23262F] hover:bg-gray-100"
                    )}
                  >
                    <img
                      src={item.icon}
                      alt={label + " icon"}
                      className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0"
                    />
                    {item.labelKey === "navigation.express" ? (
                      <span
                        className={clsx(
                          "flex items-center justify-center gap-1 min-h-[20px]",
                          isActive
                            ? "font-bold text-white text-base"
                            : "font-normal text-[#727272] text-sm uppercase"
                        )}
                      >
                        <span
                          className={isActive ? "font-bold" : "font-normal"}
                        >
                          {t("navigation.express", "E")}
                        </span>
                        <svg
                          width="28"
                          height="32"
                          viewBox="0 0 32 32"
                          className="mx-0 flex-shrink-0"
                          style={{ minWidth: 28, verticalAlign: "middle" }}
                        >
                          {/* Left stroke (upper, green) */}
                          <line
                            x1="7"
                            y1="4"
                            x2="16"
                            y2="16"
                            stroke="#1D8751"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          {/* Left stroke (lower, white, very long) */}
                          <line
                            x1="16"
                            y1="16"
                            x2="28"
                            y2="32"
                            stroke={isActive ? "#fff" : "#727272"}
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          {/* Right stroke (long, white) */}
                          <line
                            x1="25"
                            y1="4"
                            x2="7"
                            y2="28"
                            stroke={isActive ? "#fff" : "#727272"}
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span
                          className={isActive ? "font-bold" : "font-normal"}
                          style={{ marginLeft: "-6px" }}
                        >
                          {isActive
                            ? t("navigation.expressChange", "Change")
                            : t(
                                "navigation.expressChange",
                                "CHANGE"
                              ).toUpperCase()}
                        </span>
                      </span>
                    ) : (
                      label
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
