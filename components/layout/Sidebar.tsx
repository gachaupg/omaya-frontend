"use client";

/**
 * Sidebar.tsx – auto‑generated placeholder
 */

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { navItems } from "@/utils/data";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden md:block  left-0 rounded-xl shadow-lg",
          "w-[222.28px]"
        )}
      >
        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    prefetch={true}
                    href={item.href}
                    className={clsx(
                      "flex items-center px-6 py-3 rounded-lg text-base font-medium gap-4 transition",
                      "w-full sm:w-auto",
                      isActive
                        ? "bg-[#303038] text-white"
                        : "text-[#727272] hover:text-white hover:bg-[#23262F]"
                    )}
                  >
                    <img
                      src={item.icon}
                      alt={item.label + " icon"}
                      className="w-6 h-6 object-contain"
                    />
                    {item.label === "Express" ? (
                      <span
                        className={clsx(
                          "flex items-center justify-center gap-1",
                          isActive
                            ? "font-bold text-white text-base"
                            : "font-normal text-[#727272] text-sm uppercase"
                        )}
                      >
                       {
                        isActive? <span className="flex items-center justify-center">
                          <img
                            src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
                            alt=""
                          />
                          <img
                            className="mt-2"
                            src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                            alt=""
                          />
                        </span>:<span className="flex items-center justify-center">
                          <img
                            src="https://res.cloudinary.com/pitz/image/upload/v1752429831/Express_vkggc2.png"
                            alt=""
                          />
                          <img
                            className="mt-2"
                            src="https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png"
                            alt=""
                          />
                        </span>
                       }
                      </span>
                    ) : (
                      item.label
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
          <ul className="flex space-x-4 py-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={clsx(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium gap-2 whitespace-nowrap transition",
                      isActive
                        ? "bg-[#303038] text-white"
                        : "text-[#727272] hover:text-white hover:bg-[#23262F]"
                    )}
                  >
                    <img
                      src={item.icon}
                      alt={item.label + " icon"}
                      className="w-5 h-5 object-contain"
                    />
                    {item.label === "Express" ? (
                      <span
                        className={clsx(
                          "flex items-center justify-center gap-1",
                          isActive
                            ? "font-bold text-white text-base"
                            : "font-normal text-[#727272] text-sm uppercase"
                        )}
                      >
                        <span
                          className={isActive ? "font-bold" : "font-normal"}
                        >
                          Express
                        </span>
                        <svg
                          width="28"
                          height="32"
                          viewBox="0 0 32 32"
                          className="mx-0"
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
                          {isActive ? "Change" : "CHANGE"}
                        </span>
                      </span>
                    ) : (
                      item.label
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
