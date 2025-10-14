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

  const handleNavClick = (item: (typeof navItems)[0], e: React.MouseEvent) => {
    const isInSection =
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href ||
          (pathname && pathname.startsWith(item.href + "/"));

    if (isInSection) {
      e.preventDefault();
      router.push(item.href);
      router.refresh();
    }
  };
  const { isDark } = useTheme();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={clsx("hidden md:block  left-0  ", "w-[222.28px]")}>
        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href ||
                    (pathname && pathname.startsWith(item.href + "/"));
              const label = t(item.labelKey, item.labelKey);
              return (
                <li key={item.labelKey}>
                  <Link
                    prefetch={true}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={clsx(
                      "flex items-center px-6 py-3 rounded-lg text-base font-medium gap-4 transition",
                      "w-full sm:w-auto",
                      isActive
                        ? "bg-[#E1E1E1] dark:bg-[#303038] text-[#051015] dark:text-white"
                        : "text-[#727272] dark:hover:text-white hover:bg-white dark:hover:bg-[#23262F]"
                    )}
                  >
                    <img
                      src={item.icon}
                      alt={label + " icon"}
                      className="w-6 h-6 object-contain"
                    />
                    {item.labelKey === "navigation.express" ? (
                      <span
                        className={clsx(
                          "flex items-center justify-center gap-1",
                          isActive
                            ? "font-bold text-white text-base"
                            : "font-normal text-[#727272] text-sm uppercase"
                        )}
                      >
                        {isActive ? (
                          isDark ? (
                            <span className="flex items-center justify-center">
                              <span className="text-white">E</span>
                              <img
                                className="mt-2"
                                src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                                alt=""
                              />
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                                                          <span className="text-white">E</span>

                              <img
                                className="mt-2"
                                src="https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png"
                                alt=""
                              />
                            </span>
                          )
                        ) : (
                          <span className="flex items-center justify-center">
                                                          <span className="text-[#727272] text-base uppercase font-bold">E</span>

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
      <div className="md:hidden w-full overflow-x-auto bg-[#1D1D23] sticky top-0 z-40">
        <nav className="px-6">
          <ul className="flex items-center space-x-4 py-3">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href ||
                    (pathname && pathname.startsWith(item.href + "/"));
              const label = t(item.labelKey, item.labelKey);
              return (
                <li key={item.labelKey}>
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={clsx(
                      "flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium gap-2 whitespace-nowrap transition",
                      isActive
                        ? "bg-[#303038] text-white"
                        : "text-[#727272] hover:text-white hover:bg-[#23262F]"
                    )}
                  >
                    <img
                      src={item.icon}
                      alt={label + " icon"}
                      className="w-5 h-5 object-contain"
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
                          {t("navigation.express", "Express")}
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
