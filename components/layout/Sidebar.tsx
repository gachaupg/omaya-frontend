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
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden w-full overflow-x-auto bg-[#1D1D23] sticky top-0 z-40">
        <nav className="px-4">
          <ul className="flex space-x-2 py-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={clsx(
                      "flex items-center px-4 py-2 rounded-lg text-sm font-medium gap-2 whitespace-nowrap transition",
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
                    {item.label}
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
